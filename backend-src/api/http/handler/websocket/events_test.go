package websocket

import (
	gorilla "github.com/gorilla/websocket"
	"github.com/portainer/portainer/api/http/security"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestEventHubPublishesOrderedInvalidations(t *testing.T) {
	hub := newEventHub()
	updates, unsubscribe, ready := hub.subscribe()
	defer unsubscribe()

	require.Equal(t, eventMessage{Version: 1, Type: "ready"}, ready)

	hub.publish()
	hub.publish()

	for expectedID := uint64(1); expectedID <= 2; expectedID++ {
		select {
		case update := <-updates:
			require.Equal(t, eventMessage{
				Version: eventProtocolVersion,
				ID:      expectedID,
				Type:    "invalidate",
			}, update)
		case <-time.After(time.Second):
			t.Fatal("expected an invalidation event")
		}
	}

	require.Len(t, hub.subscribers, 1)
	unsubscribe()
	require.Empty(t, hub.subscribers)
}

func TestEventHubDisconnectsSlowSubscribers(t *testing.T) {
	hub := newEventHub()
	updates, unsubscribe, _ := hub.subscribe()
	defer unsubscribe()

	for range eventSubscriberBuffer + 1 {
		hub.publish()
	}

	require.Empty(t, hub.subscribers)

	for range eventSubscriberBuffer {
		_, ok := <-updates
		require.True(t, ok)
	}
	_, ok := <-updates
	require.False(t, ok)
}

func TestEventHubSnapshotRefreshAdvancesSequenceWithoutBroadcast(t *testing.T) {
	hub := newEventHub()
	updates, unsubscribe, _ := hub.subscribe()
	defer unsubscribe()

	refresh := hub.snapshotRefresh(7)
	require.Equal(t, eventMessage{
		Version:    eventProtocolVersion,
		ID:         1,
		Type:       "snapshot",
		EndpointID: 7,
	}, refresh)

	select {
	case <-updates:
		t.Fatal("snapshot refresh should only be sent to its requesting connection")
	default:
	}

	hub.publish()
	require.Equal(t, uint64(2), (<-updates).ID)
}

func TestEventHubScopesEngineInvalidations(t *testing.T) {
	hub := newEventHub()
	first, stopFirst, _ := hub.subscribeEndpoint(1)
	defer stopFirst()
	second, stopSecond, _ := hub.subscribeEndpoint(2)
	defer stopSecond()
	global, stopGlobal, _ := hub.subscribe()
	defer stopGlobal()

	hub.publishEndpoint(1)
	require.Equal(t, "invalidate", (<-first).Type)
	for _, updates := range []<-chan eventMessage{second, global} {
		select {
		case <-updates:
			t.Fatal("engine activity reached a different environment subscriber")
		default:
		}
	}

	hub.publish()
	for _, updates := range []<-chan eventMessage{first, second, global} {
		require.Equal(t, "invalidate", (<-updates).Type)
	}
}

type revocableEventBouncer struct {
	security.BouncerService
	revoked atomic.Bool
}

func (b *revocableEventBouncer) AuthenticatedAccess(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if b.revoked.Load() {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func TestEventConnectionClosesAfterSessionRevocation(t *testing.T) {
	bouncer := &revocableEventBouncer{}
	handler := NewHandler(nil, bouncer)
	server := httptest.NewServer(handler)
	defer server.Close()
	connection, _, err := gorilla.DefaultDialer.Dial("ws"+strings.TrimPrefix(server.URL, "http")+"/websocket/events", nil)
	require.NoError(t, err)
	defer connection.Close()
	require.NoError(t, connection.SetReadDeadline(time.Now().Add(3*time.Second)))
	var ready eventMessage
	require.NoError(t, connection.ReadJSON(&ready))
	require.Equal(t, "ready", ready.Type)
	bouncer.revoked.Store(true)
	handler.PublishMutation()
	_, _, err = connection.ReadMessage()
	require.Error(t, err, "revoked session must lose its event subscription")
}
