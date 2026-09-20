package websocket

import (
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

	refresh := hub.snapshotRefresh()
	require.Equal(t, eventMessage{
		Version: eventProtocolVersion,
		ID:      1,
		Type:    "invalidate",
	}, refresh)

	select {
	case <-updates:
		t.Fatal("snapshot refresh should only be sent to its requesting connection")
	default:
	}

	hub.publish()
	require.Equal(t, uint64(2), (<-updates).ID)
}
