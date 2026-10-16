package nativeextensions

import (
	"errors"
	"net/http"
	"strconv"
	"unicode/utf8"

	"github.com/portainer/portainer/api/dataservices"
	domain "github.com/portainer/portainer/api/nativeextensions"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	librequest "github.com/portainer/portainer/pkg/libhttp/request"
	libresponse "github.com/portainer/portainer/pkg/libhttp/response"
)

type storageRequest struct {
	Revision      int    `json:"revision"`
	PackageDigest string `json:"packageDigest"`
	Version       int    `json:"version"`
	Text          string `json:"text"`
}

// Storage is extension-owned text, never a path, infrastructure proxy or secret store.
// Approval, optimistic concurrency, persistence and audit commit in one transaction.
func (h *Handler) storage(w http.ResponseWriter, r *http.Request, write bool) *httperror.HandlerError {
	id, err := librequest.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil || id <= 0 {
		return httperror.BadRequest("Invalid extension ID", domain.ErrDenied)
	}
	var input storageRequest
	if write {
		if err := decode(w, r, &input); err != nil {
			return httperror.BadRequest("Invalid storage request", err)
		}
		if input.Version < 0 || len(input.Text) > 16384 || !utf8.ValidString(input.Text) {
			return httperror.BadRequest("Notes must be valid UTF-8, at most 16 KiB, with a nonnegative version", domain.ErrDenied)
		}
	} else {
		input.Revision, err = strconv.Atoi(r.URL.Query().Get("revision"))
		input.PackageDigest = r.URL.Query().Get("packageDigest")
		if err != nil {
			return httperror.BadRequest("Revision required", err)
		}
	}
	var result domain.Note
	err = h.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		record, err := tx.NativeExtension().Read(id)
		if tx.IsErrObjectNotFound(err) {
			return httperror.NotFound("Extension unavailable", err)
		}
		if err != nil {
			return err
		}
		capability := "storage.read"
		if write {
			capability = "storage.write"
		}
		if domain.Authorize(*record, "ui.native", 0) != nil || domain.Authorize(*record, capability, 0) != nil {
			return httperror.Forbidden("Current native UI and storage grants required", domain.ErrDenied)
		}
		if input.Revision != record.Revision || input.PackageDigest != record.Manifest.PackageDigest {
			return httperror.Conflict("Extension changed; reload before continuing", domain.ErrDenied)
		}
		if record.Note != nil {
			result = *record.Note
		}
		action := "extension.storage.read"
		if write {
			if input.Version != result.Version {
				return httperror.Conflict("Notes changed; reload before saving", errors.New("stale storage version"))
			}
			result = domain.Note{Text: input.Text, Version: result.Version + 1}
			record.Note = &result
			if err := tx.NativeExtension().Update(id, record); err != nil {
				return err
			}
			action = "extension.storage.write"
		}
		// Existing audit metadata deliberately excludes note contents.
		return audit(tx, r, action, *record)
	})
	w.Header().Set("Cache-Control", "no-store")
	return libresponse.TxResponse(w, result, err)
}
func (h *Handler) readStorage(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	return h.storage(w, r, false)
}
func (h *Handler) writeStorage(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	return h.storage(w, r, true)
}
