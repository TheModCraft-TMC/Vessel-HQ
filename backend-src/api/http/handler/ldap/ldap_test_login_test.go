package ldap

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/pkg/fips"
	"github.com/stretchr/testify/require"
)

type loginService struct {
	portainer.LDAPService
	calls    int
	err      error
	username string
	password string
	settings portainer.LDAPSettings
}

func (service *loginService) AuthenticateUser(username, password string, settings *portainer.LDAPSettings) error {
	service.calls++
	service.username, service.password, service.settings = username, password, *settings
	return service.err
}

func TestLDAPLoginRoute(t *testing.T) {
	fips.InitFIPS(false)
	_, store := datastore.MustNewTestStore(t, true, true)
	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err)
	bouncer := security.NewRequestBouncer(t.Context(), store, jwtService, apikey.NewAPIKeyService(nil, nil))
	mutations := 0
	bouncer.SetMutationPublisher(func() { mutations++ })
	handler := NewHandler(bouncer)
	handler.DataStore = store
	service := &loginService{}
	handler.LDAPService = service
	settings, err := store.Settings().Settings()
	require.NoError(t, err)
	settings.LDAPSettings.Password = rand.Text()
	require.NoError(t, store.Settings().UpdateSettings(settings))
	admin := &portainer.User{Username: "admin-" + rand.Text(), Role: portainer.AdministratorRole}
	regular := &portainer.User{Username: "user-" + rand.Text(), Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(admin))
	require.NoError(t, store.User().Create(regular))
	payload := testLoginPayload{Username: "alice", Password: rand.Text(), LDAPSettings: portainer.LDAPSettings{URL: "ldap.example:389"}}
	for _, tc := range []struct {
		name    string
		user    *portainer.User
		payload testLoginPayload
		failure error
		status  int
		result  string
		calls   int
	}{
		{name: "anonymous denied", payload: payload, status: http.StatusUnauthorized},
		{name: "standard user denied", user: regular, payload: payload, status: http.StatusForbidden},
		{name: "valid login", user: admin, payload: payload, status: http.StatusOK, result: `{"valid":true}`, calls: 1},
		{name: "invalid credentials", user: admin, payload: payload, failure: httperrors.ErrUnauthorized, status: http.StatusOK, result: `{"valid":false}`, calls: 1},
		{name: "directory unavailable", user: admin, payload: payload, failure: errors.New("directory unavailable"), status: http.StatusInternalServerError, calls: 1},
		{name: "empty password", user: admin, payload: testLoginPayload{Username: "alice"}, status: http.StatusBadRequest},
		{name: "blank username", user: admin, payload: testLoginPayload{Username: "  ", Password: rand.Text()}, status: http.StatusBadRequest},
	} {
		t.Run(tc.name, func(t *testing.T) {
			service.calls, service.err = 0, tc.failure
			body, err := json.Marshal(tc.payload)
			require.NoError(t, err)
			request := httptest.NewRequest(http.MethodPost, "/ldap/test", bytes.NewReader(body))
			request.Header.Set("Content-Type", "application/json")
			if tc.user != nil {
				token, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: tc.user.ID, Role: tc.user.Role})
				require.NoError(t, err)
				request.Header.Set("Authorization", "Bearer "+token)
			}
			recorder := httptest.NewRecorder()
			handler.ServeHTTP(recorder, request)
			require.Equal(t, tc.status, recorder.Code, recorder.Body.String())
			require.Equal(t, tc.calls, service.calls)
			if tc.result != "" {
				require.JSONEq(t, tc.result, recorder.Body.String())
			}
			if tc.calls > 0 {
				require.Equal(t, payload.Username, service.username)
				require.Equal(t, payload.Password, service.password)
				require.Equal(t, payload.LDAPSettings.URL, service.settings.URL)
				require.Equal(t, settings.LDAPSettings.Password, service.settings.Password)
			}
			require.Zero(t, mutations, "login probes must not emit mutation events")
		})
	}
	users, err := store.User().ReadAll()
	require.NoError(t, err)
	require.Len(t, users, 2, "testing login must not provision a user")
}
