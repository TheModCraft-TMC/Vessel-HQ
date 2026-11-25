package templates

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"
	libclient "github.com/portainer/portainer/pkg/libhttp/client"

	"github.com/portainer/portainer/pkg/featureflags"
	"github.com/stretchr/testify/require"
)

func TestTemplateFileDoesNotPublishMutation(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, true)
	user := &portainer.User{Username: "reader", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(user))
	service, err := jwt.NewService("1h", store)
	require.NoError(t, err)
	token, _, err := service.GenerateToken(&portainer.TokenData{ID: user.ID, Role: user.Role})
	require.NoError(t, err)

	catalog := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"version":"2","templates":[{"type":3,"stackfile":"services: {}"}]}`))
	}))
	t.Cleanup(catalog.Close)
	settings, err := store.Settings().Settings()
	require.NoError(t, err)
	settings.TemplatesURL = catalog.URL
	require.NoError(t, store.Settings().UpdateSettings(settings))

	bouncer := security.NewRequestBouncer(t.Context(), store, service, apikey.NewAPIKeyService(nil, nil))
	mutations := 0
	bouncer.SetMutationPublisher(func() { mutations++ })
	handler := NewHandler(bouncer)
	handler.DataStore = store

	for _, authenticated := range []bool{false, true, true} {
		req := httptest.NewRequest(http.MethodPost, "/templates/1/file", nil)
		if authenticated {
			req.Header.Set("Authorization", "Bearer "+token)
		}
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if authenticated {
			require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
			require.JSONEq(t, `{"FileContent":"services: {}"}`, rec.Body.String())
		} else {
			require.Equal(t, http.StatusUnauthorized, rec.Code)
		}
		require.Zero(t, mutations, "template queries must not invalidate themselves")
	}
}

// templateFile must not dereference a nil templates response. fetchTemplates
// returns (nil, nil) when external requests are disabled and the configured
// templates URL is still the default one, which used to panic further down
// when indexing into the (nil) template list.
//
// This test mutates the process-wide featureflags state, so it intentionally
// does not run in parallel with other tests.
func TestTemplateFile_ReturnsNotFound_WhenExternalRequestsDisabledForDefaultURL(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)

	featureflags.Parse([]string{libclient.DisableExternalRequests}, []featureflags.Feature{libclient.DisableExternalRequests})
	t.Cleanup(func() {
		featureflags.Parse(nil, []featureflags.Feature{libclient.DisableExternalRequests})
	})

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store

	req := httptest.NewRequest(http.MethodPost, "/templates/1/file", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	require.Equal(t, http.StatusNotFound, rec.Code)
}
