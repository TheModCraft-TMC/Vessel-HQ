package rpc

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"errors"
	"math/big"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	extensionv1 "github.com/TheModCraft-TMC/Vessel-HQ/sdk/go/proto/v1"
	"github.com/portainer/portainer/api/nativeextensions"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/grpc/test/bufconn"
)

type testPKI struct {
	ca   *x509.Certificate
	key  *ecdsa.PrivateKey
	pool *x509.CertPool
	dir  string
}

func newPKI(t *testing.T) testPKI {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	ca := &x509.Certificate{SerialNumber: big.NewInt(1), Subject: pkix.Name{CommonName: "test extension CA"}, NotBefore: time.Now().Add(-time.Minute), NotAfter: time.Now().Add(time.Hour), KeyUsage: x509.KeyUsageCertSign, IsCA: true, BasicConstraintsValid: true}
	der, err := x509.CreateCertificate(rand.Reader, ca, ca, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	ca, err = x509.ParseCertificate(der)
	if err != nil {
		t.Fatal(err)
	}
	pool := x509.NewCertPool()
	pool.AddCert(ca)
	return testPKI{ca: ca, key: key, pool: pool, dir: t.TempDir()}
}
func (p testPKI) issue(t *testing.T, name, uri string, server bool) (tls.Certificate, string, string) {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	serial, err := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 120))
	if err != nil {
		t.Fatal(err)
	}
	cert := &x509.Certificate{SerialNumber: serial, Subject: pkix.Name{CommonName: name}, NotBefore: time.Now().Add(-time.Minute), NotAfter: time.Now().Add(time.Hour), KeyUsage: x509.KeyUsageDigitalSignature, ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth}}
	if server {
		cert.DNSNames = []string{"localhost"}
		cert.ExtKeyUsage = []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth}
	}
	if uri != "" {
		u, e := url.Parse(uri)
		if e != nil {
			t.Fatal(e)
		}
		cert.URIs = []*url.URL{u}
	}
	der, err := x509.CreateCertificate(rand.Reader, cert, p.ca, &key.PublicKey, p.key)
	if err != nil {
		t.Fatal(err)
	}
	keyDER, err := x509.MarshalPKCS8PrivateKey(key)
	if err != nil {
		t.Fatal(err)
	}
	cp := filepath.Join(p.dir, name+".crt")
	kp := filepath.Join(p.dir, name+".key")
	for file, data := range map[string][]byte{cp: pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}), kp: pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: keyDER})} {
		if err = os.WriteFile(file, data, 0600); err != nil {
			t.Fatal(err)
		}
	}
	pair, err := tls.LoadX509KeyPair(cp, kp)
	if err != nil {
		t.Fatal(err)
	}
	return pair, cp, kp
}

func TestMutualTLSIdentityAndImmediateRevocation(t *testing.T) {
	pki := newPKI(t)
	_, cert, key := pki.issue(t, "server", "", true)
	caPath := filepath.Join(pki.dir, "ca.crt")
	if err := os.WriteFile(caPath, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: pki.ca.Raw}), 0600); err != nil {
		t.Fatal(err)
	}
	digest := "sha256:" + stringRepeat("a", 64)
	record := nativeextensions.Record{Manifest: nativeextensions.Manifest{ID: "org.example.inspector", Name: "Inspector", Version: "1", APIVersion: "v1", PackageDigest: digest, Permissions: []nativeextensions.Permission{{Capability: "ui.native"}}}, Revision: 2, Status: "approved", TrustedNativeUI: true, Grants: []nativeextensions.Permission{{Capability: "ui.native"}}}
	var mu sync.Mutex
	var auditFailure, revokeDuringRead bool
	readCount := 0
	var events []AccessEvent
	server, err := NewServer(Config{CertificateFile: cert, KeyFile: key, ClientCAFile: caPath}, func(_ context.Context, id string) (nativeextensions.Record, error) {
		mu.Lock()
		defer mu.Unlock()
		return record, nil
	}, func(_ context.Context, id int) (Environment, error) {
		mu.Lock()
		defer mu.Unlock()
		readCount++
		if revokeDuringRead {
			record.ServiceReadEnabled = false
		}
		if id != 1 {
			return Environment{}, ErrEnvironmentNotFound
		}
		return Environment{ID: 1, Name: "Scoped environment", Type: 1, Status: 1}, nil
	}, func(_ context.Context, event AccessEvent) error {
		mu.Lock()
		defer mu.Unlock()
		events = append(events, event)
		if auditFailure {
			return errors.New("audit unavailable")
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	listener := bufconn.Listen(1024 * 1024)
	go func() { _ = server.Serve(listener) }()
	t.Cleanup(server.Stop)
	connect := func(t *testing.T, uri string, certificate bool) extensionv1.ExtensionGatewayClient {
		t.Helper()
		transport := &tls.Config{MinVersion: tls.VersionTLS13, RootCAs: pki.pool, ServerName: "localhost"}
		if certificate {
			pair, _, _ := pki.issue(t, "client-"+big.NewInt(time.Now().UnixNano()).String(), uri, false)
			transport.Certificates = []tls.Certificate{pair}
		}
		conn, e := grpc.NewClient("passthrough:///extensions", grpc.WithTransportCredentials(credentials.NewTLS(transport)), grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) { return listener.Dial() }))
		if e != nil {
			t.Fatal(e)
		}
		t.Cleanup(func() { _ = conn.Close() })
		return extensionv1.NewExtensionGatewayClient(conn)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	client := connect(t, "spiffe://vessel.local/extensions/org.example.inspector/packages/"+stringRepeat("a", 64), true)
	response, err := client.GetRegistration(ctx, &extensionv1.GetRegistrationRequest{})
	if err != nil {
		t.Fatal(err)
	}
	if response.ExtensionId != record.Manifest.ID || response.Revision != 2 || response.RuntimeAvailable {
		t.Fatalf("unexpected registration: %v", response)
	}
	if _, err := client.GetEnvironment(ctx, &extensionv1.GetEnvironmentRequest{EnvironmentId: 1}); status.Code(err) != codes.PermissionDenied {
		t.Fatalf("missing machine grant accepted: %v", err)
	}
	mu.Lock()
	if readCount != 0 || len(events) != 1 || events[0].Outcome != "denied" {
		t.Fatal("denied call must audit without reading")
	}
	// Service-only extensions need no native browser trust, only explicit machine scopes.
	record.TrustedNativeUI = false
	record.Manifest.Permissions = []nativeextensions.Permission{{Capability: "environments.read", EnvironmentIDs: []int{1, 3}}}
	record.Grants = record.Manifest.Permissions
	record.ServiceReadEnabled = true
	mu.Unlock()
	metadataResponse, err := client.GetEnvironment(ctx, &extensionv1.GetEnvironmentRequest{EnvironmentId: 1})
	if err != nil || metadataResponse.GetId() != 1 || metadataResponse.GetName() != "Scoped environment" || metadataResponse.GetType() != 1 || metadataResponse.GetStatus() != 1 {
		t.Fatalf("metadata read failed: %v %v", metadataResponse, err)
	}
	response, err = client.GetRegistration(ctx, &extensionv1.GetRegistrationRequest{})
	if err != nil || !response.RuntimeAvailable {
		t.Fatalf("read service availability missing: %v %v", response, err)
	}
	for _, tc := range []struct {
		id   int64
		code codes.Code
	}{{0, codes.InvalidArgument}, {-1, codes.InvalidArgument}, {2, codes.PermissionDenied}, {3, codes.NotFound}} {
		if _, err := client.GetEnvironment(ctx, &extensionv1.GetEnvironmentRequest{EnvironmentId: tc.id}); status.Code(err) != tc.code {
			t.Fatalf("environment %d expected %v got %v", tc.id, tc.code, err)
		}
	}
	mu.Lock()
	auditFailure = true
	mu.Unlock()
	if data, err := client.GetEnvironment(ctx, &extensionv1.GetEnvironmentRequest{EnvironmentId: 1}); data != nil || status.Code(err) != codes.Internal {
		t.Fatalf("read leaked without audit: %v %v", data, err)
	}
	mu.Lock()
	auditFailure = false
	revokeDuringRead = true
	mu.Unlock()
	if data, err := client.GetEnvironment(ctx, &extensionv1.GetEnvironmentRequest{EnvironmentId: 1}); data != nil || status.Code(err) != codes.PermissionDenied {
		t.Fatalf("in-flight revocation failed: %v %v", data, err)
	}
	mu.Lock()
	revokeDuringRead = false
	record.ServiceReadEnabled = true
	mu.Unlock()
	mu.Lock()
	record.Status = "disabled"
	record.Grants = nil
	mu.Unlock()
	if _, err = client.GetRegistration(ctx, &extensionv1.GetRegistrationRequest{}); status.Code(err) != codes.PermissionDenied {
		t.Fatalf("revoked credential accepted: %v", err)
	}
	if _, err = client.GetEnvironment(ctx, &extensionv1.GetEnvironmentRequest{EnvironmentId: 1}); status.Code(err) != codes.PermissionDenied {
		t.Fatalf("disabled service read accepted: %v", err)
	}
	mu.Lock()
	record.Status = "approved"
	mu.Unlock()
	for _, tc := range []struct {
		name, uri   string
		certificate bool
		code        codes.Code
	}{
		{"wrong package", "spiffe://vessel.local/extensions/org.example.inspector/packages/" + stringRepeat("b", 64), true, codes.PermissionDenied},
		{"wrong extension", "spiffe://vessel.local/extensions/org.other.inspector/packages/" + stringRepeat("a", 64), true, codes.PermissionDenied},
		{"wrong trust domain", "spiffe://attacker.local/extensions/org.example.inspector/packages/" + stringRepeat("a", 64), true, codes.Unauthenticated},
		{"missing identity", "", true, codes.Unauthenticated},
		{"no certificate", "", false, codes.Unavailable},
	} {
		t.Run(tc.name, func(t *testing.T) {
			c := connect(t, tc.uri, tc.certificate)
			spoofed := metadata.NewOutgoingContext(ctx, metadata.Pairs("extension-id", "org.example.inspector", "package-digest", digest))
			_, e := c.GetRegistration(spoofed, &extensionv1.GetRegistrationRequest{})
			if status.Code(e) != tc.code {
				t.Fatalf("expected %v, got %v", tc.code, e)
			}
		})
	}
}
func stringRepeat(s string, n int) string {
	var result string
	for range n {
		result += s
	}
	return result
}

func TestConfigurationFailsClosed(t *testing.T) {
	for _, name := range []string{"VESSEL_EXTENSION_GRPC_ADDRESS", "VESSEL_EXTENSION_GRPC_CERT", "VESSEL_EXTENSION_GRPC_KEY", "VESSEL_EXTENSION_GRPC_CLIENT_CA"} {
		t.Setenv(name, "")
	}
	if config, err := ConfigFromEnvironment(); err != nil || config.Address != "" {
		t.Fatalf("expected disabled: %+v %v", config, err)
	}
	t.Setenv("VESSEL_EXTENSION_GRPC_ADDRESS", "127.0.0.1:9444")
	if _, err := ConfigFromEnvironment(); err == nil {
		t.Fatal("partial TLS config accepted")
	}
	if _, err := NewServer(Config{}, nil, nil, nil); err == nil {
		t.Fatal("missing registry accepted")
	}
}
