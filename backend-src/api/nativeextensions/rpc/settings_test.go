package rpc

import (
	"context"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	extension "github.com/TheModCraft-TMC/Vessel-HQ-Extension-SDK"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	domain "github.com/portainer/portainer/api/nativeextensions"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestMachineSettingsOverUnixGateway(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	grants := []domain.Permission{{Capability: "settings.service.read"}, {Capability: "settings.service.secrets.read"}}
	record := domain.Record{Revision: 1, Status: "approved", Manifest: domain.Manifest{ID: "org.example.sdk", Name: "Settings", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("a", 64), Permissions: grants, Settings: &domain.SettingsSchema{Fields: map[string]domain.SettingField{"enabled": {Type: "boolean"}, "token": {Type: "string", Secret: true, Required: true}}}}, Grants: grants, Settings: &domain.Settings{Version: 2, Values: map[string]string{"enabled": "true"}, Secrets: map[string]string{"token": "private-setting-value"}}}
	require.NoError(t, store.NativeExtension().Create(&record))
	pki := newPKI(t)
	_, cert, key := pki.issue(t, "settings-server", "", true)
	_, clientCert, clientKey := pki.issue(t, "settings-client", "spiffe://vessel.local/extensions/org.example.sdk/packages/"+strings.Repeat("a", 64), false)
	dir, err := os.MkdirTemp("/tmp", "v-settings-")
	require.NoError(t, err)
	t.Cleanup(func() { _ = os.RemoveAll(dir) })
	ca := filepath.Join(dir, "ca.crt")
	require.NoError(t, os.WriteFile(ca, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: pki.ca.Raw}), 0600))
	ctx, cancel := context.WithCancel(t.Context())
	t.Cleanup(cancel)
	address := "unix://" + filepath.Join(dir, "gateway.sock")
	lookup := func(context.Context, string) (domain.Record, error) {
		r, e := store.NativeExtension().Read(record.ID)
		if e != nil {
			return domain.Record{}, e
		}
		return *r, nil
	}
	_, err = Start(ctx, Config{Address: address, CertificateFile: cert, KeyFile: key, ClientCAFile: ca}, lookup, nil, nil, StorageServices{Settings: NewSettingsStorage(store)})
	require.NoError(t, err)
	client, err := extension.Dial(ctx, extension.Config{Address: address, CAFile: ca, CertificateFile: clientCert, KeyFile: clientKey, ServerName: "localhost", RPCTimeout: time.Second})
	require.NoError(t, err)
	t.Cleanup(func() { _ = client.Close() })
	value, err := client.GetSettings(ctx, 1, false)
	require.NoError(t, err)
	require.Equal(t, int64(2), value.Version)
	require.Equal(t, map[string]string{"enabled": "true"}, value.Values)
	require.Empty(t, value.Secrets)
	value, err = client.GetSettings(ctx, 1, true)
	require.NoError(t, err)
	require.Equal(t, map[string]string{"token": "private-setting-value"}, value.Secrets)
	_, err = client.GetSettings(ctx, 2, true)
	require.Equal(t, codes.FailedPrecondition, status.Code(err))
	// An established connection never caches grants. Secret permission is
	// independent, and cannot substitute for permission to read configuration.
	record.Grants = grants[:1]
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	_, err = client.GetSettings(ctx, 1, true)
	require.Equal(t, codes.PermissionDenied, status.Code(err))
	_, err = client.GetSettings(ctx, 1, false)
	require.NoError(t, err)
	record.Grants = grants[1:]
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	_, err = client.GetSettings(ctx, 1, true)
	require.Equal(t, codes.PermissionDenied, status.Code(err))
	record.Grants = grants
	record.Settings.Secrets = nil
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	_, err = client.GetSettings(ctx, 1, false)
	require.Equal(t, codes.FailedPrecondition, status.Code(err))
	record.Settings.Secrets = map[string]string{"token": "private-setting-value"}
	record.Manifest.PackageDigest = "sha256:" + strings.Repeat("b", 64)
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	_, err = client.GetSettings(ctx, 1, true)
	require.Equal(t, codes.PermissionDenied, status.Code(err))
	entries, err := store.ActivityLog().ReadAll()
	require.NoError(t, err)
	require.Len(t, entries, 8)
	for _, entry := range entries {
		payload, err := base64.StdEncoding.DecodeString(entry.Payload)
		require.NoError(t, err)
		require.NotContains(t, string(payload), "private-setting-value")
		require.NotContains(t, string(payload), "token")
		require.NotContains(t, string(payload), "enabled")
	}
}

func TestMachineSettingsAuditFailureAndIsolation(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	grants := []domain.Permission{{Capability: "settings.service.read"}}
	record := domain.Record{Revision: 1, Status: "approved", Manifest: domain.Manifest{ID: "org.example.sdk", Name: "Settings", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("a", 64), Permissions: grants}, Grants: grants}
	require.NoError(t, store.NativeExtension().Create(&record))
	storage := newSettingsStorage(store, func(dataservices.DataStoreTx, *portainer.ActivityLog) error { return errors.New("audit unavailable") })
	value, err := storage(t.Context(), record.Manifest.ID, record.Manifest.PackageDigest, 1, false)
	require.Nil(t, value)
	require.Equal(t, codes.Internal, status.Code(err))
	_, err = NewSettingsStorage(store)(t.Context(), "org.example.other", record.Manifest.PackageDigest, 1, false)
	require.Equal(t, codes.PermissionDenied, status.Code(err))
	ctx, cancel := context.WithCancel(t.Context())
	cancel()
	_, err = storage(ctx, record.Manifest.ID, record.Manifest.PackageDigest, 1, false)
	require.Equal(t, codes.Canceled, status.Code(err))
}
