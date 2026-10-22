package http

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestShutdownAllowsInflightRequestsToFinish(t *testing.T) {
	t.Parallel()
	started, release := make(chan struct{}), make(chan struct{})
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		close(started)
		<-release
		_, _ = io.WriteString(w, "finished")
	}))
	defer srv.Close()
	defer func() {
		select {
		case <-release:
		default:
			close(release)
		}
	}()
	response := make(chan error, 1)
	go func() {
		resp, err := srv.Client().Get(srv.URL)
		if err == nil {
			_, err = io.Copy(io.Discard, resp.Body)
			_ = resp.Body.Close()
		}
		response <- err
	}()
	<-started

	shutdownStarted := make(chan struct{})
	srv.Config.RegisterOnShutdown(func() { close(shutdownStarted) })
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	cancel()
	stopped := make(chan struct{})
	go func() {
		shutdown(ctx, srv.Config)
		close(stopped)
	}()
	<-shutdownStarted
	select {
	case <-stopped:
		t.Fatal("shutdown returned before in-flight request finished")
	case <-time.After(50 * time.Millisecond):
	}
	close(release)
	require.NoError(t, <-response)
	select {
	case <-stopped:
	case <-time.After(5 * time.Second):
		t.Fatal("shutdown did not finish after the request completed")
	}
}
