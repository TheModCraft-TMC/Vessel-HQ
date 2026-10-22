package nativeextensions

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"github.com/gorilla/mux"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	domain "github.com/portainer/portainer/api/nativeextensions"
	extensionrpc "github.com/portainer/portainer/api/nativeextensions/rpc"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	librequest "github.com/portainer/portainer/pkg/libhttp/request"
	libresponse "github.com/portainer/portainer/pkg/libhttp/response"
	"io"
	"net/http"
	"time"
)

type Handler struct {
	*mux.Router
	DataStore     dataservices.DataStore
	FileService   portainer.FileService
	Broker        *extensionrpc.InternalBroker
	AuthorizeUser extensionrpc.UserAuthorize
}

func NewHandler(b security.BouncerService) *Handler {
	h := &Handler{Router: mux.NewRouter()}
	h.Handle("/native-extensions/slots", b.RestrictedAccess(httperror.LoggerHandler(h.slots))).Methods("GET")
	h.Handle("/native-extensions/{id}/traffic-stream", b.RestrictedAccess(httperror.LoggerHandler(h.trafficStream))).Methods("POST")
	h.Handle("/native-extensions/{id}/invoke", b.RestrictedAccess(httperror.LoggerHandler(h.invoke))).Methods("POST")
	h.Handle("/native-extensions/{id}/storage", b.AdminAccess(httperror.LoggerHandler(h.readStorage))).Methods("GET")
	h.Handle("/native-extensions/{id}/storage", b.AdminAccess(httperror.LoggerHandler(h.writeStorage))).Methods("PUT")
	h.Handle("/native-extensions/{id}/package", b.AdminAccess(httperror.LoggerHandler(h.download))).Methods("GET")

	h.Handle("/native-extensions", b.AdminAccess(httperror.LoggerHandler(h.list))).Methods("GET")
	h.Handle("/native-extensions", b.AdminAccess(httperror.LoggerHandler(h.register))).Methods("POST")
	h.Handle("/native-extensions/upload", b.AdminAccess(httperror.LoggerHandler(h.upload))).Methods("POST")
	h.Handle("/native-extensions/{id}/approval", b.AdminAccess(httperror.LoggerHandler(h.approve))).Methods("PUT")
	h.Handle("/native-extensions/{id}/disable", b.AdminAccess(httperror.LoggerHandler(h.disable))).Methods("POST")
	h.Handle("/native-extensions/{id}", b.AdminAccess(httperror.LoggerHandler(h.remove))).Methods("DELETE")
	return h
}
func decode(w http.ResponseWriter, r *http.Request, v any) error {
	d := json.NewDecoder(http.MaxBytesReader(w, r.Body, 128*1024))
	d.DisallowUnknownFields()
	if err := d.Decode(v); err != nil {
		return err
	}
	var rest any
	if d.Decode(&rest) != io.EOF {
		return errors.New("expected one JSON object")
	}
	return nil
}

// Registration metadata must not bypass the dedicated storage.read grant.
func publicRecord(record domain.Record) domain.Record {
	record.Note = nil
	return record
}
func (h *Handler) list(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	v, e := h.DataStore.NativeExtension().ReadAll()
	for i := range v {
		v[i] = publicRecord(v[i])
	}
	w.Header().Set("Cache-Control", "no-store")
	return libresponse.TxResponse(w, v, e)
}
func (h *Handler) register(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var m domain.Manifest
	if e := decode(w, r, &m); e != nil {
		return httperror.BadRequest("Invalid manifest", e)
	}
	if e := m.Validate(); e != nil {
		return httperror.BadRequest("Invalid manifest", e)
	}
	v, e := h.persistRegistration(r, m, false, "", "extension.register")
	return libresponse.TxResponse(w, publicRecord(v), e)
}
func (h *Handler) persistRegistration(r *http.Request, m domain.Manifest, available bool, archiveDigest, action string) (domain.Record, error) {
	var v domain.Record
	e := h.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		all, e := tx.NativeExtension().ReadAll()
		if e != nil {
			return e
		}
		v = domain.Record{Manifest: m, Revision: 1, Status: "pending_approval", Grants: []domain.Permission{}, UpdatedAt: time.Now().Unix(), PackageAvailable: available, ArchiveDigest: archiveDigest}
		for _, old := range all {
			if old.Manifest.ID == m.ID {
				v.ID = old.ID
				v.Revision = old.Revision + 1
				v.Note = old.Note
				break
			}
		}
		if v.ID == 0 {
			e = tx.NativeExtension().Create(&v)
		} else {
			e = tx.NativeExtension().Update(v.ID, &v)
		}
		if e != nil {
			return e
		}
		return audit(tx, r, action, v)
	})
	return v, e
}
func (h *Handler) mutate(w http.ResponseWriter, r *http.Request, action string, f func(*domain.Record) error) *httperror.HandlerError {
	id, e := librequest.RetrieveNumericRouteVariableValue(r, "id")
	if e != nil || id <= 0 {
		return httperror.BadRequest("Invalid extension ID", errors.New("positive numeric ID required"))
	}
	var v *domain.Record
	e = h.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var e error
		v, e = tx.NativeExtension().Read(id)
		if tx.IsErrObjectNotFound(e) {
			return httperror.NotFound("Extension not found", e)
		}
		if e != nil {
			return e
		}
		if e = f(v); e != nil {
			return e
		}
		v.UpdatedAt = time.Now().Unix()
		if action == "extension.remove" {
			e = tx.NativeExtension().Delete(id)
		} else {
			e = tx.NativeExtension().Update(id, v)
		}
		if e != nil {
			return e
		}
		return audit(tx, r, action, *v)
	})
	if action == "extension.remove" {
		return libresponse.TxEmptyResponse(w, e)
	}
	if v == nil {
		return libresponse.TxResponse(w, nil, e)
	}
	return libresponse.TxResponse(w, publicRecord(*v), e)
}
func (h *Handler) approve(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var a domain.Approval
	if e := decode(w, r, &a); e != nil {
		return httperror.BadRequest("Invalid approval", e)
	}
	return h.mutate(w, r, "extension.approve", func(v *domain.Record) error {
		if a.Revision != v.Revision {
			return httperror.Conflict("Manifest changed; review current revision", errors.New("stale approval"))
		}
		if e := a.ValidateFor(*v); e != nil {
			return httperror.BadRequest("Invalid permission grant", e)
		}
		v.Grants = a.Grants
		if v.Grants == nil {
			v.Grants = []domain.Permission{}
		}
		v.TrustedNativeUI = a.TrustedNativeUI
		v.ServiceReadEnabled = a.ServiceReadEnabled
		v.Status = "approved"
		return nil
	})
}
func (h *Handler) disable(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	return h.mutate(w, r, "extension.disable", func(v *domain.Record) error {
		v.Status = "disabled"
		v.Grants = []domain.Permission{}
		v.TrustedNativeUI = false
		v.ServiceReadEnabled = false
		return nil
	})
}
func (h *Handler) remove(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	return h.mutate(w, r, "extension.remove", func(*domain.Record) error { return nil })
}
func audit(tx dataservices.DataStoreTx, r *http.Request, action string, v domain.Record) error {
	u, e := security.RetrieveRestrictedRequestContext(r)
	if e != nil {
		return e
	}
	if !u.IsAdmin || u.User == nil {
		return httperror.Forbidden("Administrator required", errors.New("admin context required"))
	}
	payload, e := json.Marshal(map[string]any{"id": v.ID, "extensionId": v.Manifest.ID, "revision": v.Revision, "packageDigest": v.Manifest.PackageDigest, "status": v.Status, "grants": v.Grants, "trustedNativeUI": v.TrustedNativeUI, "serviceReadEnabled": v.ServiceReadEnabled, "archiveDigest": v.ArchiveDigest, "packageAvailable": v.PackageAvailable})
	if e != nil {
		return e
	}
	return tx.ActivityLog().Create(&portainer.ActivityLog{Timestamp: time.Now().Unix(), Username: u.User.Username, Action: action, Context: "native-extensions", Payload: base64.StdEncoding.EncodeToString(payload)})
}
