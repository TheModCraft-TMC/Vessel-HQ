package libstack

import (
	"context"
	"testing"

	"github.com/docker/cli/cli/command"
	"github.com/moby/moby/client"
	"github.com/stretchr/testify/require"
)

func TestWithCli_InjectsHeaders(t *testing.T) {
	isolateCLIConfig(t)
	const headerName = "X-PortainerAgent-ManagerOperation"

	err := WithCli(
		t.Context(),
		DockerCliOptions{
			Host:    cliEngine(t, "1.39"),
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
	isolateCLIConfig(t)
	err := WithCli(
		context.Background(),
		DockerCliOptions{Host: cliEngine(t, "1.39")},
		func(_ context.Context, cli *command.DockerCli) error {
			require.Empty(t, cli.ConfigFile().HTTPHeaders)
			return nil
		},
	)
	require.NoError(t, err)
}

func TestWithCliContextRetainsCallerCancellation(t *testing.T) {
	isolateCLIConfig(t)
	ctx, cancel := context.WithCancel(t.Context())
	cancel()
	err := WithCliContext(ctx, DockerCliOptions{Host: cliEngine(t, "1.39")}, func(context.Context, *command.DockerCli) error {
		t.Fatal("cancelled negotiation must not publish a client")
		return nil
	})
	require.ErrorIs(t, err, context.Canceled)
}

func TestWithCli_PreservesCallerValuesButNotCancellation(t *testing.T) {
	isolateCLIConfig(t)
	type contextKey struct{}
	ctx, cancel := context.WithCancel(context.WithValue(t.Context(), contextKey{}, "deployment"))
	defer cancel()
	cancel()

	err := WithCli(ctx, DockerCliOptions{Host: cliEngine(t, "1.39")},
		func(cliCtx context.Context, cli *command.DockerCli) error {
			require.Equal(t, "deployment", cliCtx.Value(contextKey{}))
			// Client disconnects must not abort in-flight compose operations.
			require.Nil(t, cliCtx.Done())
			_, hasDeadline := cliCtx.Deadline()
			require.False(t, hasDeadline)
			_, err := cli.Client().Info(cliCtx, client.InfoOptions{})
			return err
		})
	require.NoError(t, err)
}
