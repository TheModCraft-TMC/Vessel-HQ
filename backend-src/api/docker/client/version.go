package client

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"

	"github.com/moby/moby/api/types/system"
	"github.com/moby/moby/client"
)

// ServerVersion preserves snapshot diagnostics omitted by the split SDK's
// ServerVersionResult. Factory clients observe only this call's /version body;
// the SDK still owns the request, decoding, errors, draining and closing.
func ServerVersion(ctx context.Context, cli *client.Client) (portainer.DockerVersion, error) {
	capture := &versionMetadataCapture{}
	version, err := cli.ServerVersion(context.WithValue(ctx, versionMetadataKey{}, capture), client.ServerVersionOptions{})
	if err != nil {
		return portainer.DockerVersion{}, err
	}

	result := portainer.DockerVersion{VersionResponse: system.VersionResponse{
		Platform:      system.PlatformInfo{Name: version.Platform.Name},
		Version:       version.Version,
		APIVersion:    version.APIVersion,
		MinAPIVersion: version.MinAPIVersion,
		Os:            version.Os,
		Arch:          version.Arch,
		Experimental:  version.Experimental,
		Components:    version.Components,
	}}
	var legacy struct {
		GitCommit     string
		GoVersion     string
		KernelVersion string
		BuildTime     string
	}
	// Decode the first JSON value, just like the SDK (not Unmarshal, which
	// would reject trailing data accepted by ServerVersion). Observation must
	// never turn a successful SDK response into a new error.
	if json.NewDecoder(bytes.NewReader(capture.data)).Decode(&legacy) == nil {
		result.GitCommit = legacy.GitCommit
		result.GoVersion = legacy.GoVersion
		result.KernelVersion = legacy.KernelVersion
		result.BuildTime = legacy.BuildTime
	}
	return result, nil
}

type versionMetadataKey struct{}

// Bound only the diagnostic copy, not the daemon response or SDK decoder. A
// larger response still works normally, including modern component details.
const maxVersionMetadataBytes = 1 << 20

type versionMetadataCapture struct {
	data []byte
}

func (c *versionMetadataCapture) Write(p []byte) (int, error) {
	remaining := maxVersionMetadataBytes - len(c.data)
	c.data = append(c.data, p[:min(len(p), remaining)]...)
	return len(p), nil
}

type versionMetadataBody struct {
	io.Reader
	io.Closer
}

// The public SDK response hook must not read or close the body. Instead wrap
// this requested response so observation happens only as the SDK reads it.
// Neither the hook nor the client retains per-call state: concurrent snapshots
// and ordinary ServerVersion calls cannot overwrite each other's metadata.
func captureVersionMetadata(resp *http.Response) {
	// Match the SDK's successful-status range without changing any status.
	if resp.Request == nil || resp.Body == nil || resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusBadRequest ||
		resp.Request.Method != http.MethodGet || !strings.HasSuffix(resp.Request.URL.Path, "/version") {
		return
	}
	capture, ok := resp.Request.Context().Value(versionMetadataKey{}).(*versionMetadataCapture)
	if !ok {
		return
	}
	resp.Body = &versionMetadataBody{
		Reader: io.TeeReader(resp.Body, capture),
		Closer: resp.Body,
	}
}
