package datastore

import (
	"fmt"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrator"
	"github.com/portainer/portainer/api/internal/authorization"

	"github.com/stretchr/testify/require"
)

func TestInitCreatesPredefinedRoles(t *testing.T) {
	t.Parallel()

	isNew, store := MustNewTestStore(t, false, false)
	require.True(t, isNew)
	roles, err := store.Role().ReadAll()
	require.NoError(t, err)
	require.Empty(t, roles)

	require.NoError(t, store.Init())
	roles, err = store.Role().ReadAll()
	require.NoError(t, err)
	require.Len(t, roles, 5, "fresh-store Init must supply the role editor's permission catalog")
	assertPredefinedRoles(t, store, false)

	require.NoError(t, store.Init())
	assertPredefinedRoles(t, store, false)
}

func assertPredefinedRoles(t *testing.T, store *Store, volumeBrowsing bool) {
	t.Helper()

	for _, want := range expectedPredefinedRoles(volumeBrowsing) {
		got, err := store.Role().Read(want.ID)
		require.NoError(t, err)
		require.Equal(t, want, *got)
		require.NotEmpty(t, got.Authorizations)
	}
}

// Check the full authorization maps, not just a sample permission. Keep the
// expected metadata independent of the shared default-role constructor.
func expectedPredefinedRoles(volumeBrowsing bool) []portainer.Role {
	return []portainer.Role{
		{ID: portainer.RoleIDEndpointAdmin, Name: "Environment administrator", Description: "Full control of all resources in an environment", Priority: 1, Authorizations: authorization.DefaultEndpointAuthorizationsForEndpointAdministratorRole()},
		{ID: portainer.RoleIDOperator, Name: "Operator", Description: "Operational control of all existing resources in an environment", Priority: 2, Authorizations: authorization.DefaultEndpointAuthorizationsForOperatorRole(volumeBrowsing)},
		{ID: portainer.RoleIDHelpdesk, Name: "Helpdesk", Description: "Read-only access of all resources in an environment", Priority: 3, Authorizations: authorization.DefaultEndpointAuthorizationsForHelpDeskRole(volumeBrowsing)},
		{ID: portainer.RoleIDStandardUser, Name: "Standard user", Description: "Full control of assigned resources in an environment", Priority: 4, Authorizations: authorization.DefaultEndpointAuthorizationsForStandardUserRole(volumeBrowsing)},
		{ID: portainer.RoleIDReadonly, Name: "Read-only user", Description: "Read-only access of assigned resources in an environment", Priority: 5, Authorizations: authorization.DefaultEndpointAuthorizationsForReadOnlyUserRole(volumeBrowsing)},
	}
}

func TestInitRepairsCurrentStoresWithoutResettingAccess(t *testing.T) {
	t.Parallel()

	for _, volumeBrowsing := range []bool{false, true} {
		for _, catalog := range []string{"empty", "partial", "complete"} {
			t.Run(fmt.Sprintf("volumeBrowsing=%t/%s", volumeBrowsing, catalog), func(t *testing.T) {
				t.Parallel()
				_, store := MustNewTestStore(t, true, false)
				settings, err := store.Settings().Settings()
				require.NoError(t, err)
				settings.AllowVolumeBrowserForRegularUsers = volumeBrowsing
				require.NoError(t, store.Settings().UpdateSettings(settings))

				// Occupied reserved IDs must be left alone, even if their names,
				// priorities or authorizations differ from the canonical defaults.
				// Custom IDs include a gap to guard against sequence-based seeding.
				for _, id := range []portainer.RoleID{1, 2, 3, 4, 5, 6, 42} {
					require.NoError(t, store.Role().Update(id, &portainer.Role{
						ID: id, Name: fmt.Sprintf("Existing role %d", id), Description: "Keep unchanged", Priority: 30 + int(id),
						Authorizations: portainer.Authorizations{
							portainer.OperationDockerContainerList:   true,
							portainer.OperationDockerContainerDelete: false,
						},
					}))
				}
				missing := map[portainer.RoleID]bool{}
				for id := portainer.RoleID(1); id <= portainer.RoleIDOperator; id++ {
					if catalog == "empty" || (catalog == "partial" && (id == portainer.RoleIDOperator || id == portainer.RoleIDReadonly)) {
						missing[id] = true
						require.NoError(t, store.Role().Delete(id))
					}
				}
				expectedRoles, err := store.Role().ReadAll()
				require.NoError(t, err)
				for _, role := range expectedPredefinedRoles(volumeBrowsing) {
					if missing[role.ID] {
						expectedRoles = append(expectedRoles, role)
					}
				}

				userPolicies := portainer.UserAccessPolicies{1: {RoleID: portainer.RoleIDStandardUser}, 2: {RoleID: 42}}
				teamPolicies := portainer.TeamAccessPolicies{1: {RoleID: portainer.RoleIDOperator}, 2: {RoleID: 6}}
				require.NoError(t, store.Endpoint().Create(&portainer.Endpoint{
					ID: 1, Name: "Existing environment", UserAccessPolicies: userPolicies, TeamAccessPolicies: teamPolicies,
				}))
				group, err := store.EndpointGroup().Read(1)
				require.NoError(t, err)
				group.UserAccessPolicies, group.TeamAccessPolicies = userPolicies, teamPolicies
				require.NoError(t, store.EndpointGroup().Update(group.ID, group))
				require.NoError(t, store.Registry().Create(&portainer.Registry{
					ID: 1, Name: "Existing registry", RegistryAccesses: portainer.RegistryAccesses{
						1: {UserAccessPolicies: userPolicies, TeamAccessPolicies: teamPolicies},
					},
				}))
				require.NoError(t, store.User().Create(&portainer.User{
					ID: 1, Username: "Existing user", Role: portainer.StandardUserRole,
					PortainerAuthorizations: portainer.Authorizations{portainer.OperationPortainerStackList: true},
					EndpointAuthorizations:  portainer.EndpointAuthorizations{1: {portainer.OperationDockerContainerList: true}},
				}))
				expectedEndpoint, err := store.Endpoint().Endpoint(1)
				require.NoError(t, err)
				expectedRegistry, err := store.Registry().Read(1)
				require.NoError(t, err)
				expectedUser, err := store.User().Read(1)
				require.NoError(t, err)

				// Match a real, already-initialized current-version installation.
				// MigrateData has no work to do, so recovery must belong to Init.
				version, err := store.VersionService.Version()
				require.NoError(t, err)
				m := migrator.NewMigrator(store.newMigratorParameters(version, store.flags))
				version.MigratorCount = m.GetMigratorCountOfCurrentAPIVersion()
				require.NoError(t, store.VersionService.UpdateVersion(version))
				require.False(t, m.NeedsMigration())
				require.NoError(t, store.Close())
				isNew, err := store.Open()
				require.NoError(t, err)
				require.False(t, isNew)

				for range 2 {
					// Same ordering as initDataStore on an existing installation.
					require.NoError(t, store.Init())
					require.NoError(t, store.MigrateData())
					roles, err := store.Role().ReadAll()
					require.NoError(t, err)
					require.ElementsMatch(t, expectedRoles, roles)
					endpoint, err := store.Endpoint().Endpoint(1)
					require.NoError(t, err)
					require.Equal(t, expectedEndpoint, endpoint)
					actualGroup, err := store.EndpointGroup().Read(1)
					require.NoError(t, err)
					require.Equal(t, group, actualGroup)
					registry, err := store.Registry().Read(1)
					require.NoError(t, err)
					require.Equal(t, expectedRegistry, registry)
					user, err := store.User().Read(1)
					require.NoError(t, err)
					require.Equal(t, expectedUser, user)
					actualSettings, err := store.Settings().Settings()
					require.NoError(t, err)
					require.Equal(t, settings, actualSettings)
					actualVersion, err := store.VersionService.Version()
					require.NoError(t, err)
					require.Equal(t, version, actualVersion)
				}
			})
		}
	}
}
