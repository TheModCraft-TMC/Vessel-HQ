package nativeextensions

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/portainer/portainer/api/http/security"
	domain "github.com/portainer/portainer/api/nativeextensions"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	librequest "github.com/portainer/portainer/pkg/libhttp/request"
)

type safetyTripRequest struct {
	Revision      int    `json:"revision"`
	UpdatedAt     int64  `json:"updatedAt"`
	PackageDigest string `json:"packageDigest"`
	Reason        string `json:"reason"`
}

var errRuntimeAlreadyDisabled = errors.New("extension already disabled")

func disableRecord(v *domain.Record) {
	v.Status = "disabled"
	v.Grants = []domain.Permission{}
	v.TrustedNativeUI = false
	v.ServiceReadEnabled = false
	if v.ImageAutomation != nil {
		v.ImageAutomation.Enabled = false
		v.ImageAutomation.Version++
	}
}

// Reports are admin-only and bound to the exact package revision. A late report
// from an old tab must never revoke a newly installed or approved revision.
func (h *Handler) safetyTrip(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var input safetyTripRequest
	if err := decode(w, r, &input); err != nil {
		return httperror.BadRequest("Invalid safety report", err)
	}
	switch input.Reason {
	case "request-rate", "restart-loop", "render-error", "repeated-errors":
	default:
		return httperror.BadRequest("Invalid safety reason", errors.New("unsupported reason"))
	}
	return h.tripRuntime(w, r, input)
}

func (h *Handler) tripRuntime(w http.ResponseWriter, r *http.Request, input safetyTripRequest) *httperror.HandlerError {
	tripped := false
	err := h.mutate(w, r, "extension.safety-trip."+input.Reason, func(v *domain.Record) error {
		if v.Status == "disabled" && v.Revision == input.Revision && v.Manifest.PackageDigest == input.PackageDigest {
			return errRuntimeAlreadyDisabled
		}
		if input.UpdatedAt <= 0 || v.UpdatedAt != input.UpdatedAt || v.Revision != input.Revision || v.Manifest.PackageDigest != input.PackageDigest {
			return httperror.Conflict("Extension changed; safety report discarded", domain.ErrDenied)
		}
		disableRecord(v)
		v.SafetyReason = input.Reason
		tripped = true
		return nil
	})
	if err == nil && h.PublishSafetyTrip != nil {
		security.MarkReadOnlyOperation(r)
		if tripped {
			h.PublishSafetyTrip()
		}
	}
	return err
}

type runtimeWindow struct {
	started time.Time
	count   int
}
type runtimeBudget struct {
	mu      sync.Mutex
	windows map[string]runtimeWindow
	streams map[string]int
}

func (b *runtimeBudget) retainStream(key string) (func(), bool) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.streams == nil {
		b.streams = make(map[string]int)
	}
	if b.streams[key] >= 4 || (b.streams[key] == 0 && len(b.streams) >= 512) {
		return nil, false
	}
	b.streams[key]++
	return func() {
		b.mu.Lock()
		defer b.mu.Unlock()
		b.streams[key]--
		if b.streams[key] == 0 {
			delete(b.streams, key)
		}
	}, true
}

func (b *runtimeBudget) resetExtension(id int) {
	b.mu.Lock()
	defer b.mu.Unlock()
	prefix := strconv.Itoa(id) + ":"
	for key := range b.windows {
		if strings.HasPrefix(key, prefix) {
			delete(b.windows, key)
		}
	}
}

func (b *runtimeBudget) allow(key string, now time.Time) (allowed, exceeded bool) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.windows == nil {
		b.windows = make(map[string]runtimeWindow)
	}
	for k, window := range b.windows {
		if now.Sub(window.started) >= time.Minute {
			delete(b.windows, k)
		}
	}
	window, exists := b.windows[key]
	if !exists {
		// Bound memory even under many distinct authenticated callers.
		if len(b.windows) >= 512 {
			return false, false
		}
		window.started = now
	}
	window.count++
	b.windows[key] = window
	return window.count <= 120, window.count > 120
}

// Server-side fallback for SDK calls that bypass the UI guard. Restricted users
// are throttled but cannot revoke an extension for every other user.
func (h *Handler) checkRuntimeBudget(w http.ResponseWriter, r *http.Request, revision int, digest string) *httperror.HandlerError {
	id, err := librequest.RetrieveNumericRouteVariableValue(r, "id")
	user, userErr := security.RetrieveRestrictedRequestContext(r)
	if err != nil || userErr != nil || id <= 0 {
		return httperror.Forbidden("Extension context required", domain.ErrDenied)
	}
	key := strconv.Itoa(id) + ":" + strconv.Itoa(revision) + ":" + strconv.Itoa(int(user.UserID))
	allowed, exceeded := h.runtimeRequests.allow(key, time.Now())
	if allowed {
		return nil
	}
	w.Header().Set("Retry-After", "60")
	if user.IsAdmin && exceeded {
		record, err := h.DataStore.NativeExtension().Read(id)
		if err == nil && domain.Authorize(*record, "ui.native", 0) == nil && record.Revision == revision && record.Manifest.PackageDigest == digest {
			// A private response writer keeps the trip's JSON out of the 429 body.
			if err := h.tripRuntime(&discardSafetyResponse{header: make(http.Header)}, r, safetyTripRequest{Revision: revision, UpdatedAt: record.UpdatedAt, PackageDigest: digest, Reason: "request-rate"}); err != nil {
				return err
			}
		}
	}
	return httperror.NewError(http.StatusTooManyRequests, "Extension request budget exceeded", errors.New("extension request rate exceeded"))
}

type discardSafetyResponse struct{ header http.Header }

func (w *discardSafetyResponse) Header() http.Header       { return w.header }
func (*discardSafetyResponse) WriteHeader(int)             {}
func (*discardSafetyResponse) Write(p []byte) (int, error) { return len(p), nil }
