package secrets

import (
	"context"
	"fmt"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	sourceDS "github.com/portainer/portainer/api/dataservices/source"

	"github.com/rs/zerolog/log"
)

const vaultTokenRenewalCheckInterval = time.Hour

type vaultTokenSourceStore interface {
	Source() dataservices.SourceService
}

type VaultTokenRenewer struct {
	dataStore     vaultTokenSourceStore
	checkInterval time.Duration
	changed       chan struct{}
}

func NewVaultTokenRenewer(dataStore vaultTokenSourceStore) *VaultTokenRenewer {
	return &VaultTokenRenewer{
		dataStore:     dataStore,
		checkInterval: vaultTokenRenewalCheckInterval,
		changed:       make(chan struct{}, 1),
	}
}

func (renewer *VaultTokenRenewer) Start(ctx context.Context) {
	if renewer == nil || renewer.dataStore == nil {
		return
	}

	go renewer.run(ctx, renewer.runOnce)
}

// NotifySourceChanged wakes the worker after a committed source change. Notifications
// coalesce; the next pass reads the current datastore, never an uncommitted payload.
func (renewer *VaultTokenRenewer) NotifySourceChanged(_ portainer.SourceID) {
	select {
	case renewer.changed <- struct{}{}:
	default:
	}
}

func (renewer *VaultTokenRenewer) run(ctx context.Context, check func(context.Context) time.Duration) {
	for ctx.Err() == nil {
		delay := check(ctx)
		timer := time.NewTimer(delay)
		select {
		case <-ctx.Done():
			timer.Stop()
			return
		case <-renewer.changed:
			timer.Stop()
		case <-timer.C:
		}
	}
}

// Check again well before the observed lease expires, even when startup is just
// above the renewal threshold. Bound retries so transient failures cannot defer
// a short-period token for an hour.
func renewalCheckDelay(result VaultTokenRenewalResult) time.Duration {
	if result.Period <= 0 {
		return vaultTokenRenewalCheckInterval
	}
	seconds := min(result.TTL, result.Period)
	if seconds <= 0 {
		return time.Second
	}
	return max(100*time.Millisecond, time.Duration(min(seconds, int64(vaultTokenRenewalCheckInterval/time.Second)))*time.Second/4)
}

func (renewer *VaultTokenRenewer) runOnce(ctx context.Context) time.Duration {
	next := renewer.checkInterval
	sources, err := renewer.dataStore.Source().ReadAll(sourceDS.InsecureNewAdminContext(), func(src portainer.Source) bool {
		return src.Type == portainer.SourceTypeVault && src.Vault != nil
	})
	if err != nil {
		log.Warn().Err(fmt.Errorf("failed to read Vault sources: %w", err)).Msg("Vault token renewal check failed")
		return time.Second
	}

	for i := range sources {
		if ctx.Err() != nil {
			return time.Second
		}

		result, err := RenewVaultTokenIfNeeded(ctx, sources[i].Vault)
		if err != nil {
			log.Warn().Err(err).Int("source_id", int(sources[i].ID)).Msg("Vault token renewal check failed")
			next = min(next, time.Second)
			continue
		}

		next = min(next, renewalCheckDelay(result))
		if result.Renewed {
			log.Info().Int("source_id", int(sources[i].ID)).Int64("ttl_seconds", result.TTL).Msg("renewed periodic Vault token")
		}
	}
	return next
}
