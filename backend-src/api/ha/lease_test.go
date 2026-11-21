package ha

import (
	"context"
	"os"
	"os/exec"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestDisabledAndInvalidModes(t *testing.T) {
	lock, err := Acquire(t.Context(), "", "disabled")
	require.NoError(t, err)
	require.Nil(t, lock)
	_, err = Acquire(t.Context(), t.TempDir(), "unexpected")
	require.Error(t, err)
}

func TestStandbyWaitsAndTakesOver(t *testing.T) {
	dir := t.TempDir()
	active, err := Acquire(t.Context(), dir, "shared-storage")
	require.NoError(t, err)
	t.Cleanup(func() { _ = active.Close() })
	ctx, cancel := context.WithTimeout(t.Context(), 60*time.Millisecond)
	defer cancel()
	_, err = Acquire(ctx, dir, "shared-storage")
	require.ErrorIs(t, err, context.DeadlineExceeded)
	require.NoError(t, active.Close())
	standby, err := Acquire(t.Context(), dir, "shared-storage")
	require.NoError(t, err)
	require.NoError(t, standby.Close())
}

func TestLockReleasedAfterProcessExit(t *testing.T) {
	if dir := os.Getenv("VESSEL_HA_TEST_CHILD_DATA"); dir != "" {
		lock, err := Acquire(context.Background(), dir, "shared-storage")
		if err != nil {
			os.Exit(2)
		}
		// Deliberately exit without unlocking: the real process-lifetime path.
		if lock == nil {
			os.Exit(3)
		}
		os.Exit(0)
	}
	dir := t.TempDir()
	command := exec.Command(os.Args[0], "-test.run=^TestLockReleasedAfterProcessExit$")
	command.Env = append(os.Environ(), "VESSEL_HA_TEST_CHILD_DATA="+dir)
	require.NoError(t, command.Run())
	ctx, cancel := context.WithTimeout(t.Context(), time.Second)
	defer cancel()
	lock, err := Acquire(ctx, dir, "shared-storage")
	require.NoError(t, err)
	require.NoError(t, lock.Close())
}
