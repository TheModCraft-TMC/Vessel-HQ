package migrator

import (
	"reflect"

	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/authorization"
)

// restorePredefinedRoles restores the fork's complete environment-role set
// for databases upgraded from Community Edition.
func (m *Migrator) restorePredefinedRoles() error {
	settings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	for _, expected := range authorization.PredefinedRoles(settings.AllowVolumeBrowserForRegularUsers) {
		current, err := m.roleService.Read(expected.ID)
		if err == nil && reflect.DeepEqual(current, expected) {
			continue
		}
		if err != nil && !dataservices.IsErrObjectNotFound(err) {
			return err
		}

		if err := m.roleService.Update(expected.ID, expected); err != nil {
			return err
		}
	}

	return nil
}
