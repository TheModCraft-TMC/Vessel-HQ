package libstack

import (
	"context"
	"testing"

	"github.com/docker/cli/cli/command"
	"github.com/stretchr/testify/require"
)

func TestWithCli_InjectsHeaders(t *testing.T) {
	const headerName = "X-PortainerAgent-ManagerOperation"

	err := WithCli(
		t.Context(),
		DockerCliOptions{
			Host:    "tcp://127.0.0.1:1",
			Headers: map[string]string{headerName: "1"},
		},
		func(_ context.Context, cli *command.DockerCli) error {
			require.Equal(t, "1", cli.ConfigFile().HTTPHeaders[headerName])
			return nil
		},
	)
	require.NoError(t, err)
}

func TestWithCli_NoHeaders(t *testing.T) {
	err := WithCli(
		context.Background(),
		DockerCliOptions{Host: "tcp://127.0.0.1:1"},
		func(_ context.Context, cli *command.DockerCli) error {
			require.Empty(t, cli.ConfigFile().HTTPHeaders)
			return nil
		},
	)
	require.NoError(t, err)
}

func TestWithCli_PreservesCallerContext(t *testing.T) {
	type contextKey struct{}
	ctx, cancel := context.WithCancel(context.WithValue(t.Context(), contextKey{}, "deployment"))
	defer cancel()
	cancel()

	err := WithCli(ctx, DockerCliOptions{Host: "tcp://127.0.0.1:1"},
		func(cliCtx context.Context, _ *command.DockerCli) error {
			require.Same(t, ctx, cliCtx)
			require.Equal(t, "deployment", cliCtx.Value(contextKey{}))
			return cliCtx.Err()
		})
	require.ErrorIs(t, err, context.Canceled)
}
