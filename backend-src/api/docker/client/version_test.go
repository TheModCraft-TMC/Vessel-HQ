package client

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/testhelpers"

	"github.com/moby/moby/client"
	"github.com/stretchr/testify/require"
)

const legacyVersionBody = `{"Version":"1.12.6","ApiVersion":"1.24","GitCommit":"legacy-commit","GoVersion":"legacy-go","KernelVersion":"legacy-kernel","BuildTime":"legacy-time"}`

func requireLegacyVersion(t *testing.T, version portainer.DockerVersion) {
	t.Helper()
	require.Equal(t, "legacy-commit", version.GitCommit)
	require.Equal(t, "legacy-go", version.GoVersion)
	require.Equal(t, "legacy-kernel", version.KernelVersion)
	require.Equal(t, "legacy-time", version.BuildTime)
}

func TestVersionMetadataConcurrentRequests(t *testing.T) {
	t.Parallel()
	const requests = 32
	var calls atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/_ping" {
			w.Header().Set("API-Version", "1.24")
			return
		}
		if r.URL.Path != "/v1.24/version" {
			http.Error(w, "unexpected request", http.StatusBadRequest)
			return
		}
		id := calls.Add(1)
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"Version":"%d","GitCommit":"commit-%d","GoVersion":"go-%d","KernelVersion":"kernel-%d","BuildTime":"time-%d"}`, id, id, id, id, id)
	}))
	defer srv.Close()
	cli, err := NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{URL: srv.URL}, "", nil)
	require.NoError(t, err)
	defer cli.Close()
	var wg sync.WaitGroup
	for i := range requests {
		wg.Go(func() {
			// Ordinary SDK calls on the same client must remain unaffected and
			// must not overwrite another request's diagnostic capture.
			if i%2 == 0 {
				_, err := cli.ServerVersion(t.Context(), client.ServerVersionOptions{})
				require.NoError(t, err)
				return
			}
			version, err := ServerVersion(t.Context(), cli)
			require.NoError(t, err)
			require.Equal(t, "commit-"+version.Version, version.GitCommit)
			require.Equal(t, "go-"+version.Version, version.GoVersion)
			require.Equal(t, "kernel-"+version.Version, version.KernelVersion)
			require.Equal(t, "time-"+version.Version, version.BuildTime)
		})
	}
	wg.Wait()
	require.EqualValues(t, requests, calls.Load(), "each operation issues exactly one /version")
}

func TestVersionMetadataPreservesSDKResultsAndErrors(t *testing.T) {
	t.Parallel()
	large := `{"Version":"29.0","Components":[{"Name":"Engine","Version":"29.0","Details":{"large":"` + strings.Repeat("x", maxVersionMetadataBytes+1) + `"}}]}`
	for _, tc := range []struct {
		name   string
		status int
		body   string
	}{
		{name: "legacy", status: http.StatusOK, body: legacyVersionBody},
		{name: "nonstandard success accepted by SDK", status: http.StatusCreated, body: legacyVersionBody},
		{name: "empty fields", status: http.StatusOK, body: `{"Version":"legacy"}`},
		{name: "trailing data accepted by SDK", status: http.StatusOK, body: legacyVersionBody + "\nnot another JSON value"},
		{name: "capture bound does not limit SDK", status: http.StatusOK, body: large},
		{name: "invalid JSON", status: http.StatusOK, body: `{"Version":`},
		{name: "wrong field type", status: http.StatusOK, body: `{"KernelVersion":123}`},
		{name: "empty body", status: http.StatusOK},
		{name: "unauthorized", status: http.StatusUnauthorized, body: `{"message":"denied"}`},
		{name: "not found", status: http.StatusNotFound, body: `{"message":"missing version"}`},
		{name: "daemon failure", status: http.StatusInternalServerError, body: `{"message":"engine unavailable"}`},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					w.Header().Set("API-Version", "1.24")
					return
				}
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tc.status)
				_, _ = io.WriteString(w, tc.body)
			}))
			defer srv.Close()
			cli, err := NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{URL: srv.URL}, "", nil)
			require.NoError(t, err)
			defer cli.Close()
			raw, rawErr := cli.ServerVersion(t.Context(), client.ServerVersionOptions{})
			version, err := ServerVersion(t.Context(), cli)
			if rawErr != nil {
				require.Equal(t, fmt.Sprintf("%T: %s", rawErr, rawErr), fmt.Sprintf("%T: %s", err, err))
				require.Equal(t, portainer.DockerVersion{}, version)
				return
			}
			require.NoError(t, err)
			require.Equal(t, raw.Version, version.Version)
			require.Equal(t, raw.APIVersion, version.APIVersion)
			require.Equal(t, raw.Components, version.Components)
			if strings.HasPrefix(tc.body, legacyVersionBody) {
				requireLegacyVersion(t, version)
			} else {
				wire, err := json.Marshal(version)
				require.NoError(t, err)
				require.Contains(t, string(wire), `"GitCommit":""`)
				require.Contains(t, string(wire), `"GoVersion":""`)
				require.NotContains(t, string(wire), `"KernelVersion"`)
				require.NotContains(t, string(wire), `"BuildTime"`)
			}
		})
	}
}

func TestVersionMetadataAgentAndTLS(t *testing.T) {
	t.Parallel()
	var calls atomic.Int32
	srv := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get(portainer.PortainerAgentPublicKeyHeader) != testhelpers.StubPublicKey ||
			r.Header.Get(portainer.PortainerAgentSignatureHeader) != testhelpers.StubSignature ||
			r.Header.Get(portainer.PortainerAgentTargetHeader) != "node-a" {
			http.Error(w, "missing signed agent headers", http.StatusUnauthorized)
			return
		}
		if r.URL.Path == "/_ping" {
			w.Header().Set("API-Version", "1.39")
			return
		}
		if r.URL.Path != "/v1.39/version" {
			http.Error(w, "unexpected request", http.StatusBadRequest)
			return
		}
		calls.Add(1)
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, legacyVersionBody)
	}))
	defer srv.Close()
	cli, err := NewClientFactory(testhelpers.NewStubSignatureService(), nil).CreateClient(&portainer.Endpoint{
		Type: portainer.AgentOnDockerEnvironment, URL: "tcp://" + strings.TrimPrefix(srv.URL, "https://"),
		TLSConfig: portainer.TLSConfiguration{TLS: true, TLSSkipVerify: true},
	}, "node-a", nil)
	require.NoError(t, err)
	defer cli.Close()
	version, err := ServerVersion(t.Context(), cli)
	require.NoError(t, err)
	requireLegacyVersion(t, version)
	require.Equal(t, "1.39", cli.ClientVersion(), "capture must not change the negotiated daemon API")
	require.EqualValues(t, 1, calls.Load())
}

type versionTunnelService struct {
	portainer.ReverseTunnelService
	addr string
}

func (s *versionTunnelService) TunnelAddr(*portainer.Endpoint) (string, error) { return s.addr, nil }

func TestVersionMetadataEdgeTunnelAndImageObservation(t *testing.T) {
	t.Parallel()
	var calls atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get(portainer.PortainerAgentSignatureHeader) != testhelpers.StubSignature ||
			r.Header.Get(portainer.PortainerAgentPublicKeyHeader) != testhelpers.StubPublicKey ||
			r.Header.Get(portainer.PortainerAgentTargetHeader) != "edge-node" {
			http.Error(w, "missing Edge agent headers", http.StatusUnauthorized)
			return
		}
		if r.URL.Path == "/_ping" {
			w.Header().Set("API-Version", "1.24")
			return
		}
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v1.24/version":
			calls.Add(1)
			_, _ = io.WriteString(w, legacyVersionBody)
		case "/v1.24/images/json":
			_, _ = io.WriteString(w, `[{"Id":"image-a","Portainer":{"Agent":{"NodeName":"edge-node"}}}]`)
		default:
			http.Error(w, "unexpected request", http.StatusBadRequest)
		}
	}))
	defer srv.Close()
	factory := NewClientFactory(testhelpers.NewStubSignatureService(), &versionTunnelService{addr: strings.TrimPrefix(srv.URL, "http://")})
	cli, err := factory.CreateClient(&portainer.Endpoint{Type: portainer.EdgeAgentOnDockerEnvironment, URL: "https://unused.invalid"}, "edge-node", nil)
	require.NoError(t, err)
	defer cli.Close()
	version, err := ServerVersion(t.Context(), cli)
	require.NoError(t, err)
	requireLegacyVersion(t, version)
	require.EqualValues(t, 1, calls.Load())
	nodeNames := map[string]string{}
	images, err := cli.ImageList(context.WithValue(t.Context(), NodeNamesCtxKey{}, nodeNames), client.ImageListOptions{})
	require.NoError(t, err)
	require.Len(t, images.Items, 1)
	require.Equal(t, "image-a", images.Items[0].ID)
	require.Equal(t, map[string]string{"image-a-0": "edge-node"}, nodeNames, "the existing image response observer remains installed")
}

func TestVersionMetadataHonorsContext(t *testing.T) {
	t.Parallel()
	started := make(chan struct{})
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/_ping" {
			w.Header().Set("API-Version", "1.24")
			return
		}
		close(started)
		<-r.Context().Done()
	}))
	defer srv.Close()
	cli, err := NewClientFactory(nil, nil).CreateClient(&portainer.Endpoint{URL: srv.URL}, "", nil)
	require.NoError(t, err)
	defer cli.Close()
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	go func() {
		<-started
		cancel()
	}()
	_, err = ServerVersion(ctx, cli)
	require.ErrorIs(t, err, context.Canceled)
}

type observedVersionBody struct {
	io.Reader
	reads  int
	closes int
}

func (b *observedVersionBody) Read(p []byte) (int, error) {
	b.reads++
	return b.Reader.Read(p)
}

func (b *observedVersionBody) Close() error {
	b.closes++
	return nil
}

type versionErrorReader struct{ err error }

func (r versionErrorReader) Read([]byte) (int, error) { return 0, r.err }

func TestVersionMetadataHookObservesWithoutChangingResponse(t *testing.T) {
	t.Parallel()
	readErr := errors.New("original read failure")
	body := &observedVersionBody{Reader: io.MultiReader(strings.NewReader(legacyVersionBody), versionErrorReader{readErr})}
	capture := &versionMetadataCapture{}
	req := httptest.NewRequest(http.MethodGet, "/v1.24/version", nil).WithContext(context.WithValue(t.Context(), versionMetadataKey{}, capture))
	resp := &http.Response{
		Request: req, Body: body, StatusCode: http.StatusOK, Status: "200 OK", ContentLength: -1,
		Header: http.Header{"Api-Version": {"1.24"}, "Server": {"unchanged"}},
	}
	before := *resp
	captureVersionMetadata(resp)
	require.Zero(t, body.reads, "the SDK hook must not read the body")
	require.Zero(t, body.closes, "the SDK hook must not close the body")
	observed, err := io.ReadAll(resp.Body)
	require.ErrorIs(t, err, readErr)
	require.Equal(t, legacyVersionBody, string(observed))
	require.Equal(t, observed, capture.data)
	require.NoError(t, resp.Body.Close())
	require.Equal(t, 1, body.closes, "the SDK's close must reach the original body")
	resp.Body = body
	require.Equal(t, before, *resp, "observation must not change status, headers, version or length")
}

func TestVersionMetadataCaptureBoundAndOptIn(t *testing.T) {
	t.Parallel()
	capture := &versionMetadataCapture{}
	payload := bytes.Repeat([]byte("x"), maxVersionMetadataBytes*2)
	n, err := capture.Write(payload)
	require.NoError(t, err)
	require.Equal(t, len(payload), n, "the tee must not truncate or fail the SDK read")
	require.Len(t, capture.data, maxVersionMetadataBytes)
	n, err = capture.Write([]byte("after the bound"))
	require.NoError(t, err)
	require.Equal(t, len("after the bound"), n)
	require.Len(t, capture.data, maxVersionMetadataBytes)
	for _, tc := range []struct {
		name   string
		method string
		path   string
		status int
		optIn  bool
	}{
		{name: "ordinary SDK version call", method: http.MethodGet, path: "/v1.24/version", status: http.StatusOK},
		{name: "unrelated route", method: http.MethodGet, path: "/v1.24/info", status: http.StatusOK, optIn: true},
		{name: "error response", method: http.MethodGet, path: "/v1.24/version", status: http.StatusInternalServerError, optIn: true},
		{name: "HEAD", method: http.MethodHead, path: "/v1.24/version", status: http.StatusOK, optIn: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.path, nil)
			if tc.optIn {
				req = req.WithContext(context.WithValue(t.Context(), versionMetadataKey{}, &versionMetadataCapture{}))
			}
			body := &observedVersionBody{Reader: strings.NewReader(legacyVersionBody)}
			resp := &http.Response{Request: req, Body: body, StatusCode: tc.status}
			captureVersionMetadata(resp)
			require.Same(t, body, resp.Body)
			require.Zero(t, body.reads)
			require.Zero(t, body.closes)
		})
	}
}
