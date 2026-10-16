package rpc

import (
	"context"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	extension "github.com/TheModCraft-TMC/Vessel-HQ/sdk/go"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	domain "github.com/portainer/portainer/api/nativeextensions"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestMachineNotesOverUnixGateway(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	grants := []domain.Permission{{Capability: "storage.service.read"}, {Capability: "storage.service.write"}}
	record := domain.Record{Revision: 1, Status: "approved", Manifest: domain.Manifest{ID: "org.example.sdk", Name: "Machine notes", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("a", 64), Permissions: grants}, Grants: grants}
	require.NoError(t, store.NativeExtension().Create(&record))
	pki := newPKI(t)
	_, cert, key := pki.issue(t, "notes-server", "", true)
	_, clientCert, clientKey := pki.issue(t, "notes-client", "spiffe://vessel.local/extensions/org.example.sdk/packages/"+strings.Repeat("a", 64), false)
	dir, err := os.MkdirTemp("/tmp", "v-notes-")
	require.NoError(t, err)
	t.Cleanup(func() { _ = os.RemoveAll(dir) })
	ca := filepath.Join(dir, "ca.crt")
	require.NoError(t, os.WriteFile(ca, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: pki.ca.Raw}), 0600))
	address := "unix://" + filepath.Join(dir, "gateway.sock")
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	lookup := func(context.Context, string) (domain.Record, error) {
		r, e := store.NativeExtension().Read(record.ID)
		if e != nil {
			return domain.Record{}, e
		}
		return *r, nil
	}
	_, err = Start(ctx, Config{Address: address, CertificateFile: cert, KeyFile: key, ClientCAFile: ca}, lookup, nil, nil, NewNoteStorage(store))
	require.NoError(t, err)
	client, err := extension.Dial(ctx, extension.Config{Address: address, CAFile: ca, CertificateFile: clientCert, KeyFile: clientKey, ServerName: "localhost", RPCTimeout: time.Second})
	require.NoError(t, err)
	t.Cleanup(func() { _ = client.Close() })
	note, err := client.GetNote(ctx, 1)
	require.NoError(t, err)
	require.Equal(t, extension.Note{}, note)
	// No UI trust or service metadata-read approval is required: separate machine grants.
	var wg sync.WaitGroup
	results := make(chan codes.Code, 2)
	for range 2 {
		wg.Go(func() {
			_, e := client.PutNote(ctx, 1, extension.Note{Version: 0, Text: "private note text"})
			results <- status.Code(e)
		})
	}
	wg.Wait()
	close(results)
	counts := map[codes.Code]int{}
	for code := range results {
		counts[code]++
	}
	require.Equal(t, 1, counts[codes.OK])
	require.Equal(t, 1, counts[codes.Aborted])
	note, err = client.GetNote(ctx, 1)
	require.NoError(t, err)
	require.Equal(t, extension.Note{Version: 1, Text: "private note text"}, note)
	_, err = client.GetNote(ctx, 2)
	require.Equal(t, codes.FailedPrecondition, status.Code(err))
	_, err = client.PutNote(ctx, 1, extension.Note{Version: 1, Text: strings.Repeat("x", 16385)})
	require.Equal(t, codes.InvalidArgument, status.Code(err))
	_, err = client.PutNote(ctx, 1, extension.Note{Version: 1, Text: string([]byte{255})})
	require.Equal(t, codes.InvalidArgument, status.Code(err))
	// Independent revocation: write survives removal of the read grant.
	record.Grants = grants[1:]
	record.Note = &domain.Note{Version: 1, Text: "private note text"}
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	_, err = client.GetNote(ctx, 1)
	require.Equal(t, codes.PermissionDenied, status.Code(err))
	_, err = client.PutNote(ctx, 1, extension.Note{Version: 1, Text: "updated private note"})
	require.NoError(t, err)
	record.Grants = grants[:1]
	record.Note = &domain.Note{Version: 2, Text: "updated private note"}
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	_, err = client.PutNote(ctx, 1, extension.Note{Version: 2, Text: "denied"})
	require.Equal(t, codes.PermissionDenied, status.Code(err))
	// Package replacement immediately invalidates the established client identity.
	record.Manifest.PackageDigest = "sha256:" + strings.Repeat("b", 64)
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	_, err = client.GetNote(ctx, 1)
	require.Equal(t, codes.PermissionDenied, status.Code(err))
	entries, err := store.ActivityLog().ReadAll()
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(entries), 8)
	for _, entry := range entries {
		require.Equal(t, "extension:org.example.sdk", entry.Username)
		payload, e := base64.StdEncoding.DecodeString(entry.Payload)
		require.NoError(t, e)
		require.NotContains(t, string(payload), "private note")
		require.NotContains(t, string(payload), "updated private")
		require.Contains(t, string(payload), "capability")
	}
}

func TestMachineNoteWriteRollsBackWithoutAudit(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	grants := []domain.Permission{{Capability: "storage.service.write"}}
	record := domain.Record{Revision: 1, Status: "approved", Manifest: domain.Manifest{ID: "org.example.sdk", Name: "Machine notes", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("a", 64), Permissions: grants}, Grants: grants}
	require.NoError(t, store.NativeExtension().Create(&record))
	storage := newNoteStorage(store, func(dataservices.DataStoreTx, *portainer.ActivityLog) error { return errors.New("audit unavailable") })
	_, err := storage(t.Context(), record.Manifest.ID, record.Manifest.PackageDigest, 0, 0, "invalid", true)
	require.Equal(t, codes.InvalidArgument, status.Code(err))
	_, err = storage(t.Context(), record.Manifest.ID, record.Manifest.PackageDigest, 1, 0, "must roll back", true)
	require.Equal(t, codes.Internal, status.Code(err))
	saved, err := store.NativeExtension().Read(record.ID)
	require.NoError(t, err)
	require.Nil(t, saved.Note)
	_, err = NewNoteStorage(store)(t.Context(), "org.example.different", record.Manifest.PackageDigest, 1, 0, "cross-extension", true)
	require.Equal(t, codes.PermissionDenied, status.Code(err))
	// Existing UI storage grants never confer unattended access.
	record.Manifest.Permissions = []domain.Permission{{Capability: "storage.write"}}
	record.Grants = record.Manifest.Permissions
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	_, err = NewNoteStorage(store)(t.Context(), record.Manifest.ID, record.Manifest.PackageDigest, 1, 0, "denied", true)
	require.Equal(t, codes.PermissionDenied, status.Code(err))
}
