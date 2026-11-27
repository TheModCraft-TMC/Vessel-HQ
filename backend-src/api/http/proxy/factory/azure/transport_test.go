package azure

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/client"
	"github.com/portainer/portainer/api/http/security"
	"github.com/stretchr/testify/require"
)

const testGroup = "/subscriptions/sub/resourceGroups/group/providers/Microsoft.ContainerInstance/containerGroups/fixture"

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(request *http.Request) (*http.Response, error) { return f(request) }

func TestRefreshAzureBearerBeforeExpiry(t *testing.T) {
	var calls atomic.Int32
	transport := NewTransport(&portainer.AzureCredentials{}, nil, nil)
	transport.token = &azureAPIToken{value: "expiring", expirationTime: time.Now().Add(time.Minute)}
	transport.client = &client.HTTPClient{Client: &http.Client{Transport: roundTripFunc(func(*http.Request) (*http.Response, error) {
		calls.Add(1)
		body := fmt.Sprintf(`{"access_token":"fresh","expires_on":"%d"}`, time.Now().Add(time.Hour).Unix())
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(body))}, nil
	})}}

	var workers sync.WaitGroup
	for range 8 {
		workers.Go(func() {
			_, _ = transport.retrieveAuthenticationToken()
		})
	}
	workers.Wait()
	token, err := transport.retrieveAuthenticationToken()
	require.NoError(t, err)
	require.Equal(t, "fresh", token)
	require.EqualValues(t, 1, calls.Load())
}

func TestContainerGroupCreateChecksExistenceUsingAzureBearer(t *testing.T) {
	for _, tt := range []struct {
		name       string
		checkCode  int
		createCode int
		wantCode   int
	}{
		{"existing", http.StatusOK, 0, http.StatusConflict},
		{"denied", http.StatusForbidden, 0, http.StatusForbidden},
		{"transient failure", http.StatusServiceUnavailable, 0, http.StatusServiceUnavailable},
		{"missing", http.StatusNotFound, http.StatusCreated, http.StatusCreated},
		{"create failure", http.StatusNotFound, http.StatusBadRequest, http.StatusBadRequest},
	} {
		t.Run(tt.name, func(t *testing.T) {
			_, store, cleanup, err := datastore.NewTestStore(t, true, false)
			require.NoError(t, err)
			t.Cleanup(cleanup)
			var writes atomic.Int32
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
				if request.Header.Get("Authorization") != "Bearer azure-token" || request.URL.Path != testGroup || request.URL.Query().Get("api-version") != "2021-10-01" {
					w.WriteHeader(http.StatusUnauthorized)
					return
				}
				w.Header().Set("Content-Type", "application/json")
				switch request.Method {
				case http.MethodGet:
					w.WriteHeader(tt.checkCode)
				case http.MethodPut:
					writes.Add(1)
					if tt.createCode == 0 {
						w.WriteHeader(http.StatusBadRequest)
						return
					}
					w.Header().Set("Location", "/operation")
					w.WriteHeader(tt.createCode)
					_, _ = fmt.Fprintf(w, `{"id":%q}`, testGroup)
				}
			}))
			t.Cleanup(upstream.Close)
			transport := NewTransport(nil, store, nil)
			transport.token = &azureAPIToken{value: "azure-token", expirationTime: time.Now().Add(time.Hour)}
			request, err := http.NewRequestWithContext(t.Context(), http.MethodPut, upstream.URL+testGroup+"?api-version=2021-10-01", strings.NewReader(`{"name":"fixture"}`))
			require.NoError(t, err)
			request = request.WithContext(security.StoreTokenData(request, &portainer.TokenData{ID: 4, Token: "vessel-token"}))
			response, err := transport.RoundTrip(request)
			require.NoError(t, err)
			defer response.Body.Close()
			require.Equal(t, tt.wantCode, response.StatusCode)
			controls, err := store.ResourceControl().ReadAll()
			require.NoError(t, err)
			if tt.createCode == 0 {
				require.Zero(t, writes.Load())
			} else {
				require.EqualValues(t, 1, writes.Load())
			}
			if tt.createCode == http.StatusCreated {
				require.Len(t, controls, 1)
				require.Equal(t, testGroup, controls[0].ResourceID)
				require.Equal(t, "/operation", response.Header.Get("Location"))
			} else {
				require.Empty(t, controls)
			}
		})
	}
}

func TestContainerGroupDeletePreservesAzureStatus(t *testing.T) {
	for _, status := range []int{http.StatusAccepted, http.StatusNoContent, http.StatusForbidden} {
		t.Run(http.StatusText(status), func(t *testing.T) {
			_, store, cleanup, err := datastore.NewTestStore(t, true, false)
			require.NoError(t, err)
			t.Cleanup(cleanup)
			require.NoError(t, store.ResourceControl().Create(&portainer.ResourceControl{ResourceID: testGroup, Type: portainer.ContainerGroupResourceControl}))
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
				w.Header().Set("Location", "/operation")
				w.WriteHeader(status)
			}))
			t.Cleanup(upstream.Close)
			transport := NewTransport(nil, store, nil)
			transport.token = &azureAPIToken{value: "azure-token", expirationTime: time.Now().Add(time.Hour)}
			request, err := http.NewRequestWithContext(t.Context(), http.MethodDelete, upstream.URL+testGroup, nil)
			require.NoError(t, err)
			request = request.WithContext(security.StoreTokenData(request, &portainer.TokenData{ID: 1, Role: portainer.AdministratorRole}))
			response, err := transport.RoundTrip(request)
			require.NoError(t, err)
			defer response.Body.Close()
			require.Equal(t, status, response.StatusCode)
			require.Equal(t, "/operation", response.Header.Get("Location"))
			controls, err := store.ResourceControl().ReadAll()
			require.NoError(t, err)
			if status == http.StatusNoContent {
				require.Empty(t, controls)
			} else {
				require.Len(t, controls, 1)
			}
		})
	}
}
