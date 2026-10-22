package authorization

import portainer "github.com/portainer/portainer/api"

// PredefinedRoles returns a fresh copy of the canonical environment roles.
// Callers decide whether to restore existing records (migrations) or only seed
// missing records (datastore initialization).
func PredefinedRoles(volumeBrowsing bool) []*portainer.Role {
	return []*portainer.Role{
		{
			ID:             portainer.RoleIDEndpointAdmin,
			Name:           "Environment administrator",
			Description:    "Full control of all resources in an environment",
			Priority:       1,
			Authorizations: DefaultEndpointAuthorizationsForEndpointAdministratorRole(),
		},
		{
			ID:             portainer.RoleIDOperator,
			Name:           "Operator",
			Description:    "Operational control of all existing resources in an environment",
			Priority:       2,
			Authorizations: DefaultEndpointAuthorizationsForOperatorRole(volumeBrowsing),
		},
		{
			ID:             portainer.RoleIDHelpdesk,
			Name:           "Helpdesk",
			Description:    "Read-only access of all resources in an environment",
			Priority:       3,
			Authorizations: DefaultEndpointAuthorizationsForHelpDeskRole(volumeBrowsing),
		},
		{
			ID:             portainer.RoleIDStandardUser,
			Name:           "Standard user",
			Description:    "Full control of assigned resources in an environment",
			Priority:       4,
			Authorizations: DefaultEndpointAuthorizationsForStandardUserRole(volumeBrowsing),
		},
		{
			ID:             portainer.RoleIDReadonly,
			Name:           "Read-only user",
			Description:    "Read-only access of assigned resources in an environment",
			Priority:       5,
			Authorizations: DefaultEndpointAuthorizationsForReadOnlyUserRole(volumeBrowsing),
		},
	}
}
