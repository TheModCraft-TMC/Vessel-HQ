package factory

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestAgentSigningProxyIsLoopbackOnly(t *testing.T) {
	t.Parallel()
	boundAddress := make(chan net.Addr, 1)
	proxy := &ProxyServer{server: &http.Server{
		BaseContext: func(listener net.Listener) context.Context {
			boundAddress <- listener.Addr()
			return t.Context()
		},
		Handler: http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		}),
	}}
	require.NoError(t, proxy.start())
	defer proxy.Close()
	addr := (<-boundAddress).(*net.TCPAddr)
	require.True(t, addr.IP.IsLoopback(), "signing proxy must not listen on a wildcard/public interface: %s", addr)
	require.Equal(t, addr.Port, proxy.Port)

	resp, err := http.Get(fmt.Sprintf("http://127.0.0.1:%d", proxy.Port))
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusNoContent, resp.StatusCode)
}
