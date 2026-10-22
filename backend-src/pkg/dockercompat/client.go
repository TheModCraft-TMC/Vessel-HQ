// Package dockercompat preserves legacy Engine API negotiation using the split
// SDK's public constructors. It does not change the SDK's transports or requests.
package dockercompat

import (
	"context"
	"fmt"

	"github.com/moby/moby/client"
	"github.com/moby/moby/client/pkg/versions"
)

// NewClient probes before publishing a client to concurrent consumers. create
// must construct a fresh, equivalently configured client on each call, applying
// extra options at construction (never to an already shared client). The caller
// supplies the context/timeout budget and any explicit operator-version policy.
//
// The SDK's automatic negotiation rejects APIs below 1.40. Its fixed-version
// constructor supports those wire versions, including the former SDK's 1.24
// fallback for engines without an API-Version header.
func NewClient(ctx context.Context, create func(...client.Opt) (*client.Client, error)) (*client.Client, error) {
	probe, err := create()
	if err != nil {
		return nil, err
	}
	defer probe.Close()

	ping, err := probe.Ping(ctx, client.PingOptions{})
	if err != nil && ctx.Err() == nil {
		// Each SDK Ping already tries HEAD then GET. Retry the whole failed
		// probe once for a restarting engine, within the same context budget.
		ping, err = probe.Ping(ctx, client.PingOptions{})
	}
	if err != nil {
		return nil, fmt.Errorf("negotiate Docker API version: %w", err)
	}
	version := ping.APIVersion
	if version == "" {
		version = "1.24"
	}
	// Validate and normalize through the SDK before comparing versions.
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
