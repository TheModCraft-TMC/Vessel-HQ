package file_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/portainer/api/http/handler/file"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNormalServe(t *testing.T) {
	handler := file.NewHandler("", false, func() bool { return false })
	require.NotNil(t, handler)

	request := func(path string) (*http.Request, *httptest.ResponseRecorder) {
		rr := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, path, nil)
		handler.ServeHTTP(rr, req)
		return req, rr
	}

	_, rr := request("/timeout.html")
	require.Equal(t, http.StatusTemporaryRedirect, rr.Result().StatusCode)
	loc, err := rr.Result().Location()
	require.NoError(t, err)
	require.NotNil(t, loc)
	require.Equal(t, "/", loc.Path)

	_, rr = request("/")
	require.Equal(t, http.StatusOK, rr.Result().StatusCode)
}

func TestPermissionsPolicyHeader(t *testing.T) {
	handler := file.NewHandler("", false, func() bool { return false })
	require.NotNil(t, handler)

	test := func(path string, exist bool) {
		rr := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, path, nil)
		handler.ServeHTTP(rr, req)

		require.Equal(t, exist, rr.Result().Header.Get("Permissions-Policy") != "")
	}

	test("/", true)
	test("/index.html", true)
	test("/api", false)
	test("/an/image.png", false)
}

func TestRedirectInstanceDisabled(t *testing.T) {
	handler := file.NewHandler("", false, func() bool { return true })
	require.NotNil(t, handler)

	test := func(path string) {
		rr := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, path, nil)
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusTemporaryRedirect, rr.Result().StatusCode)
		loc, err := rr.Result().Location()
		require.NoError(t, err)
		require.NotNil(t, loc)
		require.Equal(t, "/timeout.html", loc.Path)
	}

	test("/")
	test("/index.html")
}

func TestProxyFrontend(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/environments/1", r.URL.Path)
		assert.Equal(t, "portainer.example", r.Header.Get("X-Forwarded-Host"))
		assert.Equal(t, "https", r.Header.Get("X-Forwarded-Proto"))
		w.Header().Set("Content-Security-Policy", "script-src 'nonce-next-response'")
		_, _ = w.Write([]byte("next response"))
	}))
	t.Cleanup(upstream.Close)
	t.Setenv("PORTAINER_FRONTEND_ORIGIN", upstream.URL)

	handler := file.NewHandler("", true, func() bool { return false })
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "https://portainer.example/environments/1", nil)
	request.Host = "portainer.example"
	handler.ServeHTTP(recorder, request)

	response := recorder.Result()
	require.Equal(t, http.StatusOK, response.StatusCode)
	require.Empty(t, response.Header.Get("Cache-Control"))
	require.Equal(t, "script-src 'nonce-next-response'", response.Header.Get("Content-Security-Policy"))
	body, err := io.ReadAll(response.Body)
	require.NoError(t, err)
	require.Equal(t, "next response", string(body))
}
