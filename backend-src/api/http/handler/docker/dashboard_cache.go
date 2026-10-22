package docker

import (
	"context"
	"fmt"
	"strconv"
	"sync"
	"time"

	"github.com/moby/moby/client"

	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/api/types/network"
	"github.com/moby/moby/api/types/swarm"
	"github.com/moby/moby/api/types/volume"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker/stats"
	"github.com/portainer/portainer/pkg/schedule"
	"github.com/rs/zerolog/log"
	"golang.org/x/sync/singleflight"
)

const dashboardCacheRefreshInterval = time.Hour

type dashboardCacheKey struct {
	endpointID  portainer.EndpointID
	endpointURL string
	agentTarget string
}

func (key dashboardCacheKey) singleflightKey() string {
	return strconv.Itoa(int(key.endpointID)) + "\x00" + key.endpointURL + "\x00" + key.agentTarget
}

type dashboardData struct {
	containers     []container.Summary
	containerStats stats.ContainerStatsCache
	images         imagesCounters
	services       []swarm.Service
	volumes        []*volume.Volume
	networks       []network.Summary
	isSwarm        bool
	isSwarmManager bool
}

type dashboardDataFetcher func(context.Context, dashboardCacheKey) (*dashboardData, error)

// dashboardDataCache is a stale-while-revalidate in-memory cache. A cold miss
// waits for Docker because there is no useful value to return yet. Once warm,
// every request returns the current value immediately and starts a coalesced
// refresh in the background. Cached environments are also refreshed hourly.
type dashboardDataCache struct {
	mu              sync.RWMutex
	data            map[dashboardCacheKey]*dashboardData
	backgroundCtx   context.Context
	refreshInterval time.Duration
	fetch           dashboardDataFetcher
	refreshGroup    singleflight.Group
}

func newDashboardDataCache(fetch dashboardDataFetcher, refreshInterval time.Duration) *dashboardDataCache {
	return &dashboardDataCache{
		data:            map[dashboardCacheKey]*dashboardData{},
		backgroundCtx:   context.Background(),
		refreshInterval: refreshInterval,
		fetch:           fetch,
	}
}

func (cache *dashboardDataCache) start(ctx context.Context) {
	cache.mu.Lock()
	cache.backgroundCtx = ctx
	cache.mu.Unlock()

	go schedule.RunOnInterval(ctx, cache.refreshInterval, cache.refreshAll, nil)
}

func (cache *dashboardDataCache) get(ctx context.Context, key dashboardCacheKey) (*dashboardData, error) {
	cache.mu.RLock()
	cachedData := cache.data[key]
	backgroundCtx := cache.backgroundCtx
	cache.mu.RUnlock()

	if cachedData != nil {
		cache.refreshAsync(backgroundCtx, key)
		return cachedData, nil
	}

	return cache.refresh(ctx, key)
}

func (cache *dashboardDataCache) refresh(ctx context.Context, key dashboardCacheKey) (*dashboardData, error) {
	value, err, _ := cache.refreshGroup.Do(key.singleflightKey(), func() (any, error) {
		return cache.fetchAndStore(ctx, key)
	})
	if err != nil {
		return nil, err
	}

	return value.(*dashboardData), nil
}

func (cache *dashboardDataCache) refreshAsync(ctx context.Context, key dashboardCacheKey) {
	_ = cache.refreshGroup.DoChan(key.singleflightKey(), func() (any, error) {
		freshData, err := cache.fetchAndStore(ctx, key)
		if err != nil {
			log.Warn().
				Err(err).
				Int("environment_id", int(key.endpointID)).
				Msg("unable to refresh Docker dashboard cache")
			return nil, err
		}

		return freshData, nil
	})
}

func (cache *dashboardDataCache) fetchAndStore(ctx context.Context, key dashboardCacheKey) (*dashboardData, error) {
	freshData, err := cache.fetch(ctx, key)
	if err != nil {
		return nil, err
	}

	cache.mu.Lock()
	cache.data[key] = freshData
	cache.mu.Unlock()

	return freshData, nil
}

func (cache *dashboardDataCache) refreshAll() {
	cache.mu.RLock()
	keys := make([]dashboardCacheKey, 0, len(cache.data))
	for key := range cache.data {
		keys = append(keys, key)
	}
	ctx := cache.backgroundCtx
	cache.mu.RUnlock()

	for _, key := range keys {
		cache.refreshAsync(ctx, key)
	}
}

func (h *Handler) fetchDashboardData(ctx context.Context, key dashboardCacheKey) (*dashboardData, error) {
	endpoint, err := h.dataStore.Endpoint().Endpoint(key.endpointID)
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve environment: %w", err)
	}

	cli, err := h.dockerClientFactory.CreateClientWithContext(ctx, endpoint, key.agentTarget, nil)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to the Docker daemon: %w", err)
	}
	defer func() { _ = cli.Close() }()

	containersResult, err := cli.ContainerList(ctx, client.ContainerListOptions{All: true})
	containers := containersResult.Items
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve Docker containers: %w", err)
	}

	imagesResult, err := cli.ImageList(ctx, client.ImageListOptions{})
	images := imagesResult.Items
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve Docker images: %w", err)
	}

	infoResult, err := cli.Info(ctx, client.InfoOptions{})
	info := infoResult.Info
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve Docker info: %w", err)
	}

	isSwarm := info.Swarm.ControlAvailable
	isSwarmManager := isSwarm && info.Swarm.NodeID != ""

	var services []swarm.Service
	if isSwarmManager {
		servicesResult, err := cli.ServiceList(ctx, client.ServiceListOptions{})
		services = servicesResult.Items
		if err != nil {
			return nil, fmt.Errorf("unable to retrieve Docker services: %w", err)
		}
	}

	volumesResponse, err := cli.VolumeList(ctx, client.VolumeListOptions{})
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve Docker volumes: %w", err)
	}

	networksResult, err := cli.NetworkList(ctx, client.NetworkListOptions{})
	networks := networksResult.Items
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve Docker networks: %w", err)
	}

	var containerStats stats.ContainerStatsCache
	if !isSwarm {
		containerStats, err = stats.InspectContainerStats(ctx, cli, containers)
		if err != nil {
			return nil, fmt.Errorf("unable to retrieve Docker containers stats: %w", err)
		}
	}

	imageCounts := imagesCounters{Total: len(images)}
	for i := range images {
		imageCounts.Size += images[i].Size
	}

	volumes := make([]*volume.Volume, len(volumesResponse.Items))
	for i := range volumesResponse.Items {
		volumes[i] = &volumesResponse.Items[i]
	}
	return &dashboardData{
		containers:     containers,
		containerStats: containerStats,
		images:         imageCounts,
		services:       services,
		volumes:        volumes,
		networks:       networks,
		isSwarm:        isSwarm,
		isSwarmManager: isSwarmManager,
	}, nil
}
