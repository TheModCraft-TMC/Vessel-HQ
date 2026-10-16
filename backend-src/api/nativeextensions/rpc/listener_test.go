package rpc

import (
	"context"
	"encoding/pem"
	"net"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/portainer/portainer/api/nativeextensions"
)

func TestUnixGatewayStartCancellationRemovesSocket(t *testing.T) {
	dir, err := os.MkdirTemp("/tmp", "v-gateway-start-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.RemoveAll(dir) })
	pki := newPKI(t)
	_, certificate, key := pki.issue(t, "gateway", "", true)
	ca := filepath.Join(dir, "ca.crt")
	if err := os.WriteFile(ca, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: pki.ca.Raw}), 0600); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(dir, "gateway.sock")
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	result, err := Start(ctx, Config{Address: "unix://" + path, CertificateFile: certificate, KeyFile: key, ClientCAFile: ca}, func(context.Context, string) (nativeextensions.Record, error) { return nativeextensions.Record{}, nil }, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	cancel()
	select {
	case <-result:
	case <-time.After(time.Second):
		t.Fatal("gateway did not stop")
	}
	if _, err := os.Lstat(path); !os.IsNotExist(err) {
		t.Fatalf("socket survives gateway shutdown: %v", err)
	}
}

func TestUnixGatewayPrivateSocketLifecycle(t *testing.T) {
	dir, err := os.MkdirTemp("/tmp", "v-gateway-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.RemoveAll(dir) })
	path := filepath.Join(dir, "gateway.sock")
	listener, err := listenGateway("unix://" + path)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = listener.Close() })
	info, err := os.Stat(path)
	if err != nil || info.Mode().Perm() != 0600 {
		t.Fatalf("private socket permissions: %v %v", info, err)
	}
	if _, err := listenGateway("unix://" + path); err == nil {
		t.Fatal("replaced existing listener")
	}
	connection, err := net.Dial("unix", path)
	if err != nil {
		t.Fatal(err)
	}
	_ = connection.Close()
	_ = listener.Close()
	if _, err := os.Lstat(path); !os.IsNotExist(err) {
		t.Fatalf("owned socket not removed: %v", err)
	}
	if err := os.WriteFile(path, []byte("preserve"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := listenGateway("unix://" + path); err == nil {
		t.Fatal("overwrote file")
	}
	if data, err := os.ReadFile(path); err != nil || string(data) != "preserve" {
		t.Fatal("existing file changed")
	}
}

func TestUnixGatewayRejectsUnsafeTargets(t *testing.T) {
	for _, address := range []string{"unix://relative.sock", "unix:///", "unix:///tmp/../gateway.sock", "unix:///tmp/a.sock?query", "unix:///tmp/a%2fb.sock", "unix:///tmp/a.sock#fragment"} {
		if listener, err := listenGateway(address); err == nil {
			_ = listener.Close()
			t.Fatalf("accepted %s", address)
		}
	}
	dir := t.TempDir()
	if err := os.Chmod(dir, 0755); err != nil {
		t.Fatal(err)
	}
	if listener, err := listenGateway("unix://" + filepath.Join(dir, "gateway.sock")); err == nil {
		_ = listener.Close()
		t.Fatal("accepted shared directory")
	}
	private := filepath.Join(dir, "private")
	if err := os.Mkdir(private, 0700); err != nil {
		t.Fatal(err)
	}
	link := filepath.Join(dir, "link")
	if err := os.Symlink(private, link); err != nil {
		t.Fatal(err)
	}
	if listener, err := listenGateway("unix://" + filepath.Join(link, "gateway.sock")); err == nil {
		_ = listener.Close()
		t.Fatal("accepted symlink parent")
	}
}
