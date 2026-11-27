package nativeextensions

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"github.com/gorilla/mux"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	domain "github.com/portainer/portainer/api/nativeextensions"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"net/http"
	"strconv"
	"time"
)

type automationContextKey struct{}
type automationBinding struct{ Version int }

func (h *Handler) configureImageAutomation(w http.ResponseWriter, r *http.Request, p invokePayload, record domain.Record) *httperror.HandlerError {
	if p.Automation == nil {
		return httperror.BadRequest("Image update policy required", nil)
	}
	user, _ := security.RetrieveRestrictedRequestContext(r)
	config := domain.ImageAutomation{Version: p.Automation.Version + 1, Enabled: p.Automation.Enabled, Mode: p.Automation.Mode, IntervalMinutes: p.Automation.IntervalMinutes, EnvironmentID: p.EnvironmentID, StackID: p.StackID, ConfiguredBy: int(user.UserID)}
	if !config.Valid() {
		return httperror.BadRequest("Use monitor-only or automatic mode and an interval of 5–1440 minutes", nil)
	}
	err := h.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		current, err := tx.NativeExtension().Read(record.ID)
		if err != nil {
			return err
		}
		if current.Revision != record.Revision || current.Manifest.PackageDigest != record.Manifest.PackageDigest || domain.Authorize(*current, "ui.native", 0) != nil || domain.AuthorizeStackCapability(*current, "stacks.images.configure", p.EnvironmentID, p.StackID) != nil {
			return httperror.Conflict("Extension approval changed", nil)
		}
		version := 0
		if current.ImageAutomation != nil {
			version = current.ImageAutomation.Version
		}
		if version != p.Automation.Version {
			return httperror.Conflict("Image update policy changed; refresh before saving", nil)
		}
		if config.Enabled {
			for _, capability := range []string{"stacks.images.read", "stacks.images.auto-update"} {
				if domain.AuthorizeStackCapability(*current, capability, p.EnvironmentID, p.StackID) != nil {
					return httperror.Forbidden("Explicit background image-check grant required", nil)
				}
			}
			if config.Mode == "automatic" && domain.AuthorizeStackCapability(*current, "stacks.images.update", p.EnvironmentID, p.StackID) != nil {
				return httperror.Forbidden("Explicit image update grant required", nil)
			}
		}
		current.ImageAutomation = &config
		if err := tx.NativeExtension().Update(current.ID, current); err != nil {
			return err
		}
		return audit(tx, r, "extension.images.policy", *current)
	})
	return response.TxResponse(w, config, err)
}

// StartImageAutomation runs only explicitly enabled, currently approved host jobs.
// The server context owns shutdown. No extension binaries or credentials are used.
func (h *Handler) StartImageAutomation(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case now := <-ticker.C:
				h.runImageAutomation(ctx, now)
			}
		}
	}()
}
func (h *Handler) runImageAutomation(ctx context.Context, now time.Time) {
	records, err := h.DataStore.NativeExtension().ReadAll()
	if err != nil {
		return
	}
	for _, record := range records {
		if ctx.Err() != nil {
			return
		}
		policy := record.ImageAutomation
		if policy == nil || !policy.Enabled || !policy.Valid() || now.Unix()-policy.LastCheck < int64(policy.IntervalMinutes*60) {
			continue
		}
		if domain.Authorize(record, "ui.native", 0) != nil || domain.AuthorizeStackCapability(record, "stacks.images.auto-update", policy.EnvironmentID, policy.StackID) != nil || domain.AuthorizeStackCapability(record, "stacks.images.read", policy.EnvironmentID, policy.StackID) != nil {
			continue
		}
		user, err := h.DataStore.User().Read(portainer.UserID(policy.ConfiguredBy))
		if err != nil || user.Role != portainer.AdministratorRole {
			continue
		}
		if h.AuthorizeUser == nil || h.AuthorizeUser(ctx, int(user.ID), policy.EnvironmentID, policy.StackID) != nil || h.DeliveryRead == nil {
			continue
		}
		auditBytes, _ := json.Marshal(map[string]any{"extensionId": record.Manifest.ID, "revision": record.Revision, "environmentId": policy.EnvironmentID, "stackId": policy.StackID, "policyVersion": policy.Version, "mode": policy.Mode})
		if err := h.DataStore.ActivityLog().Create(&portainer.ActivityLog{Timestamp: now.Unix(), Username: user.Username, Action: "extension.images.scheduled-check", Context: "native-extensions", Payload: base64.StdEncoding.EncodeToString(auditBytes)}); err != nil {
			continue
		}
		runCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
		snapshot, err := h.DeliveryRead(runCtx, policy.EnvironmentID, policy.StackID, true)
		outcome := "checked"
		if err != nil {
			outcome = "check-failed"
		} else {
			outdated := false
			blocked := len(snapshot.Images) == 0
			for _, image := range snapshot.Images {
				if image.Status == "outdated" {
					outdated = true
				}
				if image.Policy != "manual" || (image.Status != "updated" && image.Status != "outdated") {
					blocked = true
				}
			}
			if outdated {
				outcome = "update-available"
			}
			if outdated && policy.Mode == "automatic" {
				if blocked {
					outcome = "blocked-by-policy"
				} else {
					request, _ := http.NewRequestWithContext(context.WithValue(runCtx, automationContextKey{}, automationBinding{Version: policy.Version}), http.MethodPost, "http://localhost/native-extensions/"+strconv.Itoa(record.ID)+"/invoke", nil)
					// Existing deployment authorization consumes TokenData. This is an
					// in-process identity reconstructed from the freshly checked policy owner;
					// no JWT/API credential is created or exposed to extension code.
					request = request.WithContext(security.StoreTokenData(request, &portainer.TokenData{ID: user.ID, Role: user.Role}))
					request = request.WithContext(security.StoreRestrictedRequestContext(request, &security.RestrictedRequestContext{IsAdmin: true, UserID: user.ID, User: user}))
					request = mux.SetURLVars(request, map[string]string{"id": strconv.Itoa(record.ID)})
					sink := &discardDeploymentResponse{header: http.Header{}}
					err := h.invokeDelivery(sink, request, invokePayload{Revision: record.Revision, PackageDigest: record.Manifest.PackageDigest, Operation: "stacks.images.update", EnvironmentID: policy.EnvironmentID, StackID: policy.StackID, Version: snapshot.Version})
					outcome = "deployment-accepted"
					if err != nil {
						outcome = "deployment-not-confirmed"
					}
				}
			}
		}
		cancel()
		_ = h.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			current, err := tx.NativeExtension().Read(record.ID)
			if err != nil {
				return err
			}
			if current.Revision != record.Revision || current.ImageAutomation == nil || current.ImageAutomation.Version != policy.Version {
				return nil
			}
			current.ImageAutomation.LastCheck = now.Unix()
			current.ImageAutomation.LastOutcome = outcome
			return tx.NativeExtension().Update(current.ID, current)
		})
	}
}
