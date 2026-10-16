package topology

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"math"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerclient "github.com/portainer/portainer/api/docker/client"
)

type Router struct {
	ID          string   `json:"id"`
	Protocol    string   `json:"protocol"`
	WorkloadID  string   `json:"workloadId"`
	Rule        string   `json:"rule"`
	Service     string   `json:"service"`
	EntryPoints []string `json:"entryPoints"`
	Middlewares []string `json:"middlewares"`
	TLS         bool     `json:"tls"`
}
type RoutingService struct {
	ID         string `json:"id"`
	Protocol   string `json:"protocol"`
	WorkloadID string `json:"workloadId"`
	Port       int    `json:"port"`
	Scheme     string `json:"scheme"`
}
type Middleware struct {
	ID         string            `json:"id"`
	Protocol   string            `json:"protocol"`
	WorkloadID string            `json:"workloadId"`
	Types      []string          `json:"types"`
	Settings   map[string]string `json:"settings"`
	Redacted   bool              `json:"redacted"`
}
type NetworkCounter struct {
	WorkloadID    string `json:"workloadId"`
	ReceivedBytes uint64 `json:"receivedBytes,string"`
	SentBytes     uint64 `json:"sentBytes,string"`
	Available     bool   `json:"available"`
	Reason        string `json:"reason"`
}
type TrafficSnapshot struct {
	CollectedAt string           `json:"collectedAt"`
	Routers     []Router         `json:"routers"`
	Services    []RoutingService `json:"services"`
	Middlewares []Middleware     `json:"middlewares"`
	Counters    []NetworkCounter `json:"counters"`
	Warnings    []string         `json:"warnings"`
}

type trafficReader interface {
	dockerReader
	ContainerStatsOneShot(context.Context, string) (container.StatsResponseReader, error)
}

// ReadDockerTraffic reads labels and one-shot byte counters only for workloads
// in the approved stack. It never execs a command, reads environment variables,
// publishes a port or returns Docker-native inspection responses.
func ReadDockerTraffic(ctx context.Context, store dataservices.DataStore, factory *dockerclient.ClientFactory, environmentID, stackID int) (Graph, error) {
	stack, err := store.Stack().Read(portainer.StackID(stackID))
	if err != nil {
		return Graph{}, err
	}
	if int(stack.EndpointID) != environmentID || (stack.Type != portainer.DockerComposeStack && stack.Type != portainer.DockerSwarmStack) {
		return Graph{}, errors.New("unsupported traffic scope")
	}
	endpoint, err := store.Endpoint().Endpoint(stack.EndpointID)
	if err != nil {
		return Graph{}, err
	}
	if factory == nil {
		return Graph{}, errors.New("Docker adapter unavailable")
	}
	timeout := 15 * time.Second
	client, err := factory.CreateClient(endpoint, "", &timeout)
	if err != nil {
		return Graph{}, err
	}
	defer client.Close()
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	return readDockerTraffic(ctx, stack, client)
}

func readDockerTraffic(ctx context.Context, stack *portainer.Stack, client trafficReader) (Graph, error) {
	graph, err := readDockerStack(ctx, stack, client)
	if err != nil {
		return graph, err
	}
	snapshot := &TrafficSnapshot{Routers: []Router{}, Services: []RoutingService{}, Middlewares: []Middleware{}, Counters: []NetworkCounter{}, Warnings: []string{}}
	graph.Traffic = snapshot
	selected := map[string]Workload{}
	for _, w := range graph.Workloads {
		selected[w.ID] = w
	}
	if stack.Type == portainer.DockerComposeStack {
		items, err := client.ContainerList(ctx, container.ListOptions{All: true, Filters: filters.NewArgs(filters.Arg("label", "com.docker.compose.project="+stack.Name))})
		if err != nil {
			return graph, err
		}
		for _, item := range items {
			if _, ok := selected[item.ID]; ok && item.Labels["com.docker.compose.project"] == stack.Name {
				routingLabels(snapshot, item.ID, item.Labels)
			}
		}
	} else {
		items, err := client.ServiceList(ctx, types.ServiceListOptions{Filters: filters.NewArgs(filters.Arg("label", "com.docker.stack.namespace="+stack.Name))})
		if err != nil {
			return graph, err
		}
		for _, item := range items {
			if _, ok := selected[item.ID]; ok && item.Spec.Labels["com.docker.stack.namespace"] == stack.Name {
				routingLabels(snapshot, item.ID, item.Spec.Labels)
			}
		}
		snapshot.Warnings = append(snapshot.Warnings, "Swarm routing labels are available; live service byte counters require task-level sampling.")
	}
	if len(snapshot.Routers) > 100 || len(snapshot.Services) > 100 || len(snapshot.Middlewares) > 100 {
		return graph, errors.New("stack routing exceeds metadata limit")
	}
	sort.Slice(snapshot.Routers, func(i, j int) bool {
		return snapshot.Routers[i].ID+snapshot.Routers[i].WorkloadID < snapshot.Routers[j].ID+snapshot.Routers[j].WorkloadID
	})
	sort.Slice(snapshot.Services, func(i, j int) bool {
		return snapshot.Services[i].ID+snapshot.Services[i].WorkloadID < snapshot.Services[j].ID+snapshot.Services[j].WorkloadID
	})
	sort.Slice(snapshot.Middlewares, func(i, j int) bool {
		return snapshot.Middlewares[i].ID+snapshot.Middlewares[i].WorkloadID < snapshot.Middlewares[j].ID+snapshot.Middlewares[j].WorkloadID
	})
	var wg sync.WaitGroup
	limit := make(chan struct{}, 4)
	snapshot.Counters = make([]NetworkCounter, len(graph.Workloads))
	for i, w := range graph.Workloads {
		snapshot.Counters[i] = NetworkCounter{WorkloadID: w.ID, Reason: "Workload is not a running container."}
		if w.Kind != "container" || w.State != "running" {
			continue
		}
		if i >= 32 {
			snapshot.Counters[i].Reason = "Live sampling is limited to the first 32 workloads."
			continue
		}
		wg.Go(func() {
			select {
			case limit <- struct{}{}:
			case <-ctx.Done():
				return
			}
			defer func() { <-limit }()
			snapshot.Counters[i] = readCounter(ctx, client, w.ID)
		})
	}
	wg.Wait()
	snapshot.CollectedAt = time.Now().UTC().Format(time.RFC3339Nano)
	return graph, nil
}

func readCounter(ctx context.Context, client trafficReader, id string) NetworkCounter {
	r := NetworkCounter{WorkloadID: id, Reason: "Docker network counters are unavailable."}
	body, err := client.ContainerStatsOneShot(ctx, id)
	if err != nil || body.Body == nil {
		return r
	}
	defer body.Body.Close()
	bytes, err := io.ReadAll(io.LimitReader(body.Body, 1024*1024+1))
	if err != nil || len(bytes) > 1024*1024 {
		return r
	}
	var stats container.StatsResponse
	if json.Unmarshal(bytes, &stats) != nil || stats.ID != id || len(stats.Networks) == 0 {
		return r
	}
	for _, network := range stats.Networks {
		if math.MaxUint64-r.ReceivedBytes < network.RxBytes || math.MaxUint64-r.SentBytes < network.TxBytes {
			return NetworkCounter{WorkloadID: id, Reason: "Network counters exceed the supported range."}
		}
		r.ReceivedBytes += network.RxBytes
		r.SentBytes += network.TxBytes
	}
	r.Available = true
	r.Reason = ""
	return r
}

var routingName = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$`)
var sensitiveRule = regexp.MustCompile(`(?i)(headers?|query|authorization|bearer|basicauth)`)

func list(value string) []string {
	result := []string{}
	for _, v := range strings.Split(value, ",") {
		v = strings.TrimSpace(v)
		if routingName.MatchString(v) || strings.Contains(v, "@") && len(v) <= 160 {
			result = append(result, v)
		}
	}
	return result
}

// Only explicit safe dynamic routing fields cross the boundary. Unknown label
// values, auth middleware credentials and custom header values are never copied.
func routingLabels(snapshot *TrafficSnapshot, workloadID string, labels map[string]string) {
	if strings.EqualFold(labels["traefik.enable"], "false") {
		return
	}
	routers := map[string]*Router{}
	services := map[string]*RoutingService{}
	middlewares := map[string]*Middleware{}
	keys := make([]string, 0, len(labels))
	for key := range labels {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	for _, key := range keys {
		p := strings.Split(strings.ToLower(key), ".")
		if len(p) < 5 || p[0] != "traefik" || (p[1] != "http" && p[1] != "tcp" && p[1] != "udp") || !routingName.MatchString(p[3]) {
			continue
		}
		protocol, name, field, value := p[1], p[3], strings.Join(p[4:], "."), labels[key]
		if len(value) > 4096 {
			value = "[redacted oversized value]"
		}
		id := protocol + ":" + name
		switch p[2] {
		case "routers":
			r := routers[id]
			if r == nil {
				r = &Router{ID: name, Protocol: protocol, WorkloadID: workloadID, EntryPoints: []string{}, Middlewares: []string{}}
				routers[id] = r
			}
			switch field {
			case "rule":
				if sensitiveRule.MatchString(value) {
					r.Rule = "[redacted sensitive rule]"
				} else {
					r.Rule = value
				}
			case "service":
				if routingName.MatchString(value) || strings.HasSuffix(value, "@internal") {
					r.Service = value
				}
			case "entrypoints":
				r.EntryPoints = list(value)
			case "middlewares":
				r.Middlewares = list(value)
			case "tls":
				r.TLS = strings.EqualFold(value, "true")
			case "tls.certresolver":
				r.TLS = true
			}
		case "services":
			r := services[id]
			if r == nil {
				r = &RoutingService{ID: name, Protocol: protocol, WorkloadID: workloadID}
				services[id] = r
			}
			switch field {
			case "loadbalancer.server.port":
				if port, e := strconv.Atoi(value); e == nil && port > 0 && port <= 65535 {
					r.Port = port
				}
			case "loadbalancer.server.scheme":
				if value == "http" || value == "https" || value == "h2c" {
					r.Scheme = value
				}
			}
		case "middlewares":
			r := middlewares[id]
			if r == nil {
				r = &Middleware{ID: name, Protocol: protocol, WorkloadID: workloadID, Types: []string{}, Settings: map[string]string{}}
				middlewares[id] = r
			}
			kind := p[4]
			found := false
			for _, existing := range r.Types {
				found = found || existing == kind
			}
			if !found {
				r.Types = append(r.Types, kind)
			}
			switch field {
			case "redirectscheme.scheme", "redirectscheme.permanent", "stripprefix.prefixes", "stripprefix.forceslash", "chain.middlewares", "ratelimit.average", "ratelimit.burst", "compress":
				r.Settings[field] = value
			default:
				r.Redacted = true
			}
		}
	}
	for _, r := range routers {
		if r.Service == "" {
			count := 0
			name := ""
			for _, s := range services {
				if s.Protocol == r.Protocol {
					count++
					name = s.ID
				}
			}
			if count == 1 {
				r.Service = name
			}
		}
		snapshot.Routers = append(snapshot.Routers, *r)
	}
	for _, s := range services {
		snapshot.Services = append(snapshot.Services, *s)
	}
	for _, m := range middlewares {
		sort.Strings(m.Types)
		snapshot.Middlewares = append(snapshot.Middlewares, *m)
	}
}
