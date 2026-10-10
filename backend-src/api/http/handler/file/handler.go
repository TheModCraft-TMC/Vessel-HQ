package file

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"

	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/pkg/featureflags"

	"github.com/klauspost/compress/gzhttp"
)

// Handler represents an HTTP API handler for managing static files.
type Handler struct {
	http.Handler
	wasInstanceDisabled func() bool
	proxiedFrontend     bool
}

// NewHandler creates a handler to serve static files.
func NewHandler(assetPublicPath string, csp bool, wasInstanceDisabled func() bool) *Handler {
	frontendHandler, proxiedFrontend := newFrontendHandler(
		assetPublicPath,
		os.Getenv("PORTAINER_FRONTEND_ORIGIN"),
	)
	h := &Handler{
		Handler: security.MWSecureHeaders(
			gzhttp.GzipHandler(frontendHandler),
			featureflags.IsEnabled("hsts"),
			csp && !proxiedFrontend,
		),
		wasInstanceDisabled: wasInstanceDisabled,
		proxiedFrontend:     proxiedFrontend,
	}

	return h
}

func newFrontendHandler(assetPublicPath, frontendOrigin string) (http.Handler, bool) {
	if frontendOrigin == "" {
		return http.FileServer(http.Dir(assetPublicPath)), false
	}

	target, err := url.Parse(frontendOrigin)
	if err != nil {
		return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			http.Error(w, "invalid frontend origin", http.StatusInternalServerError)
		}), true
	}

	proxy := httputil.NewSingleHostReverseProxy(target)
	previousDirector := proxy.Director
	proxy.Director = func(request *http.Request) {
		originalHost := request.Host
		originalScheme := "http"
		if request.TLS != nil {
			originalScheme = "https"
		}

		previousDirector(request)
		request.Header.Set("X-Forwarded-Host", originalHost)
		request.Header.Set("X-Forwarded-Proto", originalScheme)
	}

	return proxy, true
}

func isHTML(acceptContent []string) bool {
	for _, accept := range acceptContent {
		if strings.Contains(accept, "text/html") {
			return true
		}
	}

	return false
}

func (handler *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if handler.wasInstanceDisabled() {
		if r.RequestURI == "/" || r.RequestURI == "/index.html" {
			http.Redirect(w, r, "/timeout.html", http.StatusTemporaryRedirect)

			return
		}
	} else {
		if strings.HasPrefix(r.RequestURI, "/timeout.html") {
			http.Redirect(w, r, "/", http.StatusTemporaryRedirect)

			return
		}
	}

	if r.RequestURI == "/" || strings.HasSuffix(r.RequestURI, ".html") {
		w.Header().Set("Permissions-Policy", strings.Join(permissions, ","))
	}

	if !handler.proxiedFrontend {
		if !isHTML(r.Header["Accept"]) {
			w.Header().Set("Cache-Control", "max-age=31536000")
		} else {
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		}
	}

	handler.Handler.ServeHTTP(w, r)
}
