package websocket

import (
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes/cli"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// Handler is the HTTP handler used to handle websocket operations.
type Handler struct {
	*mux.Router
	DataStore                   dataservices.DataStore
	SignatureService            portainer.DigitalSignatureService
	ReverseTunnelService        portainer.ReverseTunnelService
	KubernetesClientFactory     *cli.ClientFactory
	ProxyManager                *proxy.Manager
	requestBouncer              security.BouncerService
	connectionUpgrader          websocket.Upgrader
	kubernetesTokenCacheManager *kubernetes.TokenCacheManager
	eventHub                    *eventHub
	DockerClientFactory         *dockerclient.ClientFactory
	engineWatchMu               sync.Mutex
	engineWatches               map[int]*engineWatch
}

// NewHandler creates a handler to manage websocket operations.
func NewHandler(kubernetesTokenCacheManager *kubernetes.TokenCacheManager, bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router:                      mux.NewRouter(),
		connectionUpgrader:          websocket.Upgrader{CheckOrigin: checkOrigin},
		requestBouncer:              bouncer,
		kubernetesTokenCacheManager: kubernetesTokenCacheManager,
		eventHub:                    newEventHub(),
		engineWatches:               map[int]*engineWatch{},
	}
	h.PathPrefix("/websocket/exec").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.websocketExec)))
	h.PathPrefix("/websocket/attach").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.websocketAttach)))
	h.PathPrefix("/websocket/pod").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.websocketPodExec)))
	h.PathPrefix("/websocket/kubernetes-shell").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.websocketShellPodExec)))
	h.Handle("/websocket/events",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.websocketEvents))).Methods("GET")
	h.Handle("/websocket/logs",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.websocketLogs))).Methods("GET")
	return h
}

func checkOrigin(r *http.Request) bool {
	origins := r.Header.Values("Origin")
	if len(origins) == 0 {
		return true
	}
	if len(origins) != 1 {
		return false
	}
	origin, err := url.Parse(origins[0])
	if err != nil || origin.Host == "" || (origin.Scheme != "http" && origin.Scheme != "https") {
		return false
	}
	if strings.EqualFold(origin.Host, r.Host) {
		return true
	}

	// Next.js rewrites the upstream Host and overwrites X-Forwarded-Host
	// with the original Host. Only consult it on the local proxy hop.
	peer, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil || !net.ParseIP(peer).IsLoopback() {
		return false
	}
	if site := r.Header.Get("Sec-Fetch-Site"); site != "" && site != "same-origin" {
		return false
	}
	forwarded := r.Header.Values("X-Forwarded-Host")
	return len(forwarded) == 1 && strings.EqualFold(origin.Host, forwarded[0])
}

// PublishMutation notifies connected browsers that cached API data may have
// changed. The event deliberately carries no resource names or identifiers.
func (h *Handler) PublishMutation() {
	h.eventHub.publish()
}
