package sources

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/pkg/fips"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestVaultConnectionRouteRequiresAdminAndDoesNotNotify(t *testing.T) {
	fips.InitFIPS(false)
	_, store := datastore.MustNewTestStore(t, true, true)
	service, err := jwt.NewService("1h", store)
	require.NoError(t, err)
	bouncer := security.NewRequestBouncer(t.Context(), store, service, apikey.NewAPIKeyService(nil, nil))
	var mutations atomic.Int32
	bouncer.SetMutationPublisher(func() { mutations.Add(1) })
	handler := NewHandler(bouncer, store, nil, nil, nil)

	var requests atomic.Int32
	vault := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		switch r.URL.Path {
		case "/v1/sys/health", "/v1/auth/token/lookup-self":
			w.WriteHeader(http.StatusOK)
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	t.Cleanup(vault.Close)
	payload, err := json.Marshal(VaultSourceCreatePayload{
		Address:        vault.URL,
		Authentication: VaultAuthenticationPayload{Method: "token", Token: rand.Text()},
	})
	require.NoError(t, err)

	for _, role := range []portainer.UserRole{portainer.StandardUserRole, portainer.AdministratorRole} {
		user := &portainer.User{Username: "vault-test-" + rand.Text(), Role: role}
		require.NoError(t, store.User().Create(user))
		token, _, err := service.GenerateToken(&portainer.TokenData{ID: user.ID, Role: role})
		require.NoError(t, err)
		req := httptest.NewRequest(http.MethodPost, "/gitops/sources/vault/test", bytes.NewReader(payload))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if role == portainer.AdministratorRole {
			require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
			require.JSONEq(t, `{"success":true}`, rec.Body.String())
			require.EqualValues(t, 2, requests.Load())
		} else {
			require.Equal(t, http.StatusForbidden, rec.Code, rec.Body.String())
			require.Zero(t, requests.Load(), "denied requests must not contact Vault")
		}
		require.Zero(t, mutations.Load())
	}
}

func TestBuildVaultSourceStoresInternalAddress(t *testing.T) {
	t.Parallel()

	src := BuildVaultSource(VaultSourceCreatePayload{
		Name:            "production-vault",
		Address:         " https://vault.example.com ",
		InternalAddress: " http://vault:8200 ",
		Authentication: VaultAuthenticationPayload{
			Method: "token",
			Token:  "token-value",
		},
	})

	require.NotNil(t, src.Vault)
	assert.Equal(t, "https://vault.example.com", src.Vault.Address)
	assert.Equal(t, "http://vault:8200", src.Vault.InternalAddress)
	assert.Equal(t, 2, src.Vault.KVVersion)
}

func TestApplyVaultSourceChangesCanUpdateAndClearInternalAddress(t *testing.T) {
	t.Parallel()

	src := &portainer.Source{
		Type: portainer.SourceTypeVault,
		Vault: &portainer.VaultConfig{
			Address:         "https://vault.example.com",
			InternalAddress: "http://old-vault:8200",
		},
	}
	empty := ""

	require.NoError(t, ApplyVaultSourceChanges(src, VaultSourceUpdatePayload{
		InternalAddress: &empty,
	}))
	require.Empty(t, src.Vault.InternalAddress)
}

func TestBuildSourceDetailIncludesInternalVaultAddress(t *testing.T) {
	t.Parallel()

	detail := BuildSourceDetail(SourceBase{}, &portainer.Source{
		Type: portainer.SourceTypeVault,
		Vault: &portainer.VaultConfig{
			Address:         "https://vault.example.com",
			InternalAddress: "http://vault:8200",
		},
	}, SourceAccess{})

	require.NotNil(t, detail.Connection.Vault)
	assert.Equal(t, "http://vault:8200", detail.Connection.Vault.InternalAddress)
}
