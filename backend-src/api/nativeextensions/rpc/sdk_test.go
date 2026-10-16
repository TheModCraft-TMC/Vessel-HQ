package rpc

import (
	"context"
	"encoding/pem"
	"net"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	extension "github.com/TheModCraft-TMC/Vessel-HQ/sdk/go"
	"github.com/portainer/portainer/api/nativeextensions"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Exercise the distributable SDK against the real host, not a mock gateway.
func TestPublicSDKAgainstHostApprovalAndAudit(t *testing.T) {
	t.Run("tcp", func(t *testing.T) { testPublicSDKAgainstHostApprovalAndAudit(t, false) })
	t.Run("unix", func(t *testing.T) { testPublicSDKAgainstHostApprovalAndAudit(t, true) })
}
func testPublicSDKAgainstHostApprovalAndAudit(t *testing.T, unix bool) {
	pki := newPKI(t)
	_, serverCert, serverKey := pki.issue(t, "sdk-server", "", true)
	caPath := filepath.Join(pki.dir, "ca.crt")
	if err := os.WriteFile(caPath, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: pki.ca.Raw}), 0600); err != nil {
		t.Fatal(err)
	}
	digest := "sha256:" + stringRepeat("a", 64)
	grant := nativeextensions.Permission{Capability: "environments.read", EnvironmentIDs: []int{1}}
	record := nativeextensions.Record{Manifest: nativeextensions.Manifest{ID: "org.example.sdk", Name: "SDK test", Version: "1", APIVersion: "v1", PackageDigest: digest, Permissions: []nativeextensions.Permission{grant}}, Revision: 1, Status: "approved", ServiceReadEnabled: true, Grants: []nativeextensions.Permission{grant}}
	var mu sync.Mutex
	var events []AccessEvent
	var auditFailure bool
	server, err := NewServer(Config{CertificateFile: serverCert, KeyFile: serverKey, ClientCAFile: caPath},
		func(context.Context, string) (nativeextensions.Record, error) {
			mu.Lock()
			defer mu.Unlock()
			return record, nil
		},
		func(context.Context, int) (Environment, error) {
			return Environment{ID: 1, Name: "SDK scoped environment", Type: 1, Status: 1}, nil
		},
		func(_ context.Context, event AccessEvent) error {
			mu.Lock()
			defer mu.Unlock()
			events = append(events, event)
			if auditFailure {
				return context.Canceled
			}
			return nil
		},
	)
	if err != nil {
		t.Fatal(err)
	}
	network, address := "tcp", "127.0.0.1:0"
	if unix {
		dir, e := os.MkdirTemp("/tmp", "v-sdk-host-")
		if e != nil {
			t.Fatal(e)
		}
		t.Cleanup(func() { _ = os.RemoveAll(dir) })
		network, address = "unix", filepath.Join(dir, "gateway.sock")
	}
	var listener net.Listener
	if unix {
		listener, err = listenGateway("unix://" + address)
	} else {
		listener, err = net.Listen(network, address)
	}
	if err != nil {
		server.Stop()
		t.Fatal(err)
	}
	t.Cleanup(func() { server.Stop(); _ = listener.Close() })
	go func() { _ = server.Serve(listener) }()
	_, clientCert, clientKey := pki.issue(t, "sdk-client", "spiffe://vessel.local/extensions/org.example.sdk/packages/"+stringRepeat("a", 64), false)
	clientAddress := listener.Addr().String()
	if unix {
		clientAddress = "unix://" + clientAddress
	}
	config := extension.Config{Address: clientAddress, CAFile: caPath, CertificateFile: clientCert, KeyFile: clientKey, ServerName: "localhost", RPCTimeout: time.Second}
	client, err := extension.Dial(context.Background(), config)
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()
	env, err := client.GetEnvironment(context.Background(), 1)
	if err != nil || env.GetName() != "SDK scoped environment" {
		t.Fatalf("SDK read: %v %v", env, err)
	}
	if _, err := client.GetEnvironment(context.Background(), 2); status.Code(err) != codes.PermissionDenied {
		t.Fatalf("scope escaped: %v", err)
	}
	mu.Lock()
	record.ServiceReadEnabled = false
	mu.Unlock()
	if _, err := client.GetEnvironment(context.Background(), 1); status.Code(err) != codes.PermissionDenied {
		t.Fatalf("revocation cached: %v", err)
	}
	mu.Lock()
	record.ServiceReadEnabled = true
	auditFailure = true
	mu.Unlock()
	if data, err := client.GetEnvironment(context.Background(), 1); data != nil || status.Code(err) != codes.Internal {
		t.Fatalf("data returned without audit: %v %v", data, err)
	}
	mu.Lock()
	auditFailure = false
	record.Status = "disabled"
	mu.Unlock()
	if _, err := client.GetRegistration(context.Background()); status.Code(err) != codes.PermissionDenied {
		t.Fatalf("disabled registration: %v", err)
	}
	if fresh, err := extension.Dial(context.Background(), config); fresh != nil || status.Code(err) != codes.PermissionDenied {
		t.Fatalf("disabled package connected: %v", err)
	}
	mu.Lock()
	defer mu.Unlock()
	if len(events) != 4 || events[0].Outcome != "allowed" || events[1].Outcome != "denied" || events[2].Outcome != "denied" {
		t.Fatalf("missing access audit: %+v", events)
	}
}
