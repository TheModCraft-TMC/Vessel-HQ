package datastore

import (
	"os"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/authorization"
)

// Init creates the default data set.
func (store *Store) Init() error {
	err := store.checkOrCreateDefaultSettings()
	if err != nil {
		return err
	}

	err = store.checkOrCreateDefaultSSLSettings()
	if err != nil {
		return err
	}

	if err := store.checkOrCreateDefaultRoles(); err != nil {
		return err
	}

	return store.checkOrCreateDefaultData()
}

// checkOrCreateDefaultRoles also repairs stores already at the current schema
// version: fresh databases skip migrations, including the role restoration.
// Unlike that migration, initialization must never replace an existing role.
func (store *Store) checkOrCreateDefaultRoles() error {
	return store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		settings, err := tx.Settings().Settings()
		if err != nil {
			return err
		}

		for _, role := range authorization.PredefinedRoles(settings.AllowVolumeBrowserForRegularUsers) {
			_, err := tx.Role().Read(role.ID)
			if err == nil {
				continue
			}
			if !dataservices.IsErrObjectNotFound(err) {
				return err
			}

			// Use the reserved ID, not the bucket sequence used by Create.
			if err := tx.Role().Update(role.ID, role); err != nil {
				return err
			}
		}

		return nil
	})
}

func (store *Store) checkOrCreateDefaultSettings() error {
	isDDExtention := false
	if _, ok := os.LookupEnv("DOCKER_EXTENSION"); ok {
		isDDExtention = true
	}

	// TODO: these need to also be applied when importing
	settings, err := store.SettingsService.Settings()
	if store.IsErrObjectNotFound(err) {
		defaultSettings := &portainer.Settings{
			AuthenticationMethod: portainer.AuthenticationInternal,
			BlackListedLabels:    make([]portainer.Pair, 0),
			InternalAuthSettings: portainer.InternalAuthSettings{
				RequiredPasswordLength: 12,
			},
			LDAPSettings: portainer.LDAPSettings{
				AnonymousMode:   true,
				AutoCreateUsers: true,
				TLSConfig:       portainer.TLSConfiguration{},
				SearchSettings: []portainer.LDAPSearchSettings{
					{},
				},
				GroupSearchSettings: []portainer.LDAPGroupSearchSettings{
					{},
				},
			},
			OAuthSettings: portainer.OAuthSettings{
				SSO: true,
			},
			SnapshotInterval:         portainer.DefaultSnapshotInterval,
			EdgeAgentCheckinInterval: portainer.DefaultEdgeAgentCheckinIntervalInSeconds,
			TemplatesURL:             "",
			HelmRepositoryURL:        portainer.DefaultHelmRepositoryURL,
			UserSessionTimeout:       portainer.DefaultUserSessionTimeout,
			KubeconfigExpiry:         portainer.DefaultKubeconfigExpiry,
			KubectlShellImage:        *store.flags.KubectlShellImage,

			IsDockerDesktopExtension: isDDExtention,
			EnforceEdgeID:            true,
		}

		return store.SettingsService.UpdateSettings(defaultSettings)
	}
	if err != nil {
		return err
	}

	if settings.UserSessionTimeout == "" {
		settings.UserSessionTimeout = portainer.DefaultUserSessionTimeout
		return store.Settings().UpdateSettings(settings)
	}

	return nil
}

func (store *Store) checkOrCreateDefaultSSLSettings() error {
	_, err := store.SSLSettings().Settings()
	if store.IsErrObjectNotFound(err) {
		defaultSSLSettings := &portainer.SSLSettings{
			HTTPEnabled: true,
		}

		return store.SSLSettings().UpdateSettings(defaultSSLSettings)
	}

	return err
}

func (store *Store) checkOrCreateDefaultData() error {
	groups, err := store.EndpointGroupService.ReadAll()
	if err != nil {
		return err
	}

	if len(groups) == 0 {
		unassignedGroup := &portainer.EndpointGroup{
			Name:               "Unassigned",
			Description:        "Unassigned environments",
			Labels:             []portainer.Pair{},
			UserAccessPolicies: portainer.UserAccessPolicies{},
			TeamAccessPolicies: portainer.TeamAccessPolicies{},
			TagIDs:             []portainer.TagID{},
		}

		err = store.EndpointGroupService.Create(unassignedGroup)
		if err != nil {
			return err
		}
	}

	return nil
}
