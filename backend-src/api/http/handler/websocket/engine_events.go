package websocket

import (
	"context"
	"time"

	"github.com/moby/moby/client"
	portainer "github.com/portainer/portainer/api"
)

type engineWatch struct {
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
		go h.watchEngine(ctx, &copy)
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

func (h *Handler) watchEngine(ctx context.Context, endpoint *portainer.Endpoint) {
	backoff := time.Second
	for ctx.Err() == nil {
		cli, err := h.DockerClientFactory.CreateClientWithContext(ctx, endpoint, "", nil)
		if err == nil {
			h.consumeEngineEvents(ctx, cli, endpoint)
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

func (h *Handler) consumeEngineEvents(ctx context.Context, cli *client.Client, endpoint *portainer.Endpoint) {
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
		case _, ok := <-stream.Messages:
			if !ok {
				return
			}
			dirty = true
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
