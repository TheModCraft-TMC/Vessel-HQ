package delivery

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	domain "github.com/portainer/portainer/api/nativeextensions"
	"github.com/stretchr/testify/require"
	"strings"
	"testing"
)

func TestTransactionAuthorizationSeesRevocationAndDemotion(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	admin := &portainer.User{Username: "admin", Role: portainer.AdministratorRole}
	require.NoError(t, store.User().Create(admin))
	permissions := []domain.Permission{{Capability: "ui.native"}, {Capability: "stacks.images.update", EnvironmentIDs: []int{1}, StackIDs: []int{2}}, {Capability: "stacks.images.auto-update", EnvironmentIDs: []int{1}, StackIDs: []int{2}}}
	record := domain.Record{Revision: 1, Status: "approved", TrustedNativeUI: true, Grants: permissions, Manifest: domain.Manifest{ID: "org.example.updates", Name: "Updates", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("a", 64), Permissions: permissions}, ImageAutomation: &domain.ImageAutomation{Enabled: true, Version: 1, Mode: "automatic", EnvironmentID: 1, StackID: 2, ConfiguredBy: int(admin.ID)}}
	require.NoError(t, store.NativeExtension().Create(&record))
	ctx := WithAuthorization(t.Context(), Authorization{RegistrationID: record.ID, Revision: 1, PackageDigest: record.Manifest.PackageDigest, Capability: "stacks.images.update", EnvironmentID: 1, StackID: 2, UserID: int(admin.ID), AutomationVersion: 1})
	check := func() error {
		return store.ViewTx(func(tx dataservices.DataStoreTx) error { return CheckAuthorizationTx(ctx, tx) })
	}
	require.NoError(t, check())
	record.ImageAutomation.Enabled = false
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	require.ErrorIs(t, check(), domain.ErrDenied)
	record.ImageAutomation.Enabled = true
	record.Grants = permissions[:2]
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	require.ErrorIs(t, check(), domain.ErrDenied)
	record.Grants = permissions
	require.NoError(t, store.NativeExtension().Update(record.ID, &record))
	admin.Role = portainer.StandardUserRole
	require.NoError(t, store.User().Update(admin.ID, admin))
	require.ErrorIs(t, check(), domain.ErrDenied)
}
