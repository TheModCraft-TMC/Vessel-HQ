package settings

import (
	"net/url"
	"testing"

	portainer "github.com/portainer/portainer/api"
)

const (
	dummyOAuthClientID          = "1a2b3c4d"
	dummyOAuthScopes            = "scopes"
	dummyOAuthAuthenticationURI = "example.com/auth"
	dummyOAuthRedirectURI       = "example.com/redirect"
	dummyOAuthLogoutURI         = "example.com/logout"
)

func newTestSettings() (loginURI string, settings *portainer.Settings) {
	settings = &portainer.Settings{
		AuthenticationMethod: portainer.AuthenticationOAuth,
		OAuthSettings: portainer.OAuthSettings{
			AuthorizationURI: dummyOAuthAuthenticationURI,
			ClientID:         dummyOAuthClientID,
			Scopes:           dummyOAuthScopes,
			RedirectURI:      dummyOAuthRedirectURI,
			LogoutURI:        dummyOAuthLogoutURI,
		},
	}
	loginURI = buildOAuthLoginURI(&settings.OAuthSettings)
	return
}

func TestGeneratePublicSettingsWithSSO(t *testing.T) {
	t.Parallel()
	_, mockAppSettings := newTestSettings()

	mockAppSettings.OAuthSettings.SSO = true
	dummyOAuthLoginURI := buildOAuthLoginURI(&mockAppSettings.OAuthSettings)
	publicSettings := generatePublicSettings(mockAppSettings)
	if publicSettings.AuthenticationMethod != portainer.AuthenticationOAuth {
		t.Errorf("wrong AuthenticationMethod, want: %d, got: %d", portainer.AuthenticationOAuth, publicSettings.AuthenticationMethod)
	}

	if publicSettings.OAuthLoginURI != dummyOAuthLoginURI {
		t.Errorf("wrong OAuthLoginURI when SSO is switched on, want: %s, got: %s", dummyOAuthLoginURI, publicSettings.OAuthLoginURI)
	}

	if publicSettings.OAuthLogoutURI != dummyOAuthLogoutURI {
		t.Errorf("wrong OAuthLogoutURI, want: %s, got: %s", dummyOAuthLogoutURI, publicSettings.OAuthLogoutURI)
	}
}

func TestGeneratePublicSettingsWithoutSSO(t *testing.T) {
	t.Parallel()
	_, mockAppSettings := newTestSettings()

	mockAppSettings.OAuthSettings.SSO = false
	expectedOAuthLoginURI := buildOAuthLoginURI(&mockAppSettings.OAuthSettings)
	publicSettings := generatePublicSettings(mockAppSettings)
	if publicSettings.AuthenticationMethod != portainer.AuthenticationOAuth {
		t.Errorf("wrong AuthenticationMethod, want: %d, got: %d", portainer.AuthenticationOAuth, publicSettings.AuthenticationMethod)
	}

	if publicSettings.OAuthLoginURI != expectedOAuthLoginURI {
		t.Errorf("wrong OAuthLoginURI when SSO is switched off, want: %s, got: %s", expectedOAuthLoginURI, publicSettings.OAuthLoginURI)
	}

	if publicSettings.OAuthLogoutURI != dummyOAuthLogoutURI {
		t.Errorf("wrong OAuthLogoutURI, want: %s, got: %s", dummyOAuthLogoutURI, publicSettings.OAuthLogoutURI)
	}
}

func TestGeneratePublicSettingsWithOAuthTeamSync(t *testing.T) {
	t.Parallel()
	_, mockAppSettings := newTestSettings()
	mockAppSettings.OAuthSettings.OAuthAutoMapTeamMemberships = true

	publicSettings := generatePublicSettings(mockAppSettings)
	if !publicSettings.TeamSync {
		t.Error("expected OAuth automatic team membership to enable public team sync state")
	}
}

func TestBuildOAuthLoginURIPreservesAndEncodesParameters(t *testing.T) {
	t.Parallel()
	settings := &portainer.OAuthSettings{
		AuthorizationURI: "https://identity.example/authorize?audience=vessel%20api",
		ClientID:         "client + id",
		RedirectURI:      "https://vessel.example/oauth/callback?source=login",
		Scopes:           "openid,profile,email",
		SSO:              false,
	}

	loginURI := buildOAuthLoginURI(settings)
	parsed, err := url.Parse(loginURI)
	if err != nil {
		t.Fatalf("expected a valid OAuth login URI: %v", err)
	}

	query := parsed.Query()
	if query.Get("audience") != "vessel api" {
		t.Errorf("expected existing authorization parameters to be preserved, got %q", query.Get("audience"))
	}
	if query.Get("client_id") != settings.ClientID {
		t.Errorf("expected client ID to round-trip, got %q", query.Get("client_id"))
	}
	if query.Get("redirect_uri") != settings.RedirectURI {
		t.Errorf("expected redirect URI to round-trip, got %q", query.Get("redirect_uri"))
	}
	if query.Get("scope") != settings.Scopes {
		t.Errorf("expected scopes to round-trip, got %q", query.Get("scope"))
	}
	if query.Get("prompt") != "login" {
		t.Errorf("expected prompt=login when SSO is disabled, got %q", query.Get("prompt"))
	}
}
