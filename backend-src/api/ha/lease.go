// Package ha implements opt-in active/standby startup on shared storage.
// Storage must provide coherent POSIX locking, mmap and crash recovery across
// hosts. This gate is not replication, a quorum protocol or storage fencing.
package ha

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"time"

	"github.com/gofrs/flock"
)

// Acquire keeps a standby out of ALL datastore initialization, including
// encryption, backup and migration. Its lock file must never be deleted or
// replaced. The active process must retain this handle until process exit.
// Standbys acquire automatically when the storage releases the previous lock.
func Acquire(ctx context.Context, data, mode string) (*flock.Flock, error) {
	if mode == "" || mode == "disabled" {
		return nil, nil
	}
	if mode != "shared-storage" {
		return nil, errors.New("VESSEL_HA_MODE must be disabled or shared-storage")
	}
	if data == "" {
		return nil, errors.New("HA requires a persistent shared data directory")
	}
	if err := os.MkdirAll(data, 0700); err != nil {
		return nil, err
	}
	lock := flock.New(filepath.Join(data, ".vessel-ha.lock"), flock.SetPermissions(0600))
	locked, err := lock.TryLockContext(ctx, 250*time.Millisecond)
	if err != nil {
		_ = lock.Close()
		return nil, err
	}
	if !locked {
		_ = lock.Close()
		return nil, errors.New("HA storage lock unavailable")
	}
	return lock, nil
}
