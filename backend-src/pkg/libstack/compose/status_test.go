package compose

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/docker/cli/cli/command"
	"github.com/docker/compose/v5/pkg/api"
	"github.com/docker/compose/v5/pkg/compose"
	"github.com/moby/moby/api/types/container"
	"github.com/portainer/portainer/pkg/libstack"
)

type pollingContextKey struct{}

type pollingCompose struct {
	api.Compose
	ps func(context.Context, string, api.PsOptions) ([]api.ContainerSummary, error)
}

func (s *pollingCompose) Ps(ctx context.Context, name string, options api.PsOptions) ([]api.ContainerSummary, error) {
	return s.ps(ctx, name, options)
}

func pollingDeployer(ps func(context.Context, string, api.PsOptions) ([]api.ContainerSummary, error)) *ComposeDeployer {
	return &ComposeDeployer{createComposeServiceFn: func(command.Cli, ...compose.Option) (api.Compose, error) {
		return &pollingCompose{ps: ps}, nil
	}}
}

func TestWaitForStatusCancelsInFlightPs(t *testing.T) {
	useCLIProtocolEngine(t, "1.39")
	ctx, cancel := context.WithCancel(context.WithValue(t.Context(), pollingContextKey{}, "poll metadata"))
	defer cancel()
	started := make(chan context.Context, 1)
	release := make(chan struct{})
	defer close(release) // Also release the old broken implementation on failure.
	deployer := pollingDeployer(func(ctx context.Context, name string, options api.PsOptions) ([]api.ContainerSummary, error) {
		if name != "polling-project" || !options.All {
			t.Error("polling must retain project name and include stopped containers")
		}
		started <- ctx
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-release:
			return nil, context.Canceled
		}
	})
	done := make(chan libstack.WaitResult, 1)
	go func() { done <- deployer.WaitForStatus(ctx, "polling-project", libstack.StatusRunning) }()
	var psCtx context.Context
	select {
	case psCtx = <-started:
	case <-time.After(5 * time.Second):
		t.Fatal("Compose.Ps never started")
	}
	cancel()
	select {
	case result := <-done:
		if !strings.Contains(result.ErrorMsg, context.Canceled.Error()) {
			t.Fatalf("expected caller cancellation, got %+v", result)
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("caller cancellation did not interrupt in-flight Compose.Ps")
	}
	if psCtx.Value(pollingContextKey{}) != "poll metadata" {
		t.Error("Compose.Ps lost caller metadata")
	}
	if deadline, ok := psCtx.Deadline(); !ok || time.Until(deadline) > time.Minute {
		t.Error("Compose.Ps must retain its one-minute upper bound")
	}
}

func TestWaitForStatusRetainsCallerDeadline(t *testing.T) {
	useCLIProtocolEngine(t, "1.39")
	ctx, cancel := context.WithTimeout(t.Context(), 2*time.Second)
	defer cancel()
	started := make(chan context.Context, 1)
	release := make(chan struct{})
	defer close(release)
	deployer := pollingDeployer(func(ctx context.Context, _ string, _ api.PsOptions) ([]api.ContainerSummary, error) {
		started <- ctx
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-release:
			return nil, context.DeadlineExceeded
		}
	})
	done := make(chan libstack.WaitResult, 1)
	go func() { done <- deployer.WaitForStatus(ctx, "deadline-project", libstack.StatusRunning) }()
	select {
	case psCtx := <-started:
		want, _ := ctx.Deadline()
		if deadline, ok := psCtx.Deadline(); !ok || !deadline.Equal(want) {
			t.Error("Compose.Ps did not inherit the earlier caller deadline")
		}
	case <-time.After(5 * time.Second):
		t.Fatal("Compose.Ps never started")
	}
	<-ctx.Done()
	select {
	case result := <-done:
		if !strings.Contains(result.ErrorMsg, context.DeadlineExceeded.Error()) {
			t.Fatalf("expected caller deadline, got %+v", result)
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("caller deadline did not interrupt in-flight Compose.Ps")
	}
}

func TestWaitForStatusCancelsDuringPollingDelay(t *testing.T) {
	useCLIProtocolEngine(t, "1.39")
	ctx, cancel := context.WithCancel(t.Context())
	deployer := pollingDeployer(func(context.Context, string, api.PsOptions) ([]api.ContainerSummary, error) {
		t.Error("Compose.Ps must not start after cancellation during the polling delay")
		return nil, nil
	})
	done := make(chan libstack.WaitResult, 1)
	go func() { done <- deployer.WaitForStatus(ctx, "delay-project", libstack.StatusRunning) }()
	// Let WaitForStatus enter its one-second polling delay before cancellation.
	time.Sleep(50 * time.Millisecond)
	cancel()
	select {
	case result := <-done:
		if !strings.Contains(result.ErrorMsg, context.Canceled.Error()) {
			t.Fatalf("expected caller cancellation, got %+v", result)
		}
	case <-time.After(500 * time.Millisecond):
		t.Error("caller cancellation did not interrupt polling delay")
		// Ensure the goroutine finishes before the test (and any t.Error call).
		select {
		case <-done:
		case <-time.After(5 * time.Second):
			t.Fatal("polling did not finish after cancellation")
		}
	}
}

func TestWaitForStatusPreservesSuccessfulStatus(t *testing.T) {
	useCLIProtocolEngine(t, "1.39")
	for _, status := range []libstack.Status{libstack.StatusRemoved, libstack.StatusCompleted, libstack.StatusRunning} {
		t.Run(string(status), func(t *testing.T) {
			ctx, cancel := context.WithTimeout(t.Context(), 5*time.Second)
			defer cancel()
			deployer := pollingDeployer(func(context.Context, string, api.PsOptions) ([]api.ContainerSummary, error) {
				if status == libstack.StatusRemoved {
					return nil, nil
				}
				state := "running"
				if status == libstack.StatusCompleted {
					state = "exited"
				}
				return []api.ContainerSummary{{State: container.ContainerState(state), ExitCode: 0}}, nil
			})
			required := status
			if status == libstack.StatusCompleted {
				required = libstack.StatusRunning // One-off services may complete.
			}
			result := deployer.WaitForStatus(ctx, "successful-project", required)
			if result.ErrorMsg != "" || result.Status != status {
				t.Fatalf("expected successful %s, got %+v", status, result)
			}
		})
	}
}
