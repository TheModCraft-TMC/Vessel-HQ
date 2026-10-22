package libstack

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/docker/cli/cli/command"
	"github.com/docker/cli/cli/config"
	"github.com/docker/cli/cli/config/configfile"
	configtypes "github.com/docker/cli/cli/config/types"
	"github.com/docker/cli/cli/flags"
	"github.com/moby/moby/client"
	"github.com/stretchr/testify/require"
)

func isolateCLIConfig(t *testing.T) {
	t.Helper()
	old := config.Dir()
	config.SetDir(t.TempDir())
	t.Cleanup(func() { config.SetDir(old) })
	for _, key := range []string{"DOCKER_HOST", "DOCKER_CONTEXT", "DOCKER_API_VERSION", "DOCKER_CUSTOM_HEADERS", "DOCKER_TLS_VERIFY", "DOCKER_TLS"} {
		t.Setenv(key, "")
	}
}

func cliEngine(t *testing.T, version string) string {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/_ping" {
			w.Header().Set("API-Version", version)
			w.Header().Set("OSType", "linux")
			w.Header().Set("Docker-Experimental", "true")
			w.Header().Set("Swarm", "active/manager")
			return
		}
		expected := strings.TrimPrefix(version, "v")
		if expected == "" {
			expected = "1.24"
		} else if expected == "1.999" {
			expected = client.MaxAPIVersion
		}
		require.Equal(t, "/v"+expected+"/info", r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"ServerVersion":"fixture"}`)
	}))
	t.Cleanup(server.Close)
	return "tcp://" + strings.TrimPrefix(server.URL, "http://")
}

func TestWithCliVersionsAndMetadata(t *testing.T) {
	isolateCLIConfig(t)
	for _, version := range []string{"1.41", "1.54", "1.999", "v1.39", "malformed"} {
		t.Run(version, func(t *testing.T) {
			called := false
			err := WithCli(t.Context(), DockerCliOptions{Host: cliEngine(t, version)}, func(ctx context.Context, cli *command.DockerCli) error {
				called = true
				want := strings.TrimPrefix(version, "v")
				if version == "1.999" {
					want = client.MaxAPIVersion
				}
				require.Equal(t, want, cli.CurrentVersion())
				require.Equal(t, "linux", cli.ServerInfo().OSType)
				require.True(t, cli.ServerInfo().HasExperimental)
				require.True(t, cli.ServerInfo().SwarmStatus.ControlAvailable)
				_, err := cli.Client().Info(ctx, client.InfoOptions{})
				return err
			})
			if version == "malformed" {
				require.Error(t, err)
				require.False(t, called)
			} else {
				require.NoError(t, err)
				require.True(t, called)
			}
		})
	}
}

func TestWithCliExplicitAPIVersion(t *testing.T) {
	isolateCLIConfig(t)
	for _, version := range []string{"1.24", "1.39", "1.54", "1.999", " v1.39 ", "", " ", "v", "invalid"} {
		t.Run(version, func(t *testing.T) {
			t.Setenv("DOCKER_API_VERSION", version)
			expected := strings.TrimPrefix(strings.TrimSpace(version), "v")
			if expected == "" {
				expected = "1.41"
			}
			var infoPath string
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					w.Header().Set("API-Version", "1.41")
					return
				}
				infoPath = r.URL.Path
				w.Header().Set("Content-Type", "application/json")
				fmt.Fprint(w, `{}`)
			}))
			defer server.Close()
			called := false
			err := WithCli(t.Context(), DockerCliOptions{Host: "tcp" + strings.TrimPrefix(server.URL, "http")}, func(ctx context.Context, cli *command.DockerCli) error {
				called = true
				require.Equal(t, expected, cli.Client().ClientVersion())
				_, err := cli.Client().Info(ctx, client.InfoOptions{})
				return err
			})
			if version == "invalid" {
				require.Error(t, err)
				require.False(t, called)
			} else {
				require.NoError(t, err)
				require.Equal(t, "/v"+expected+"/info", infoPath)
			}
		})
	}
}

func TestWithCliHeadersOnProbeAndOperations(t *testing.T) {
	isolateCLIConfig(t)
	cfg := configfile.New(filepath.Join(config.Dir(), "config.json"))
	cfg.HTTPHeaders = map[string]string{"X-Config": "from-config"}
	require.NoError(t, cfg.Save())
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		require.Equal(t, "from-config", r.Header.Get("X-Config"))
		require.Equal(t, "signed", r.Header.Get("X-PortainerAgent-Signature"))
		require.Equal(t, "1", r.Header.Get("X-PortainerAgent-ManagerOperation"))
		require.Equal(t, command.UserAgent(), r.Header.Get("User-Agent"))
		if r.URL.Path == "/_ping" {
			w.Header().Set("API-Version", "1.39")
			return
		}
		require.Equal(t, "/v1.39/info", r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{}`)
	}))
	defer server.Close()
	err := WithCli(t.Context(), DockerCliOptions{Host: "tcp" + strings.TrimPrefix(server.URL, "http"), Headers: map[string]string{
		"X-PortainerAgent-Signature": "signed", "X-PortainerAgent-ManagerOperation": "1",
	}}, func(ctx context.Context, cli *command.DockerCli) error {
		_, err := cli.Client().Info(ctx, client.InfoOptions{})
		return err
	})
	require.NoError(t, err)
	require.GreaterOrEqual(t, requests.Load(), int32(2))
}

// Compare with the real CLI's public constructor, not a second set of guessed
// expectations, including its documented environment-over-config precedence.
func TestCLIHeaderEnvironmentMatchesUpstream(t *testing.T) {
	isolateCLIConfig(t)
	for _, value := range []string{"", ` one=first,"two=two,value",one=last,three= value ,empty=`, "missing-equals", "=empty-key", `"unterminated`} {
		t.Run(value, func(t *testing.T) {
			t.Setenv("DOCKER_CUSTOM_HEADERS", value)
			var received []http.Header
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				received = append(received, r.Header.Clone())
			}))
			defer server.Close()
			cfg := configfile.New("")
			cfg.HTTPHeaders = map[string]string{"X-Config": "value"}
			flags := flags.NewClientOptions()
			flags.Hosts = []string{"tcp" + strings.TrimPrefix(server.URL, "http")}
			upstream, upstreamErr := command.NewAPIClientFromFlags(flags, cfg)
			headers, err := cliHTTPHeaders(cfg.HTTPHeaders)
			require.Equal(t, upstreamErr != nil, err != nil)
			if err != nil {
				return
			}
			defer upstream.Close()
			ours, err := client.New(client.WithHost(flags.Hosts[0]), client.WithHTTPHeaders(headers), client.WithUserAgent(command.UserAgent()))
			require.NoError(t, err)
			defer ours.Close()
			_, err = upstream.Ping(t.Context(), client.PingOptions{})
			require.NoError(t, err)
			_, err = ours.Ping(t.Context(), client.PingOptions{})
			require.NoError(t, err)
			require.Len(t, received, 2)
			require.Equal(t, received[0], received[1])
		})
	}
}

func TestWithCliProbeRecoveryAndFailure(t *testing.T) {
	isolateCLIConfig(t)
	for _, version := range []string{"1.24", "1.39", "1.41", "1.54"} {
		t.Run(version, func(t *testing.T) {
			var pings atomic.Int32
			var available atomic.Bool
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					if pings.Add(1) <= 2 || !available.Load() {
						http.Error(w, "restarting", http.StatusServiceUnavailable)
						return
					}
					w.Header().Set("API-Version", version)
					return
				}
				require.Equal(t, "/v"+version+"/info", r.URL.Path)
				w.Header().Set("Content-Type", "application/json")
				fmt.Fprint(w, `{}`)
			}))
			defer server.Close()
			opts := DockerCliOptions{Host: "tcp" + strings.TrimPrefix(server.URL, "http")}
			err := WithCli(t.Context(), opts, func(context.Context, *command.DockerCli) error {
				t.Error("failed negotiation must not publish a client")
				return nil
			})
			require.ErrorContains(t, err, "restarting")
			require.EqualValues(t, 4, pings.Load(), "two Ping calls, each HEAD/GET")
			available.Store(true)
			pings.Store(0) // Recovery also fails both methods of its first probe.
			require.NoError(t, WithCli(t.Context(), opts, func(ctx context.Context, cli *command.DockerCli) error {
				_, err := cli.Client().Info(ctx, client.InfoOptions{})
				return err
			}))
		})
	}
}

func TestWithCliSlowFirstProbe(t *testing.T) {
	isolateCLIConfig(t)
	// Past both the CLI's former 2s metadata deadline and the factory's removed
	// 5s compatibility cutoff. The first valid response must be used, not lost.
	for _, version := range []string{"1.24", "1.39", "1.54"} {
		t.Run(version, func(t *testing.T) {
			var pings atomic.Int32
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/_ping" {
					if pings.Add(1) == 1 {
						time.Sleep(5200 * time.Millisecond)
					}
					w.Header().Set("API-Version", version)
					return
				}
				require.Equal(t, "/v"+version+"/info", r.URL.Path)
				w.Header().Set("Content-Type", "application/json")
				fmt.Fprint(w, `{}`)
			}))
			defer server.Close()
			require.NoError(t, WithCli(t.Context(), DockerCliOptions{Host: "tcp" + strings.TrimPrefix(server.URL, "http")}, func(ctx context.Context, cli *command.DockerCli) error {
				_, err := cli.Client().Info(ctx, client.InfoOptions{})
				return err
			}))
		})
	}
}

func TestWithCliConcurrentOperationsAndPings(t *testing.T) {
	isolateCLIConfig(t)
	for _, version := range []string{"1.24", "1.39", "1.54", ""} {
		t.Run(version, func(t *testing.T) {
			err := WithCli(t.Context(), DockerCliOptions{Host: cliEngine(t, version)}, func(ctx context.Context, cli *command.DockerCli) error {
				api := cli.Client()
				want := version
				if want == "" {
					want = "1.24"
				}
				var wg sync.WaitGroup
				for range 12 {
					wg.Go(func() {
						_, err := api.Info(ctx, client.InfoOptions{})
						require.NoError(t, err)
						_, err = api.Ping(ctx, client.PingOptions{NegotiateAPIVersion: true, ForceNegotiate: true})
						require.NoError(t, err)
						require.Equal(t, want, api.ClientVersion())
					})
				}
				wg.Wait()
				return nil
			})
			require.NoError(t, err)
		})
	}
}

func TestWithCliConcurrentConstruction(t *testing.T) {
	isolateCLIConfig(t)
	host := cliEngine(t, "1.39")
	var wg sync.WaitGroup
	for range 12 {
		wg.Go(func() {
			require.NoError(t, WithCli(t.Context(), DockerCliOptions{Host: host}, func(ctx context.Context, cli *command.DockerCli) error {
				require.Equal(t, "1.39", cli.Client().ClientVersion())
				_, err := cli.Client().Info(ctx, client.InfoOptions{})
				return err
			}))
		})
	}
	wg.Wait()
}

func TestDockerCLIProbeHonorsInternalContextBudget(t *testing.T) {
	isolateCLIConfig(t)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		<-r.Context().Done()
	}))
	defer server.Close()
	cli, err := command.NewDockerCli()
	require.NoError(t, err)
	flags := flags.NewClientOptions()
	flags.Hosts = []string{"tcp" + strings.TrimPrefix(server.URL, "http")}
	require.NoError(t, cli.Initialize(flags))
	// WithCli deliberately removes caller cancellation. Its negotiation helper
	// must nevertheless obey its own bounded context, not retain it in the SDK.
	ctx, cancel := context.WithTimeout(t.Context(), 40*time.Millisecond)
	defer cancel()
	api, err := newDockerCLIClient(ctx, cli)
	require.Nil(t, api)
	require.ErrorIs(t, err, context.DeadlineExceeded)
}

func TestWithCliRegistryCredentials(t *testing.T) {
	isolateCLIConfig(t)
	for _, inline := range []bool{false, true} {
		t.Run(fmt.Sprint(inline), func(t *testing.T) {
			cfg := configfile.New(filepath.Join(config.Dir(), "config.json"))
			cfg.CredentialsStore = "desktop"
			cfg.CredentialHelpers = map[string]string{"helper.example": "custom"}
			require.NoError(t, cfg.Save())
			opts := DockerCliOptions{Host: cliEngine(t, "1.39")}
			if inline {
				opts.Registries = []configtypes.AuthConfig{{ServerAddress: "docker.io", Username: "hub"}, {ServerAddress: "private.example", Username: "private"}}
			}
			require.NoError(t, WithCli(t.Context(), opts, func(_ context.Context, cli *command.DockerCli) error {
				require.Equal(t, "custom", cli.ConfigFile().CredentialHelpers["helper.example"])
				if inline {
					require.Empty(t, cli.ConfigFile().CredentialsStore)
					require.Equal(t, "hub", cli.ConfigFile().AuthConfigs[DockerHubAuthKey].Username)
					require.Equal(t, "private", cli.ConfigFile().AuthConfigs["private.example"].Username)
				} else {
					require.Equal(t, "desktop", cli.ConfigFile().CredentialsStore)
				}
				return nil
			}))
		})
	}
}
