package websocket

import (
	"context"
	"strings"
	"sync/atomic"
	"time"

	"github.com/moby/moby/api/types/events"
	"github.com/moby/moby/client"
	portainer "github.com/portainer/portainer/api"
)

type engineWatch struct {
	healthy    atomic.Bool
	cancel     context.CancelFunc
	references int
	url        string
	kind       portainer.EndpointType
}

// Each actively viewed engine has one shared stream, independent of browser
// count. Dropping the last subscriber cancels the stream and closes its client.
// Payloads never leave the host; only bounded environment invalidations do.
func (h *Handler) retainEngineWatch(parent context.Context, endpoint *portainer.Endpoint) func() {
	id := int(endpoint.ID)
	h.engineWatchMu.Lock()
	watch := h.engineWatches[id]
	if watch != nil && (watch.url != endpoint.URL || watch.kind != endpoint.Type) {
		watch.cancel()
		delete(h.engineWatches, id)
		watch = nil
	}
	if watch == nil {
		if len(h.engineWatches) >= 128 {
			h.engineWatchMu.Unlock()
			return func() {}
		}
		ctx, cancel := context.WithCancel(context.WithoutCancel(parent))
		watch = &engineWatch{cancel: cancel, url: endpoint.URL, kind: endpoint.Type}
		h.engineWatches[id] = watch
		copy := *endpoint
		go h.watchEngine(ctx, &copy, watch)
	}
	watch.references++
	h.engineWatchMu.Unlock()
	return func() {
		h.engineWatchMu.Lock()
		defer h.engineWatchMu.Unlock()
		watch.references--
		if watch.references == 0 {
			watch.cancel()
			if h.engineWatches[id] == watch {
				delete(h.engineWatches, id)
			}
		}
	}
}

func (h *Handler) watchEngine(ctx context.Context, endpoint *portainer.Endpoint, watch *engineWatch) {
	backoff := time.Second
	for ctx.Err() == nil {
		cli, err := h.DockerClientFactory.CreateClientWithContext(ctx, endpoint, "", nil)
		if err == nil {
			h.consumeEngineEvents(ctx, cli, endpoint, func() { watch.healthy.Store(true) })
			watch.healthy.Store(false)
			_ = cli.Close()
		}
		timer := time.NewTimer(backoff)
		select {
		case <-ctx.Done():
			timer.Stop()
			return
		case <-timer.C:
		}
		backoff = min(backoff*2, 30*time.Second)
	}
}

func (h *Handler) consumeEngineEvents(ctx context.Context, cli *client.Client, endpoint *portainer.Endpoint, observed func()) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	stream := cli.Events(ctx, client.EventsListOptions{})
	ticker := time.NewTicker(250 * time.Millisecond)
	defer ticker.Stop()
	dirty := false
	for {
		select {
		case <-ctx.Done():
			return
		case event, ok := <-stream.Messages:
			if !ok {
				return
			}
			if observed != nil {
				observed()
			}
			if engineEventChangesSnapshot(event) {
				dirty = true
			}
		case <-stream.Err:
			return
		case <-ticker.C:
			if dirty {
				dirty = false
				if h.ProxyManager != nil {
					h.ProxyManager.InvalidateOverviewCache()
				}
				h.eventHub.publishEndpoint(int(endpoint.ID))
			}
		}
	}
}

func (h *Handler) engineWatchHealthy(id int) bool {
	h.engineWatchMu.Lock()
	defer h.engineWatchMu.Unlock()
	watch := h.engineWatches[id]
	return watch != nil && watch.healthy.Load()
}

// Health checks and process viewers generate exec/top events without changing
// container metadata. Forwarding them refetches the whole console snapshot and
// can turn a read-only process view into a request feedback loop. Keep actual
// lifecycle, health-status and infrastructure changes, including unknown events.
func engineEventChangesSnapshot(event events.Message) bool {
	if event.Type != events.ContainerEventType {
		return true
	}
	action, _, _ := strings.Cut(string(event.Action), ":")
	if strings.HasPrefix(action, "exec_") {
		return false
	}
	switch events.Action(action) {
	case events.ActionAttach, events.ActionDetach, events.ActionResize,
		events.ActionTop, events.ActionCopy, events.ActionArchivePath, events.ActionExport:
		return false
	default:
		return true
	}
}
