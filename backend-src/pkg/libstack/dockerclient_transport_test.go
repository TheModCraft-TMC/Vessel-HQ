package libstack

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"math/big"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/docker/cli/cli/command"
	"github.com/docker/cli/cli/config"
	"github.com/docker/cli/cli/config/configfile"
	"github.com/docker/cli/cli/context/docker"
	"github.com/docker/cli/cli/context/store"
	"github.com/moby/moby/client"
	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/require"
)

func TestWithCliContextResolution(t *testing.T) {
	isolateCLIConfig(t)
	contextHost := cliEngine(t, "1.39")
	envHost := cliEngine(t, "1.41")
	explicitHost := cliEngine(t, "1.54")
	s := store.New(config.ContextStoreDir(), command.DefaultContextStoreConfig())
	require.NoError(t, s.CreateOrUpdate(store.Metadata{Name: "legacy", Endpoints: map[string]any{
		docker.DockerEndpoint: docker.EndpointMeta{Host: contextHost},
	}}))
	cfg := configfile.New(filepath.Join(config.Dir(), "config.json"))
	cfg.CurrentContext = "legacy"
	require.NoError(t, cfg.Save())

	for _, test := range []struct {
		name, host, envHost, envContext, wantContext, wantHost, wantVersion string
	}{
		{"empty host uses current context", "", "", "", "legacy", contextHost, "1.39"},
		{"explicit host overrides context", explicitHost, "", "legacy", "default", explicitHost, "1.54"},
		{"DOCKER_HOST selects default", "", envHost, "legacy", "default", envHost, "1.41"},
		{"DOCKER_CONTEXT selects named context", "", "", "legacy", "legacy", contextHost, "1.39"},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Setenv("DOCKER_HOST", test.envHost)
			t.Setenv("DOCKER_CONTEXT", test.envContext)
			require.NoError(t, WithCli(t.Context(), DockerCliOptions{Host: test.host}, func(ctx context.Context, cli *command.DockerCli) error {
				require.Equal(t, test.wantContext, cli.CurrentContext())
				require.Equal(t, test.wantHost, cli.DockerEndpoint().Host)
				require.Equal(t, test.wantHost, cli.Client().DaemonHost())
				require.Equal(t, test.wantVersion, cli.Client().ClientVersion())
				_, err := cli.Client().Info(ctx, client.InfoOptions{})
				return err
			}))
		})
	}
	t.Setenv("DOCKER_CONTEXT", "does-not-exist")
	require.Error(t, WithCli(t.Context(), DockerCliOptions{}, func(context.Context, *command.DockerCli) error {
		t.Fatal("missing context must not silently use a different engine")
		return nil
	}))
}

func TestWithCliTLSAndContextTLS(t *testing.T) {
	isolateCLIConfig(t)
	// A client-auth-only certificate signed by a test CA, independently from
	// httptest's server certificate. Both directions must be configured correctly.
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	require.NoError(t, err)
	ca := &x509.Certificate{SerialNumber: big.NewInt(1), Subject: pkix.Name{CommonName: "fixture-ca"},
		NotBefore: time.Now().Add(-time.Hour), NotAfter: time.Now().Add(time.Hour),
		IsCA: true, BasicConstraintsValid: true, KeyUsage: x509.KeyUsageCertSign}
	caDER, err := x509.CreateCertificate(rand.Reader, ca, ca, &key.PublicKey, key)
	require.NoError(t, err)
	certDER, err := x509.CreateCertificate(rand.Reader, &x509.Certificate{
		SerialNumber: big.NewInt(2), Subject: pkix.Name{CommonName: "vessel-client"},
		NotBefore: ca.NotBefore, NotAfter: ca.NotAfter, ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
	}, ca, &key.PublicKey, key)
	require.NoError(t, err)
	keyDER, err := x509.MarshalECPrivateKey(key)
	require.NoError(t, err)
	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certDER})
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyDER})
	clientCAs := x509.NewCertPool()
	require.True(t, clientCAs.AppendCertsFromPEM(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: caDER})))
	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.NotNil(t, r.TLS)
		require.Len(t, r.TLS.PeerCertificates, 1)
		require.Equal(t, "vessel-client", r.TLS.PeerCertificates[0].Subject.CommonName)
		require.Equal(t, "signed", r.Header.Get("X-PortainerAgent-Signature"))
		if r.URL.Path == "/_ping" {
			w.Header().Set("API-Version", "1.39")
			return
		}
		require.Equal(t, "/v1.39/info", r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{}`)
	}))
	server.TLS = &tls.Config{ClientAuth: tls.RequireAndVerifyClientCert, ClientCAs: clientCAs, MinVersion: tls.VersionTLS12}
	server.StartTLS()
	defer server.Close()
	serverCA := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: server.Certificate().Raw})
	dir := t.TempDir()
	for name, content := range map[string][]byte{"ca.pem": serverCA, "cert.pem": certPEM, "key.pem": keyPEM} {
		require.NoError(t, os.WriteFile(filepath.Join(dir, name), content, 0600))
	}
	host := "tcp://" + strings.TrimPrefix(server.URL, "https://")
	s := store.New(config.ContextStoreDir(), command.DefaultContextStoreConfig())
	require.NoError(t, s.CreateOrUpdate(store.Metadata{Name: "mtls", Endpoints: map[string]any{
		docker.DockerEndpoint: docker.EndpointMeta{Host: host},
	}}))
	require.NoError(t, s.ResetEndpointTLSMaterial("mtls", docker.DockerEndpoint, &store.EndpointTLSData{Files: map[string][]byte{
		"ca.pem": serverCA, "cert.pem": certPEM, "key.pem": keyPEM,
	}}))
	for _, mode := range []string{"explicit-verified", "explicit-skip-verify", "context-verified"} {
		t.Run(mode, func(t *testing.T) {
			opts := DockerCliOptions{Host: host, Headers: map[string]string{"X-PortainerAgent-Signature": "signed"},
				TLSConfig: portainer.TLSConfiguration{TLS: true, TLSCACertPath: filepath.Join(dir, "ca.pem"),
					TLSCertPath: filepath.Join(dir, "cert.pem"), TLSKeyPath: filepath.Join(dir, "key.pem")}}
			if mode == "explicit-skip-verify" {
				opts.TLSConfig.TLSSkipVerify = true
				opts.TLSConfig.TLSCACertPath = ""
			}
			if mode == "context-verified" {
				opts.Host = ""
				opts.TLSConfig = portainer.TLSConfiguration{}
				t.Setenv("DOCKER_CONTEXT", "mtls")
			}
			require.NoError(t, WithCli(t.Context(), opts, func(ctx context.Context, cli *command.DockerCli) error {
				_, err := cli.Client().Info(ctx, client.InfoOptions{})
				return err
			}))
		})
	}
	// Neither client identity nor server trust can be silently omitted.
	for _, mode := range []string{"missing-client-cert", "untrusted-server"} {
		t.Run(mode, func(t *testing.T) {
			tlsConfig := portainer.TLSConfiguration{TLS: true, TLSCACertPath: filepath.Join(dir, "ca.pem")}
			if mode == "untrusted-server" {
				tlsConfig.TLSCACertPath = ""
				tlsConfig.TLSCertPath = filepath.Join(dir, "cert.pem")
				tlsConfig.TLSKeyPath = filepath.Join(dir, "key.pem")
			}
			require.Error(t, WithCli(t.Context(), DockerCliOptions{Host: host, TLSConfig: tlsConfig}, func(context.Context, *command.DockerCli) error {
				t.Fatal("invalid TLS must not publish a client")
				return nil
			}))
		})
	}
}
