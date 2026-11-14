// Package webhookgateway provides an optional signed fan-out gateway to existing
// Vessel stack/service webhooks. Targets are local webhook IDs, never URLs.
package webhookgateway

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Target struct {
	Kind  string `json:"kind"`
	Token string `json:"token"`
}
type Route struct {
	ID      string   `json:"id"`
	Secret  string   `json:"secret"`
	Targets []Target `json:"targets"`
}
type Config struct {
	Routes []Route `json:"routes"`
}
type Dispatch func(context.Context, Target) int
type Reserve func(context.Context, string, string, string) error
type Complete func(context.Context, string, string, int, int) error

var ErrDuplicate = errors.New("webhook delivery already accepted")
var identifier = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$`)

type Gateway struct {
	routes   map[string]Route
	dispatch Dispatch
	reserve  Reserve
	complete Complete
	now      func() time.Time
	inflight chan struct{}
}

// FromEnvironment leaves the route unavailable unless configured. Configuration
// contains credentials and must be a private regular file, supplied by operators.
func FromEnvironment(dispatch Dispatch, reserve Reserve, complete Complete) (http.Handler, error) {
	file := os.Getenv("VESSEL_WEBHOOK_GATEWAY_CONFIG")
	if file == "" {
		return nil, nil
	}
	f, err := os.Open(file)
	if err != nil {
		return nil, errors.New("unable to open webhook gateway configuration")
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil || !info.Mode().IsRegular() || info.Mode().Perm()&0077 != 0 || info.Size() > 1<<20 {
		return nil, errors.New("webhook gateway configuration must be a private regular file of at most 1 MiB")
	}
	var config Config
	decoder := json.NewDecoder(io.LimitReader(f, 1<<20+1))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&config); err != nil {
		return nil, errors.New("invalid webhook gateway configuration")
	}
	var extra any
	if decoder.Decode(&extra) != io.EOF {
		return nil, errors.New("invalid webhook gateway configuration")
	}
	return New(config, dispatch, reserve, complete)
}

func New(config Config, dispatch Dispatch, reserve Reserve, complete Complete) (*Gateway, error) {
	if len(config.Routes) == 0 || len(config.Routes) > 64 || dispatch == nil || reserve == nil || complete == nil {
		return nil, errors.New("gateway requires 1 to 64 routes, dispatcher and persistent audit")
	}
	g := &Gateway{routes: map[string]Route{}, dispatch: dispatch, reserve: reserve, complete: complete, now: time.Now, inflight: make(chan struct{}, 16)}
	for _, route := range config.Routes {
		if !identifier.MatchString(route.ID) || len(route.Secret) < 32 || len(route.Secret) > 1024 || len(route.Targets) == 0 || len(route.Targets) > 16 {
			return nil, errors.New("invalid webhook gateway route")
		}
		if _, exists := g.routes[route.ID]; exists {
			return nil, errors.New("duplicate webhook gateway route")
		}
		seen := map[string]bool{}
		for _, target := range route.Targets {
			id, err := uuid.Parse(target.Token)
			if err != nil || id == uuid.Nil || id.String() != target.Token || (target.Kind != "stack" && target.Kind != "service") || seen[target.Kind+target.Token] {
				return nil, errors.New("invalid or duplicate local webhook target")
			}
			seen[target.Kind+target.Token] = true
		}
		route.Targets = append([]Target(nil), route.Targets...)
		g.routes[route.ID] = route
	}
	return g, nil
}

func (g *Gateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", http.MethodPost)
		http.Error(w, "POST required", http.StatusMethodNotAllowed)
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/api/webhook-gateway/")
	route, exists := g.routes[id]
	if !exists || r.URL.RawQuery != "" {
		http.NotFound(w, r)
		return
	}
	timestamp, delivery := r.Header.Get("X-Vessel-Timestamp"), r.Header.Get("X-Vessel-Delivery")
	ts, err := strconv.ParseInt(timestamp, 10, 64)
	now := g.now().Unix()
	if err != nil || ts < now-300 || ts > now+300 || strconv.FormatInt(ts, 10) != timestamp || !identifier.MatchString(delivery) || len(delivery) < 16 {
		http.Error(w, "invalid webhook authentication", http.StatusUnauthorized)
		return
	}
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 64<<10))
	if err != nil {
		http.Error(w, "webhook body exceeds limit", http.StatusRequestEntityTooLarge)
		return
	}
	signature, err := hex.DecodeString(strings.TrimPrefix(r.Header.Get("X-Vessel-Signature"), "sha256="))
	mac := hmac.New(sha256.New, []byte(route.Secret))
	mac.Write([]byte(id + "\n" + timestamp + "\n" + delivery + "\n"))
	mac.Write(body)
	if err != nil || !hmac.Equal(signature, mac.Sum(nil)) {
		http.Error(w, "invalid webhook authentication", http.StatusUnauthorized)
		return
	}
	select {
	case g.inflight <- struct{}{}:
		defer func() { <-g.inflight }()
	default:
		w.Header().Set("Retry-After", "1")
		http.Error(w, "webhook gateway is busy; delivery was not accepted", http.StatusTooManyRequests)
		return
	}
	digest := sha256.Sum256(body)
	if err := g.reserve(r.Context(), id, delivery, hex.EncodeToString(digest[:])); err != nil {
		if errors.Is(err, ErrDuplicate) {
			http.Error(w, "delivery already accepted; inspect activity log before retrying", http.StatusConflict)
		} else {
			http.Error(w, "unable to persist delivery audit", http.StatusServiceUnavailable)
		}
		return
	}
	// A reservation is durable before side effects. Partial deliveries are not
	// automatically replayed, since an earlier target may already have deployed.
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute)
	defer cancel()
	succeeded, failed := 0, 0
	for _, target := range route.Targets {
		if ctx.Err() != nil {
			failed++
			continue
		}
		code := g.dispatch(ctx, target)
		if code >= 200 && code < 300 {
			succeeded++
		} else {
			failed++
		}
	}
	auditCtx, auditCancel := context.WithTimeout(context.WithoutCancel(r.Context()), 5*time.Second)
	defer auditCancel()
	if err := g.complete(auditCtx, id, delivery, succeeded, failed); err != nil {
		http.Error(w, "delivery attempted; completion audit unavailable", http.StatusServiceUnavailable)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if failed > 0 {
		w.WriteHeader(http.StatusBadGateway)
	} else {
		w.WriteHeader(http.StatusAccepted)
	}
	_ = json.NewEncoder(w).Encode(map[string]int{"succeeded": succeeded, "failed": failed})
}

// LocalDispatch forwards only allowlisted target kinds to existing handlers. It
// drops all caller headers, query parameters and payload rather than forwarding
// external credentials or letting request bodies choose a deployment target.
func LocalDispatch(stacks, services http.Handler) Dispatch {
	return func(ctx context.Context, target Target) int {
		var handler http.Handler
		var path string
		switch target.Kind {
		case "stack":
			handler, path = stacks, "/stacks/webhooks/"+target.Token
		case "service":
			handler, path = services, "/webhooks/"+target.Token
		default:
			return http.StatusBadRequest
		}
		if handler == nil {
			return http.StatusServiceUnavailable
		}
		r, err := http.NewRequestWithContext(ctx, http.MethodPost, path, bytes.NewReader(nil))
		if err != nil {
			return http.StatusInternalServerError
		}
		result := &discardResponse{header: http.Header{}, status: http.StatusOK}
		handler.ServeHTTP(result, r)
		return result.status
	}
}

type discardResponse struct {
	header http.Header
	status int
	wrote  bool
}

func (w *discardResponse) Header() http.Header { return w.header }
func (w *discardResponse) WriteHeader(code int) {
	if !w.wrote {
		w.status = code
		w.wrote = true
	}
}
func (w *discardResponse) Write(data []byte) (int, error) { w.wrote = true; return len(data), nil }
