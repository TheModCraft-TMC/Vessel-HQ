package websocket

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/endpointutils"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/websocket"
)

type eventHub struct {
	mu          sync.RWMutex
	nextID      uint64
	subscribers map[chan eventMessage]int
}

const (
	eventProtocolVersion  = 1
	eventSubscriberBuffer = 64
	eventSnapshotRefresh  = 15 * time.Second
)

type eventMessage struct {
	Version    int    `json:"version"`
	ID         uint64 `json:"id"`
	Type       string `json:"type"`
	EndpointID int    `json:"endpointId,omitempty"`
}

func newEventHub() *eventHub {
	return &eventHub{subscribers: map[chan eventMessage]int{}}
}

func (hub *eventHub) subscribe() (<-chan eventMessage, func(), eventMessage) {
	return hub.subscribeEndpoint(0)
}

func (hub *eventHub) subscribeEndpoint(endpointID int) (<-chan eventMessage, func(), eventMessage) {
	updates := make(chan eventMessage, eventSubscriberBuffer)
	hub.mu.Lock()
	hub.subscribers[updates] = endpointID
	ready := eventMessage{
		Version: eventProtocolVersion,
		ID:      hub.nextID,
		Type:    "ready",
	}
	hub.mu.Unlock()
	return updates, func() {
		hub.mu.Lock()
		if _, ok := hub.subscribers[updates]; ok {
			delete(hub.subscribers, updates)
			close(updates)
		}
		hub.mu.Unlock()
	}, ready
}

func (hub *eventHub) publish() {
	hub.publishEndpoint(0)
}

func (hub *eventHub) publishEndpoint(endpointID int) {
	hub.mu.Lock()
	defer hub.mu.Unlock()

	event := hub.nextInvalidationLocked()

	for subscriber, scope := range hub.subscribers {
		if endpointID != 0 && scope != endpointID {
			continue
		}
		select {
		case subscriber <- event:
		default:
			// A slow consumer must reconnect. The ready message sent on the new
			// connection causes a full active-query resynchronization, which is
			// safer than silently dropping an invalidation.
			delete(hub.subscribers, subscriber)
			close(subscriber)
		}
	}
}

func (hub *eventHub) snapshotRefresh(endpointID int) eventMessage {
	hub.mu.Lock()
	defer hub.mu.Unlock()

	event := hub.nextInvalidationLocked()
	event.Type = "snapshot"
	event.EndpointID = endpointID
	return event
}

func (hub *eventHub) nextInvalidationLocked() eventMessage {
	hub.nextID++
	return eventMessage{
		Version: eventProtocolVersion,
		ID:      hub.nextID,
		Type:    "invalidate",
	}
}

func (h *Handler) websocketEvents(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var endpoint *portainer.Endpoint
	endpointID := 0
	if raw := r.URL.Query().Get("endpointId"); raw != "" {
		id, err := strconv.Atoi(raw)
		if err != nil || id <= 0 {
			return httperror.BadRequest("Invalid environment ID", nil)
		}
		endpoint, err = h.DataStore.Endpoint().Endpoint(portainer.EndpointID(id))
		if err != nil {
			return httperror.NotFound("Environment unavailable", nil)
		}
		if err := h.requestBouncer.AuthorizedEndpointOperation(r, endpoint); err != nil {
			return httperror.Forbidden("Environment access denied", nil)
		}
		endpointID = id
	}
	connection, err := h.connectionUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return httperror.InternalServerError("Unable to upgrade event stream connection", err)
	}
	defer func() { _ = connection.Close() }()

	// Read control frames and detect a closed browser promptly so the last
	// subscriber releases its shared engine stream. Bound both reads and writes.
	connection.SetReadLimit(1024)
	_ = connection.SetReadDeadline(time.Now().Add(75 * time.Second))
	connection.SetPongHandler(func(string) error {
		return connection.SetReadDeadline(time.Now().Add(75 * time.Second))
	})
	disconnected := make(chan struct{})
	go func() {
		defer close(disconnected)
		for {
			if _, _, err := connection.ReadMessage(); err != nil {
				return
			}
		}
	}()
	write := func(message eventMessage) error {
		if err := connection.SetWriteDeadline(time.Now().Add(5 * time.Second)); err != nil {
			return err
		}
		return connection.WriteJSON(message)
	}
	authorized := func() bool {
		// Reuse the normal authentication middleware, including token expiry,
		// logout revocation and API-key validation. Its response is discarded:
		// this HTTP connection has already been upgraded to a WebSocket.
		valid := false
		h.requestBouncer.AuthenticatedAccess(http.HandlerFunc(func(_ http.ResponseWriter, current *http.Request) {
			valid = true
		})).ServeHTTP(&eventAuthResponse{header: make(http.Header)}, r)
		if !valid {
			return false
		}
		// Refresh the user role, rather than retaining an administrator bypass
		// after demotion or deletion during a long-lived connection.
		token, err := security.RetrieveTokenData(r)
		if err != nil {
			return false
		}
		user, err := h.DataStore.User().Read(token.ID)
		if err != nil {
			return false
		}
		fresh := *token
		fresh.Role = user.Role
		request := r.WithContext(security.StoreTokenData(r, &fresh))
		if endpoint == nil {
			return true
		}
		current, err := h.DataStore.Endpoint().Endpoint(endpoint.ID)
		return err == nil && current.URL == endpoint.URL && current.Type == endpoint.Type &&
			h.requestBouncer.AuthorizedEndpointOperation(request, current) == nil
	}

	updates, unsubscribe, ready := h.eventHub.subscribeEndpoint(endpointID)
	defer unsubscribe()
	if endpoint != nil && endpointutils.IsDockerEndpoint(endpoint) && h.DockerClientFactory != nil {
		stop := h.retainEngineWatch(r.Context(), endpoint)
		defer stop()
	}

	// Clients refetch their active snapshot after this message. Registering the
	// subscriber before writing it closes the fetch-before-subscribe race.
	if err := write(ready); err != nil {
		return nil
	}

	keepalive := time.NewTicker(30 * time.Second)
	defer keepalive.Stop()
	snapshotRefresh := time.NewTicker(eventSnapshotRefresh)
	defer snapshotRefresh.Stop()

	for {
		select {
		case update, ok := <-updates:
			if !ok || !authorized() {
				return nil
			}
			if err := write(update); err != nil {
				return nil
			}
		case <-keepalive.C:
			if err := connection.WriteControl(websocket.PingMessage, nil, time.Now().Add(5*time.Second)); err != nil {
				return nil
			}
		case <-snapshotRefresh.C:
			if !authorized() {
				return nil
			}
			// The server owns refresh cadence so clients never run independent
			// HTTP polling loops. Mutations are still pushed immediately, while
			// this event covers changes originating in Docker, Kubernetes, or an
			// external actor, including providers without an engine stream.
			refreshScope := endpointID
			if endpoint != nil && endpointutils.IsDockerEndpoint(endpoint) && h.engineWatchHealthy(endpointID) {
				// Docker/Podman changes already arrive on the retained engine
				// watch. Only environment health lists need this fallback.
				refreshScope = 0
			}
			if err := write(h.eventHub.snapshotRefresh(refreshScope)); err != nil {
				return nil
			}
		case <-r.Context().Done():
			return nil
		case <-disconnected:
			return nil
		}
	}
}

type eventAuthResponse struct{ header http.Header }

func (w *eventAuthResponse) Header() http.Header       { return w.header }
func (*eventAuthResponse) WriteHeader(int)             {}
func (*eventAuthResponse) Write(p []byte) (int, error) { return len(p), nil }
