package client

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/pkg/fips"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"

	"github.com/rs/zerolog/log"

	"github.com/moby/moby/api/types/image"
	"github.com/moby/moby/client"
	"github.com/moby/moby/client/pkg/versions"
	"github.com/segmentio/encoding/json"
)

var errUnsupportedEnvironmentType = errors.New("environment not supported")

const (
	defaultDockerRequestTimeout = 60 * time.Second
	legacyNegotiationVersion    = "1.24"
)

type NodeNamesCtxKey struct{}

// ClientFactory is used to create Docker clients
type ClientFactory struct {
	signatureService     portainer.DigitalSignatureService
	reverseTunnelService portainer.ReverseTunnelService
}

// NewClientFactory returns a new instance of a ClientFactory
func NewClientFactory(signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService) *ClientFactory {
	return &ClientFactory{
		signatureService:     signatureService,
		reverseTunnelService: reverseTunnelService,
	}
}

// CreateClient is a generic function to create a Docker client based on
// a specific environment(endpoint) configuration. The nodeName parameter can be used
// with an agent enabled environment(endpoint) to target a specific node in an agent cluster.
// The underlying http client timeout may be specified, a default value is used otherwise.
func (factory *ClientFactory) CreateClient(endpoint *portainer.Endpoint, nodeName string, timeout *time.Duration) (*client.Client, error) {
	return factory.CreateClientWithContext(context.Background(), endpoint, nodeName, timeout)
}

// CreateClientWithContext negotiates before returning a client, so both legacy
// and modern engines use their advertised API version. Unlike CreateClient, its
// initial network I/O is cancelled with the caller. Connectivity errors are
// returned here, never as a usable but incorrectly versioned client.
func (factory *ClientFactory) CreateClientWithContext(ctx context.Context, endpoint *portainer.Endpoint, nodeName string, timeout *time.Duration) (*client.Client, error) {
	switch endpoint.Type {
	case portainer.AzureEnvironment:
		return nil, errUnsupportedEnvironmentType
	case portainer.AgentOnDockerEnvironment:
		return createAgentClient(ctx, endpoint, endpoint.URL, factory.signatureService, nodeName, timeout)
	case portainer.EdgeAgentOnDockerEnvironment:
		tunnelAddr, err := factory.reverseTunnelService.TunnelAddr(endpoint)
		if err != nil {
			return nil, err
		}

		endpointURL := "http://" + tunnelAddr // NOSONAR S5332: loopback entry to encrypted Edge tunnel; see SECURITY_REVIEWS.md #180.

		return createAgentClient(ctx, endpoint, endpointURL, factory.signatureService, nodeName, timeout)
	}

	if strings.HasPrefix(endpoint.URL, "unix://") || strings.HasPrefix(endpoint.URL, "npipe://") {
		return createLocalClient(ctx, endpoint, timeout)
	}

	return createTCPClient(ctx, endpoint, timeout)
}

func createLocalClient(ctx context.Context, endpoint *portainer.Endpoint, timeout *time.Duration) (*client.Client, error) {
	return newCompatibleClient(ctx, timeout, nil,
		client.WithHost(endpoint.URL),
	)
}

func createTCPClient(ctx context.Context, endpoint *portainer.Endpoint, timeout *time.Duration) (*client.Client, error) {
	httpCli, err := httpClient(endpoint, timeout)
	if err != nil {
		return nil, err
	}

	opts := []client.Opt{
		client.WithHost(endpoint.URL),
	}

	if endpoint.TLSConfig.TLS {
		opts = append(opts, client.WithScheme("https"))
	}

	return newCompatibleClient(ctx, timeout, httpCli, opts...)
}

// agentClientHeaders builds the headers every request to an agent is decorated with.
func agentClientHeaders(signatureService portainer.DigitalSignatureService, nodeName string, fipsMode bool) (map[string]string, error) {
	headers := map[string]string{}

	// The agent verifies this signature unless it is running in FIPS mode, where it
	// relies on mTLS instead. Skip sending it to match that behaviour.
	if !fipsMode {
		signature, err := signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
		if err != nil {
			return nil, err
		}

		headers[portainer.PortainerAgentPublicKeyHeader] = signatureService.EncodedPublicKey()
		headers[portainer.PortainerAgentSignatureHeader] = signature
	}

	if nodeName != "" {
		headers[portainer.PortainerAgentTargetHeader] = nodeName
	}

	return headers, nil
}

func createAgentClient(ctx context.Context, endpoint *portainer.Endpoint, endpointURL string, signatureService portainer.DigitalSignatureService, nodeName string, timeout *time.Duration) (*client.Client, error) {
	httpCli, err := httpClient(endpoint, timeout)
	if err != nil {
		return nil, err
	}

	headers, err := agentClientHeaders(signatureService, nodeName, fips.FIPSMode())
	if err != nil {
		return nil, err
	}

	opts := []client.Opt{
		client.WithHost(endpointURL),
		client.WithHTTPHeaders(headers),
	}

	if endpoint.TLSConfig.TLS {
		opts = append(opts, client.WithScheme("https"))
	}

	return newCompatibleClient(ctx, timeout, httpCli, opts...)
}

// newCompatibleClient completes negotiation before exposing the client to
// concurrent callers. The split SDK's lazy negotiation has a hard API1.40
// floor, but its public fixed-version option supports legacy wire versions.
// Keep that compatibility without rewriting requests or private SDK state.
//
// A failed probe cannot safely return a client: an old engine would still hit
// the SDK's lazy floor, or requests could use the unnegotiated default1.55.
// Retry one failed Ping (itself HEAD with GET fallback) for a restarting engine,
// then return the error. The entire probe shares the caller context and HTTP
// timeout budget, not an unrelated short deadline. A zero HTTP timeout remains
// unlimited, just as it is for subsequent operations.
func newCompatibleClient(ctx context.Context, timeout *time.Duration, httpClient *http.Client, opts ...client.Opt) (*client.Client, error) {
	create := func(extra ...client.Opt) (*client.Client, error) {
		options := append(append([]client.Opt(nil), opts...), extra...)
		if httpClient != nil {
			// SDK construction wraps Transport for tracing. Give each instance
			// its own client value rather than stacking wrappers on the same one.
			copy := *httpClient
			options = append(options, client.WithHTTPClient(&copy))
		}
		return client.New(options...)
	}
	cli, err := create()
	if err != nil {
		return nil, err
	}
	defer cli.Close()

	if probeTimeout := dockerRequestTimeout(timeout); probeTimeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, probeTimeout)
		defer cancel()
	}
	ping, err := cli.Ping(ctx, client.PingOptions{})
	if err != nil && ctx.Err() == nil {
		ping, err = cli.Ping(ctx, client.PingOptions{})
	}
	if err != nil {
		return nil, fmt.Errorf("negotiate Docker API version: %w", err)
	}
	version := ping.APIVersion
	if version == "" {
		// Preserve the previous SDK's pre-negotiation-engine fallback.
		version = legacyNegotiationVersion
	}
	// WithAPIVersion validates and normalizes the server value. Do that before
	// comparing, so malformed versions cannot silently select the maximum.
	negotiated, err := create(client.WithAPIVersion(version))
	if err != nil {
		return nil, err
	}
	if versions.GreaterThan(negotiated.ClientVersion(), client.MaxAPIVersion) {
		_ = negotiated.Close()
		return create(client.WithAPIVersion(client.MaxAPIVersion))
	}
	return negotiated, nil
}

type NodeNameTransport struct {
	*http.Transport
}

func (t *NodeNameTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	resp, err := t.Transport.RoundTrip(req)
	if err != nil ||
		resp.StatusCode != http.StatusOK ||
		resp.ContentLength == 0 ||
		!strings.HasSuffix(req.URL.Path, "/images/json") {
		return resp, err
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		if err := resp.Body.Close(); err != nil {
			log.Warn().Err(err).Msg("failed to close response body")
		}

		return resp, err
	}

	if err := resp.Body.Close(); err != nil {
		log.Warn().Err(err).Msg("failed to close response body")
	}

	resp.Body = io.NopCloser(bytes.NewReader(body))

	var rs []struct {
		image.Summary
		Portainer struct {
			Agent struct {
				NodeName string
			}
		}
	}

	if err = json.Unmarshal(body, &rs); err != nil {
		return resp, nil
	}

	nodeNames, ok := req.Context().Value(NodeNamesCtxKey{}).(map[string]string)
	if ok {
		for idx, r := range rs {
			// as there is no way to differentiate the same image available in multiple nodes only by their ID
			// we append the index of the image in the payload response to match the node name later
			// from the image.Summary[] list returned by docker's client.ImageList()
			nodeNames[fmt.Sprintf("%s-%d", r.ID, idx)] = r.Portainer.Agent.NodeName
		}
	}

	return resp, err
}

func httpClient(endpoint *portainer.Endpoint, timeout *time.Duration) (*http.Client, error) {
	var transport *NodeNameTransport
	if endpoint.TLSConfig.TLS {
		tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig)
		if err != nil {
			return nil, err
		}

		t := ssrf.NewTransport(tlsConfig)
		t.Protocols = ssrf.HTTP1Only()
		transport = &NodeNameTransport{Transport: t}
	} else {
		transport = &NodeNameTransport{Transport: ssrf.NewTransport(nil)}
	}

	clientTimeout := dockerRequestTimeout(timeout)

	return &http.Client{
		Transport: transport,
		Timeout:   clientTimeout,
	}, nil
}

// dockerRequestTimeout applies the factory's documented default to initial
// negotiation on every transport, including local Unix/npipe. Explicit0 keeps
// the caller-controlled unlimited timeout; WithContext still permits cancellation.
func dockerRequestTimeout(timeout *time.Duration) time.Duration {
	if timeout != nil {
		return *timeout
	}
	return defaultDockerRequestTimeout
}
