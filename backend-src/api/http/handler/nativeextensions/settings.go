package nativeextensions

import (
	"errors"
	"math"
	"net/http"
	"slices"
	"strconv"
	"time"

	"github.com/portainer/portainer/api/dataservices"
	domain "github.com/portainer/portainer/api/nativeextensions"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	librequest "github.com/portainer/portainer/pkg/libhttp/request"
	libresponse "github.com/portainer/portainer/pkg/libhttp/response"
)

type settingsRequest struct {
	Revision      int               `json:"revision"`
	PackageDigest string            `json:"packageDigest"`
	Version       int               `json:"version"`
	Values        map[string]string `json:"values"`
	// Omitted secrets are retained; null removes a secret. Values replace the
	// public map. A secret key cannot be moved into the public map in one update.
	Secrets map[string]*string `json:"secrets"`
}
type settingsResponse struct {
	Version    int               `json:"version"`
	Values     map[string]string `json:"values"`
	SecretKeys []string          `json:"secretKeys"`
}

func (h *Handler) settings(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	w.Header().Set("Cache-Control", "no-store")
	id, err := librequest.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil || id <= 0 {
		return httperror.BadRequest("Invalid extension ID", errors.New("positive numeric ID required"))
	}
	var input settingsRequest
	if r.Method == http.MethodGet {
		input.Revision, err = strconv.Atoi(r.URL.Query().Get("revision"))
		input.PackageDigest = r.URL.Query().Get("packageDigest")
		if err != nil {
			return httperror.BadRequest("Revision required", errors.New("invalid revision"))
		}
	} else {
		if err := decode(w, r, &input); err != nil {
			// Decoder errors can contain caller-controlled data. Do not log it.
			return httperror.BadRequest("Invalid settings request", errors.New("invalid settings JSON"))
		}
		if input.Version < 0 {
			return httperror.BadRequest("Invalid settings version", errors.New("nonnegative version required"))
		}
		if r.Method == http.MethodDelete && (input.Values != nil || input.Secrets != nil) {
			return httperror.BadRequest("Reset accepts only identity and version", errors.New("unexpected settings values"))
		}
	}
	result := settingsResponse{Values: map[string]string{}, SecretKeys: []string{}}
	err = h.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		record, err := tx.NativeExtension().Read(id)
		if tx.IsErrObjectNotFound(err) {
			return httperror.NotFound("Extension unavailable", err)
		}
		if err != nil {
			return err
		}
		if input.Revision != record.Revision || input.PackageDigest != record.Manifest.PackageDigest {
			return httperror.Conflict("Extension changed; reload before continuing", errors.New("stale extension identity"))
		}
		current := record.Settings
		if current == nil {
			current = &domain.Settings{}
		}
		action := "extension.settings.read"
		if r.Method != http.MethodGet {
			if input.Version != current.Version {
				return httperror.Conflict("Settings changed; reload before saving", errors.New("stale settings version"))
			}
			if current.Version == math.MaxInt {
				return httperror.Conflict("Settings version exhausted", errors.New("settings version exhausted"))
			}
			next := &domain.Settings{Version: current.Version + 1, Values: map[string]string{}, Secrets: map[string]string{}}
			if r.Method == http.MethodPut {
				for key, value := range input.Values {
					if _, secret := current.Secrets[key]; secret {
						return httperror.BadRequest("Remove a secret before using its key publicly", errors.New("secret key cannot become public"))
					}
					next.Values[key] = value
				}
				for key, value := range current.Secrets {
					next.Secrets[key] = value
				}
				for key, value := range input.Secrets {
					if value == nil {
						delete(next.Secrets, key)
					} else {
						next.Secrets[key] = *value
					}
				}
				if err := domain.ValidateSettingsFor(record.Manifest, next.Values, next.Secrets); err != nil {
					return httperror.BadRequest("Invalid settings", err)
				}
				action = "extension.settings.update"
			} else {
				action = "extension.settings.reset"
			}
			record.Settings = next
			record.UpdatedAt = time.Now().Unix()
			if err := tx.NativeExtension().Update(id, record); err != nil {
				return err
			}
			current = next
		}
		result.Version = current.Version
		for key, value := range current.Values {
			result.Values[key] = value
		}
		for key := range current.Secrets {
			result.SecretKeys = append(result.SecretKeys, key)
		}
		slices.Sort(result.SecretKeys)
		// Settings administration is independent of runtime grants, so an admin can
		// configure or reset a disabled/pending package. Audit failure rolls back writes.
		return audit(tx, r, action, *record)
	})
	return libresponse.TxResponse(w, result, err)
}
