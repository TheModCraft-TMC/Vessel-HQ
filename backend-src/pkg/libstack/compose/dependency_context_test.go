package compose

import (
	"context"
	"errors"
	"testing"

	"github.com/compose-spec/compose-go/v2/types"
	"github.com/docker/cli/cli/command"
	"github.com/docker/compose/v5/pkg/api"
	"github.com/docker/compose/v5/pkg/compose"
	"github.com/portainer/portainer/pkg/libstack"
	"github.com/stretchr/testify/require"
)

type dependencyContextKey struct{}

type contextCheckingCompose struct {
	api.Compose
	t     *testing.T
	calls int
}

func (s *contextCheckingCompose) check(ctx context.Context) {
	s.t.Helper()
	s.calls++
	require.NoError(s.t, ctx.Err(), "detached stack operations must survive request cancellation")
	require.Nil(s.t, ctx.Done())
	require.Equal(s.t, "request metadata", ctx.Value(dependencyContextKey{}))
}

func (s *contextCheckingCompose) Build(ctx context.Context, _ *types.Project, _ api.BuildOptions) error {
	s.check(ctx)
	return nil
}

func (s *contextCheckingCompose) Up(ctx context.Context, _ *types.Project, _ api.UpOptions) error {
	s.check(ctx)
	return nil
}

func (s *contextCheckingCompose) Down(ctx context.Context, _ string, _ api.DownOptions) error {
	s.check(ctx)
	return nil
}

func TestComposeOperationsRetainDetachedContext(t *testing.T) {
	ctx, cancel := context.WithCancel(context.WithValue(t.Context(), dependencyContextKey{}, "request metadata"))
	cancel()
	service := &contextCheckingCompose{t: t}
	d := &ComposeDeployer{createComposeServiceFn: func(command.Cli, ...compose.Option) (api.Compose, error) {
		return service, nil
	}}
	file := createFile(t, t.TempDir(), "compose.yaml", "services:\n  app:\n    image: alpine:3.20\n")
	require.NoError(t, d.Deploy(ctx, []string{file}, libstack.DeployOptions{Options: libstack.Options{ProjectName: "vessel-dep-go-context"}}))
	require.NoError(t, d.Remove(ctx, "vessel-dep-go-context", nil, libstack.RemoveOptions{}))
	require.Equal(t, 3, service.calls)
}

func TestComposeServiceInitializationError(t *testing.T) {
	want := errors.New("invalid compose service configuration")
	d := &ComposeDeployer{createComposeServiceFn: func(command.Cli, ...compose.Option) (api.Compose, error) { return nil, want }}
	err := d.Remove(t.Context(), "vessel-dep-go-error", nil, libstack.RemoveOptions{})
	require.ErrorIs(t, err, want)
	err = d.withComposeService(t.Context(), nil, libstack.Options{}, func(context.Context, api.Compose, *types.Project) error {
		t.Fatal("must not call an uninitialized compose service")
		return nil
	})
	require.ErrorIs(t, err, want)
}
