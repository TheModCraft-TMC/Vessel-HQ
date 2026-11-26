package webhookgateway

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/portainer/portainer/api/datastore"
	"github.com/stretchr/testify/require"
)

func testConfig() Config {
	return Config{Routes: []Route{{ID: "release", Secret: strings.Repeat("test-only", 8), Targets: []Target{{Kind: "stack", Token: "00000000-0000-4000-8000-000000000001"}, {Kind: "service", Token: "00000000-0000-4000-8000-000000000002"}}}}}
}
func signed(body, delivery string, now int64) *http.Request {
	r := httptest.NewRequest(http.MethodPost, "/api/webhook-gateway/release", strings.NewReader(body))
	ts := strconv.FormatInt(now, 10)
	mac := hmac.New(sha256.New, []byte(testConfig().Routes[0].Secret))
	mac.Write([]byte("release\n" + ts + "\n" + delivery + "\n" + body))
	r.Header.Set("X-Vessel-Timestamp", ts)
	r.Header.Set("X-Vessel-Delivery", delivery)
	r.Header.Set("X-Vessel-Signature", "sha256="+hex.EncodeToString(mac.Sum(nil)))
	return r
}
func TestPersistentReplayProtectionAndPartialDelivery(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	reserve, complete := PersistentAudit(store)
	var calls atomic.Int32
	dispatch := func(context.Context, Target) int {
		if calls.Add(1)%2 == 0 {
			return 500
		}
		return 202
	}
	g, err := New(testConfig(), dispatch, reserve, complete)
	require.NoError(t, err)
	w := httptest.NewRecorder()
	g.ServeHTTP(w, signed("private-external-body", "delivery-00000001", time.Now().Unix()))
	require.Equal(t, http.StatusBadGateway, w.Code)
	require.JSONEq(t, `{"succeeded":1,"failed":1}`, w.Body.String())
	// New handler instance simulates a restart or HA takeover, using the same DB.
	g, err = New(testConfig(), dispatch, reserve, complete)
	require.NoError(t, err)
	w = httptest.NewRecorder()
	g.ServeHTTP(w, signed("private-external-body", "delivery-00000001", time.Now().Unix()))
	require.Equal(t, http.StatusConflict, w.Code)
	require.Equal(t, int32(2), calls.Load())
	logs, err := store.ActivityLog().ReadAll()
	require.NoError(t, err)
	require.Len(t, logs, 2)
	for _, entry := range logs {
		payload, err := base64.StdEncoding.DecodeString(entry.Payload)
		require.NoError(t, err)
		require.NotContains(t, string(payload), "private-external-body")
		require.NotContains(t, string(payload), testConfig().Routes[0].Secret)
	}
}
func TestConcurrentDeliveryReservesExactlyOnce(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	reserve, complete := PersistentAudit(store)
	var calls atomic.Int32
	g, err := New(testConfig(), func(context.Context, Target) int { calls.Add(1); return 202 }, reserve, complete)
	require.NoError(t, err)
	results := make(chan int, 2)
	var wg sync.WaitGroup
	for range 2 {
		wg.Go(func() {
			w := httptest.NewRecorder()
			g.ServeHTTP(w, signed("{}", "delivery-00000002", time.Now().Unix()))
			results <- w.Code
		})
	}
	wg.Wait()
	close(results)
	counts := map[int]int{}
	for code := range results {
		counts[code]++
	}
	require.Equal(t, map[int]int{202: 1, 409: 1}, counts)
	require.Equal(t, int32(2), calls.Load())
}
func TestRejectsUnauthenticatedAndOversizedRequests(t *testing.T) {
	g, err := New(testConfig(), func(context.Context, Target) int { t.Fatal("unexpected dispatch"); return 500 }, func(context.Context, string, string, string) error { t.Fatal("unexpected reservation"); return nil }, func(context.Context, string, string, int, int) error { return nil })
	require.NoError(t, err)
	for _, tc := range []struct {
		name    string
		request func() *http.Request
		code    int
	}{
		{"stale", func() *http.Request { return signed("{}", "delivery-00000003", time.Now().Unix()-301) }, 401},
		{"future", func() *http.Request { return signed("{}", "delivery-00000003", time.Now().Unix()+301) }, 401},
		{"signature", func() *http.Request {
			r := signed("{}", "delivery-00000003", time.Now().Unix())
			r.Header.Set("X-Vessel-Signature", "sha256=bad")
			return r
		}, 401},
		{"short id", func() *http.Request { return signed("{}", "short", time.Now().Unix()) }, 401},
		{"body", func() *http.Request {
			return signed(strings.Repeat("a", 65537), "delivery-00000003", time.Now().Unix())
		}, 413},
		{"query", func() *http.Request {
			r := signed("{}", "delivery-00000003", time.Now().Unix())
			r.URL.RawQuery = "tag=other"
			return r
		}, 404},
	} {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			g.ServeHTTP(w, tc.request())
			require.Equal(t, tc.code, w.Code)
		})
	}
}
func TestAuditFailurePreventsDispatch(t *testing.T) {
	g, err := New(testConfig(), func(context.Context, Target) int { t.Fatal("unexpected dispatch"); return 500 }, func(context.Context, string, string, string) error { return errors.New("audit unavailable") }, func(context.Context, string, string, int, int) error { return nil })
	require.NoError(t, err)
	w := httptest.NewRecorder()
	g.ServeHTTP(w, signed("{}", "delivery-00000004", time.Now().Unix()))
	require.Equal(t, 503, w.Code)
}
func TestLocalDispatchDoesNotForwardExternalInputs(t *testing.T) {
	dispatch := LocalDispatch(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/stacks/webhooks/test", r.URL.Path)
		require.Empty(t, r.Header)
		require.Empty(t, r.URL.RawQuery)
		w.WriteHeader(202)
	}), nil)
	require.Equal(t, 202, dispatch(t.Context(), Target{Kind: "stack", Token: "test"}))
	require.Equal(t, 400, dispatch(t.Context(), Target{Kind: "url", Token: "https://example.com"}))
}

func TestSignatureIsBoundToRouteEvenWithReusedSecret(t *testing.T) {
	config := testConfig()
	second := config.Routes[0]
	second.ID = "other-route"
	config.Routes = append(config.Routes, second)
	g, err := New(config, func(context.Context, Target) int { t.Error("unexpected dispatch"); return 500 }, func(context.Context, string, string, string) error { t.Error("unexpected reservation"); return nil }, func(context.Context, string, string, int, int) error { return nil })
	require.NoError(t, err)
	request := signed("{}", "delivery-route-bound", time.Now().Unix())
	request.URL.Path = "/api/webhook-gateway/other-route"
	response := httptest.NewRecorder()
	g.ServeHTTP(response, request)
	require.Equal(t, http.StatusUnauthorized, response.Code)
}

func TestBusyGatewayDoesNotReserveDelivery(t *testing.T) {
	entered, release := make(chan struct{}, 1), make(chan struct{})
	var reservations atomic.Int32
	g, err := New(testConfig(), func(context.Context, Target) int {
		select {
		case entered <- struct{}{}:
		default:
		}
		<-release
		return 202
	}, func(context.Context, string, string, string) error { reservations.Add(1); return nil }, func(context.Context, string, string, int, int) error { return nil })
	require.NoError(t, err)
	g.inflight = make(chan struct{}, 1)
	firstDone := make(chan struct{})
	go func() {
		defer close(firstDone)
		g.ServeHTTP(httptest.NewRecorder(), signed("{}", "delivery-busy-first", time.Now().Unix()))
	}()
	select {
	case <-entered:
	case <-time.After(time.Second):
		t.Fatal("first delivery did not start")
	}
	response := httptest.NewRecorder()
	g.ServeHTTP(response, signed("{}", "delivery-busy-second", time.Now().Unix()))
	require.Equal(t, http.StatusTooManyRequests, response.Code)
	require.Equal(t, int32(1), reservations.Load())
	close(release)
	select {
	case <-firstDone:
	case <-time.After(time.Second):
		t.Fatal("delivery did not finish")
	}
}
