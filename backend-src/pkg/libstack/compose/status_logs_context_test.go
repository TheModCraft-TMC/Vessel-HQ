package compose

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestContainerLogTailCancelsInitialNegotiation(t *testing.T) {
	useCLIProtocolEngine(t, "1.39")
	started := make(chan struct{}, 1)
	release := make(chan struct{})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		select {
		case started <- struct{}{}:
		default:
		}
		select {
		case <-r.Context().Done():
		case <-release:
			w.Header().Set("API-Version", "1.39")
		}
	}))
	defer server.Close()
	t.Setenv("DOCKER_HOST", "tcp"+strings.TrimPrefix(server.URL, "http"))
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	done := make(chan error, 1)
	go func() {
		_, err := getContainerLogsTail(ctx, service{Name: "exited-service"})
		done <- err
	}()
	select {
	case <-started:
	case <-time.After(5 * time.Second):
		close(release)
		<-done
		t.Fatal("log-tail negotiation never started")
	}
	cancel()
	select {
	case err := <-done:
		close(release)
		if !errors.Is(err, context.Canceled) {
			t.Fatalf("expected caller cancellation, got %v", err)
		}
	case <-time.After(500 * time.Millisecond):
		close(release)
		<-done
		t.Fatal("read-only status log tail detached initial negotiation from its caller")
	}
}
