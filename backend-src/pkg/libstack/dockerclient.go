package libstack

import (
	"context"
	"encoding/csv"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/docker/cli/cli/command"
	"github.com/docker/cli/cli/context/docker"
	"github.com/moby/moby/client"
	"github.com/portainer/portainer/pkg/dockercompat"
)

// fixedAPIClient retains the entire SDK interface (including hijack/dial and
// experimental methods). Docker CLI's initializeFromClient always forces Ping
// negotiation, even with a fixed version. Do not let that re-enter the SDK's
// 1.40 floor, reset the missing-header fallback, override DOCKER_API_VERSION,
// or mutate the version while concurrent Compose calls read it. Ping still
// performs real I/O and returns unmodified daemon metadata/errors.
type fixedAPIClient struct {
	*client.Client
}

var _ client.APIClient = (*fixedAPIClient)(nil)

func (c *fixedAPIClient) Ping(ctx context.Context, _ client.PingOptions) (client.PingResult, error) {
	return c.Client.Ping(ctx, client.PingOptions{})
}

// newDockerCLIClient is used only after CLI Initialize has resolved its config
// and before its first Client/ServerInfo/DockerEndpoint call. Resolve through
// the CLI's own context store, including its virtual default-context resolver;
// do not replace a context with options.Host or rebuild TLS/SSH/socket transports.
func newDockerCLIClient(ctx context.Context, cli *command.DockerCli) (client.APIClient, error) {
	meta, err := cli.ContextStore().GetMetadata(cli.CurrentContext())
	if err != nil {
		return nil, err
	}
	epMeta, err := docker.EndpointFromContext(meta)
	if err != nil {
		return nil, err
	}
	ep, err := docker.WithTLSData(cli.ContextStore(), cli.CurrentContext(), epMeta)
	if err != nil {
		return nil, err
	}
	opts, err := ep.ClientOpts()
	if err != nil {
		return nil, err
	}
	headers, err := cliHTTPHeaders(cli.ConfigFile().HTTPHeaders)
	if err != nil {
		return nil, err
	}
	opts = append(opts, client.WithHTTPHeaders(headers), client.WithUserAgent(command.UserAgent()))
	create := func(extra ...client.Opt) (*client.Client, error) {
		return client.New(append(append([]client.Opt(nil), opts...), extra...)...)
	}

	var sdk *client.Client
	if strings.TrimSpace(os.Getenv(client.EnvOverrideAPIVersion)) != "" {
		// Endpoint.ClientOpts includes WithAPIVersionFromEnv. An operator's
		// fixed version disables negotiation, including capping/fallback.
		sdk, err = create()
	} else {
		// The old CLI's 2s metadata ping could fail and its subsequent SDK
		// operation could recover lazily. We cannot publish an unnegotiated
		// concrete SDK client after failure. Use the factory's 60s whole-probe
		// budget and one recovery retry, not a new short compatibility cutoff.
		probeCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
		defer cancel()
		sdk, err = dockercompat.NewClient(probeCtx, create)
	}
	if err != nil {
		return nil, err
	}
	return &fixedAPIClient{Client: sdk}, nil
}

// cliHTTPHeaders preserves Docker CLI's config/environment precedence. The CLI
// exposes endpoint transport options but not its DOCKER_CUSTOM_HEADERS parser.
// Match its CSV key=value grammar; the environment replaces (not merges) config
// headers. Vessel's injected agent headers are already in config before this.
func cliHTTPHeaders(configHeaders map[string]string) (map[string]string, error) {
	value := os.Getenv("DOCKER_CUSTOM_HEADERS")
	if value == "" {
		return configHeaders, nil
	}
	fields, err := csv.NewReader(strings.NewReader(value)).Read()
	if err != nil {
		return nil, fmt.Errorf("failed to parse custom headers from DOCKER_CUSTOM_HEADERS: %w", err)
	}
	headers := make(map[string]string, len(fields))
	for _, field := range fields {
		key, value, ok := strings.Cut(field, "=")
		key = strings.TrimSpace(key)
		if !ok || key == "" {
			return nil, fmt.Errorf("invalid DOCKER_CUSTOM_HEADERS key=value pair: %q", field)
		}
		headers[http.CanonicalHeaderKey(key)] = value
	}
	return headers, nil
}
