package auth

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/oauth"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestResolveOAuthTeamMemberships(t *testing.T) {
	settings := &portainer.OAuthSettings{
		DefaultTeamID: 3,
		TeamMemberships: portainer.OAuthTeamMembershipSettings{
			OAuthClaimName: "groups",
			OAuthClaimMappings: []portainer.OAuthClaimMapping{
				{ClaimValRegex: `^portainer-admins$`, Team: 1},
				{ClaimValRegex: `^portainer-(agentic|automation)$`, Team: 2},
			},
		},
	}

	t.Run("maps every matching claim and does not add the default", func(t *testing.T) {
		desired, managed, err := resolveOAuthTeamMemberships(settings, map[string]any{
			"groups": []any{"portainer-admins", "portainer-agentic", 42},
		})
		require.NoError(t, err)
		require.Equal(t, map[portainer.TeamID]struct{}{1: {}, 2: {}}, desired)
		require.Equal(t, map[portainer.TeamID]struct{}{1: {}, 2: {}, 3: {}}, managed)
	})

	t.Run("uses the default team when the claim is absent", func(t *testing.T) {
		desired, managed, err := resolveOAuthTeamMemberships(settings, nil)
		require.NoError(t, err)
		require.Equal(t, map[portainer.TeamID]struct{}{3: {}}, desired)
		require.Equal(t, map[portainer.TeamID]struct{}{1: {}, 2: {}, 3: {}}, managed)
	})

	t.Run("rejects an invalid regular expression", func(t *testing.T) {
		invalidSettings := *settings
		invalidSettings.TeamMemberships.OAuthClaimMappings = []portainer.OAuthClaimMapping{
			{ClaimValRegex: `[`, Team: 1},
		}
		_, _, err := resolveOAuthTeamMemberships(&invalidSettings, nil)
		require.Error(t, err)
	})
}

func TestSyncOAuthTeamMemberships(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	handler := &Handler{DataStore: store}

	existing := []*portainer.TeamMembership{
		{UserID: 7, TeamID: 1, Role: portainer.TeamLeader},
		{UserID: 7, TeamID: 2, Role: portainer.TeamMember},
		{UserID: 7, TeamID: 9, Role: portainer.TeamMember},
	}
	for _, membership := range existing {
		require.NoError(t, store.TeamMembership().Create(membership))
	}

	settings := &portainer.OAuthSettings{
		OAuthAutoMapTeamMemberships: true,
		TeamMemberships: portainer.OAuthTeamMembershipSettings{
			OAuthClaimName: "groups",
			OAuthClaimMappings: []portainer.OAuthClaimMapping{
				{ClaimValRegex: `^admin$`, Team: 1},
				{ClaimValRegex: `^agentic$`, Team: 2},
				{ClaimValRegex: `^readonly$`, Team: 3},
			},
		},
	}

	require.NoError(t, handler.syncOAuthTeamMemberships(7, settings, map[string]any{
		"groups": []any{"admin", "readonly"},
	}))

	memberships, err := store.TeamMembership().TeamMembershipsByUserID(7)
	require.NoError(t, err)
	require.Len(t, memberships, 3)

	rolesByTeam := make(map[portainer.TeamID]portainer.MembershipRole, len(memberships))
	for _, membership := range memberships {
		rolesByTeam[membership.TeamID] = membership.Role
	}
	require.Equal(t, map[portainer.TeamID]portainer.MembershipRole{
		1: portainer.TeamLeader,
		3: portainer.TeamMember,
		9: portainer.TeamMember,
	}, rolesByTeam)
}

func TestOAuthAuthentikResourceGroupsReachTeamSync(t *testing.T) {
	t.Parallel()
	// Exercise the actual service -> OAuthIdentity.Claims -> team-sync path,
	// including a custom Authentik claim name and conflicting ID-token groups.
	idToken, err := jwt.NewWithClaims(jwt.SigningMethodNone, jwt.MapClaims{
		"preferred_username": "legacy-id-token-user",
		"authentik_groups":   []string{"id-token-only"},
	}).SignedString(jwt.UnsafeAllowNoneSignatureType)
	require.NoError(t, err)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/token" {
			assert.NoError(t, json.NewEncoder(w).Encode(map[string]any{
				"access_token": "test-token", "token_type": "Bearer", "id_token": idToken,
			}))
			return
		}
		assert.Equal(t, "Bearer test-token", r.Header.Get("Authorization"))
		_, _ = w.Write([]byte(`{"preferred_username":"userinfo-user","authentik_groups":["vessel-operators"]}`))
	}))
	defer srv.Close()
	settings := &portainer.OAuthSettings{
		AccessTokenURI: srv.URL + "/token", ResourceURI: srv.URL + "/userinfo",
		UserIdentifier: "preferred_username", OAuthAutoMapTeamMemberships: true,
		TeamMemberships: portainer.OAuthTeamMembershipSettings{
			OAuthClaimName: "authentik_groups",
			OAuthClaimMappings: []portainer.OAuthClaimMapping{
				{ClaimValRegex: `^vessel-operators$`, Team: 1},
				{ClaimValRegex: `^id-token-only$`, Team: 2},
			},
		},
	}
	identity, err := oauth.NewService().Authenticate(t.Context(), "code", settings)
	require.NoError(t, err)
	require.Equal(t, "legacy-id-token-user", identity.Username, "preserve the base ID-token-first identity precedence")

	_, store := datastore.MustNewTestStore(t, true, false)
	handler := &Handler{DataStore: store}
	require.NoError(t, handler.syncOAuthTeamMemberships(7, settings, identity.Claims))
	memberships, err := store.TeamMembership().TeamMembershipsByUserID(7)
	require.NoError(t, err)
	require.Len(t, memberships, 1)
	require.Equal(t, portainer.TeamID(1), memberships[0].TeamID)
}
