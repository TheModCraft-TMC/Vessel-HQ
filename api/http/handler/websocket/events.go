package websocket

import (
	"net/http"
	"sync"
	"time"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/websocket"
)

type eventHub struct {
	mu          sync.RWMutex
	nextID      uint64
	subscribers map[chan eventMessage]struct{}
}

const (
	eventProtocolVersion  = 1
	eventSubscriberBuffer = 64
	eventSnapshotRefresh  = 15 * time.Second
)

type eventMessage struct {
	Version int    `json:"version"`
	ID      uint64 `json:"id"`
	Type    string `json:"type"`
}

func newEventHub() *eventHub {
	return &eventHub{subscribers: map[chan eventMessage]struct{}{}}
}

func (hub *eventHub) subscribe() (<-chan eventMessage, func(), eventMessage) {
	updates := make(chan eventMessage, eventSubscriberBuffer)
	hub.mu.Lock()
	hub.subscribers[updates] = struct{}{}
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
	hub.mu.Lock()
	defer hub.mu.Unlock()

	event := hub.nextInvalidationLocked()

	for subscriber := range hub.subscribers {
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

func (hub *eventHub) snapshotRefresh() eventMessage {
	hub.mu.Lock()
	defer hub.mu.Unlock()

	return hub.nextInvalidationLocked()
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
	connection, err := h.connectionUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return httperror.InternalServerError("Unable to upgrade event stream connection", err)
	}
	defer connection.Close()

	updates, unsubscribe, ready := h.eventHub.subscribe()
	defer unsubscribe()

	// Clients refetch their active snapshot after this message. Registering the
	// subscriber before writing it closes the fetch-before-subscribe race.
	if err := connection.WriteJSON(ready); err != nil {
		return nil
	}

	keepalive := time.NewTicker(30 * time.Second)
	defer keepalive.Stop()
	snapshotRefresh := time.NewTicker(eventSnapshotRefresh)
	defer snapshotRefresh.Stop()

	for {
		select {
		case update, ok := <-updates:
			if !ok {
				return nil
			}
			if err := connection.WriteJSON(update); err != nil {
				return nil
			}
		case <-keepalive.C:
			if err := connection.WriteControl(websocket.PingMessage, nil, time.Now().Add(5*time.Second)); err != nil {
				return nil
			}
		case <-snapshotRefresh.C:
			// The server owns refresh cadence so clients never run independent
			// HTTP polling loops. Mutations are still pushed immediately, while
			// this event covers changes originating in Docker, Kubernetes, or an
			// external actor until native engine event fan-out is available.
			if err := connection.WriteJSON(h.eventHub.snapshotRefresh()); err != nil {
				return nil
			}
		case <-r.Context().Done():
			return nil
		}
	}
}
