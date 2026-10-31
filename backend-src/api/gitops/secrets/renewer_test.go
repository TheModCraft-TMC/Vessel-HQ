package secrets

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"testing/synctest"
	"time"

	portainer "github.com/portainer/portainer/api"
	sourceDS "github.com/portainer/portainer/api/dataservices/source"
	dataStorePkg "github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestVaultTokenRenewerRunOnceRenewsStoredPeriodicTokens(t *testing.T) {
	t.Parallel()

	var renewals atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1/auth/token/lookup-self":
			assert.NoError(t, json.NewEncoder(w).Encode(map[string]any{
				"data": map[string]any{
					"ttl":       60,
					"period":    120,
					"renewable": true,
				},
			}))
		case "/v1/auth/token/renew-self":
			renewals.Add(1)
			assert.NoError(t, json.NewEncoder(w).Encode(map[string]any{
				"auth": map[string]any{
					"lease_duration": 120,
					"renewable":      true,
				},
			}))
		default:
			t.Fatalf("unexpected Vault request %s %s", r.Method, r.URL.String())
		}
	}))
	t.Cleanup(server.Close)

	_, store := dataStorePkg.MustNewTestStore(t, false, true)
	require.NoError(t, store.Source().Create(sourceDS.InsecureNewAdminContext(), &portainer.Source{
		Type: portainer.SourceTypeVault,
		Vault: &portainer.VaultConfig{
			Address: server.URL,
			Authentication: portainer.VaultAuthentication{
				Method: "token",
				Token:  "token-value",
			},
		},
	}))

	renewer := NewVaultTokenRenewer(store)
	renewer.runOnce(t.Context())

	require.EqualValues(t, 1, renewals.Load())
}

func TestVaultTokenRenewerSchedulesShortLeasesAndSourceChanges(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		renewer := NewVaultTokenRenewer(nil)
		ctx, cancel := context.WithCancel(t.Context())
		defer cancel()
		now := time.Now()
		expiry := now.Add(120 * time.Second)
		checks, renewals := 0, 0
		go renewer.run(ctx, func(context.Context) time.Duration {
			checks++
			ttl := int64(expiry.Sub(time.Now()) / time.Second)
			require.Positive(t, ttl, "periodic token expired before the next check")
			if ttl <= 60 {
				renewals++
				expiry = time.Now().Add(120 * time.Second)
				ttl = 120
			}
			return renewalCheckDelay(VaultTokenRenewalResult{TTL: ttl, Period: 120})
		})
		time.Sleep(5 * time.Minute)
		synctest.Wait()
		require.Greater(t, renewals, 2)
		before := checks
		renewer.NotifySourceChanged(1)
		synctest.Wait()
		require.Equal(t, before+1, checks)
		cancel()
		synctest.Wait()
		before = checks
		time.Sleep(time.Hour)
		require.Equal(t, before, checks)
	})
}

func TestVaultTokenRenewalDelayLeavesSafetyMargin(t *testing.T) {
	require.Less(t, renewalCheckDelay(VaultTokenRenewalResult{TTL: 61, Period: 120}), 61*time.Second)
	require.Less(t, renewalCheckDelay(VaultTokenRenewalResult{TTL: 1, Period: 1}), time.Second)
}

func TestVaultTokenRenewerRetriesTransientCheckFailures(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		renewer := NewVaultTokenRenewer(nil)
		ctx, cancel := context.WithCancel(t.Context())
		defer cancel()
		checks := 0
		go renewer.run(ctx, func(context.Context) time.Duration {
			checks++
			if checks <= 2 {
				return time.Second
			}
			return time.Hour
		})
		time.Sleep(2 * time.Second)
		synctest.Wait()
		require.Equal(t, 3, checks)
		cancel()
		synctest.Wait()
	})
}
