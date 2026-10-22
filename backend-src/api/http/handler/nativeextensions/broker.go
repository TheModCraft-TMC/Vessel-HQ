package nativeextensions

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	portainer "github.com/portainer/portainer/api"
	extensionrpc "github.com/portainer/portainer/api/nativeextensions/rpc"
	"github.com/portainer/portainer/api/nativeextensions/topology"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/portainer/portainer/api/http/security"
	domain "github.com/portainer/portainer/api/nativeextensions"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	librequest "github.com/portainer/portainer/pkg/libhttp/request"
	libresponse "github.com/portainer/portainer/pkg/libhttp/response"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type invokePayload struct {
	Revision      int    `json:"revision"`
	PackageDigest string `json:"packageDigest"`
	Operation     string `json:"operation"`
	EnvironmentID int    `json:"environmentId"`
	StackID       int    `json:"stackId"`
}
type slotManifest struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	PackageDigest string `json:"packageDigest"`
	UI            slotUI `json:"ui"`
}
type slotUI struct {
	Entry string          `json:"entry"`
	Slots []domain.UISlot `json:"slots"`
}
type slotRecord struct {
	ID       int          `json:"id"`
	Revision int          `json:"revision"`
	Manifest slotManifest `json:"manifest"`
}

func (h *Handler) slots(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	env, e := strconv.Atoi(r.URL.Query().Get("environmentId"))
	stack, se := strconv.Atoi(r.URL.Query().Get("stackId"))
	if e != nil || se != nil || env <= 0 || stack <= 0 {
		return httperror.BadRequest("Positive environmentId and stackId required", errors.New("invalid topology scope"))
	}
	user, e := security.RetrieveRestrictedRequestContext(r)
	if e != nil {
		return httperror.Forbidden("User context required", e)
	}
	if h.AuthorizeUser == nil || h.AuthorizeUser(r.Context(), int(user.UserID), env, stack) != nil {
		return httperror.Forbidden("Stack access denied", domain.ErrDenied)
	}
	records, e := h.DataStore.NativeExtension().ReadAll()
	if e != nil {
		return httperror.InternalServerError("Cannot list extension slots", e)
	}
	result := []slotRecord{}
	for _, record := range records {
		if domain.Authorize(record, "ui.native", 0) != nil || domain.AuthorizeStackNetwork(record, env, stack) != nil || record.Manifest.UI == nil {
			continue
		}
		slots := []domain.UISlot{}
		for _, slot := range record.Manifest.UI.Slots {
			if slot.Slot == "docker.stack.detail.action" {
				slots = append(slots, slot)
			}
		}
		if len(slots) > 0 {
			result = append(result, slotRecord{ID: record.ID, Revision: record.Revision, Manifest: slotManifest{ID: record.Manifest.ID, Name: record.Manifest.Name, PackageDigest: record.Manifest.PackageDigest, UI: slotUI{Entry: record.Manifest.UI.Entry, Slots: slots}}})
		}
	}
	w.Header().Set("Cache-Control", "no-store")
	return libresponse.JSON(w, result)
}
func (h *Handler) invoke(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload invokePayload
	if err := decode(w, r, &payload); err != nil {
		return httperror.BadRequest("Invalid extension operation", err)
	}
	graph, err := h.invokeGraph(r, payload)
	if err != nil {
		return err
	}
	w.Header().Set("Cache-Control", "no-store")
	return libresponse.JSON(w, graph)
}
func (h *Handler) invokeGraph(r *http.Request, payload invokePayload) (topology.Graph, *httperror.HandlerError) {
	if (payload.Operation != "stacks.network.read" && payload.Operation != "stacks.traffic.read") || payload.EnvironmentID <= 0 || payload.StackID <= 0 || payload.Revision <= 0 || payload.PackageDigest == "" {
		return topology.Graph{}, httperror.BadRequest("Unsupported extension operation or scope", domain.ErrDenied)
	}
	id, e := librequest.RetrieveNumericRouteVariableValue(r, "id")
	if e != nil || id <= 0 {
		return topology.Graph{}, httperror.BadRequest("Invalid extension ID", domain.ErrDenied)
	}
	record, e := h.DataStore.NativeExtension().Read(id)
	if e != nil {
		return topology.Graph{}, httperror.NotFound("Extension unavailable", e)
	}
	user, e := security.RetrieveRestrictedRequestContext(r)
	if e != nil {
		return topology.Graph{}, httperror.Forbidden("Current user required", e)
	}
	if domain.Authorize(*record, "ui.native", 0) != nil || domain.AuthorizeStackCapability(*record, payload.Operation, payload.EnvironmentID, payload.StackID) != nil || h.AuthorizeUser == nil || h.AuthorizeUser(r.Context(), int(user.UserID), payload.EnvironmentID, payload.StackID) != nil {
		event := extensionrpc.AccessEvent{ExtensionID: record.Manifest.ID, PackageDigest: record.Manifest.PackageDigest, Capability: payload.Operation, EnvironmentID: payload.EnvironmentID, StackID: payload.StackID, UserID: int(user.UserID), Outcome: "denied"}
		encoded, err := json.Marshal(event)
		if err != nil {
			return topology.Graph{}, httperror.InternalServerError("Cannot audit denied extension invocation", err)
		}
		username := strconv.Itoa(int(user.UserID))
		if user.User != nil {
			username = user.User.Username
		}
		if err := h.DataStore.ActivityLog().Create(&portainer.ActivityLog{Timestamp: time.Now().Unix(), Username: username, Action: "extension.invoke.denied", Context: "native-extensions", Payload: base64.StdEncoding.EncodeToString(encoded)}); err != nil {
			return topology.Graph{}, httperror.InternalServerError("Cannot audit denied extension invocation", err)
		}
		return topology.Graph{}, httperror.Forbidden("Extension or stack access denied", domain.ErrDenied)
	}
	if payload.Revision != record.Revision || payload.PackageDigest != record.Manifest.PackageDigest {
		return topology.Graph{}, httperror.Conflict("Extension changed; reload the stack page before continuing", domain.ErrDenied)
	}
	if h.Broker == nil {
		return topology.Graph{}, httperror.NewError(http.StatusServiceUnavailable, "Extension gRPC broker unavailable", errors.New("broker unavailable"))
	}
	invoke := h.Broker.Invoke
	if payload.Operation == "stacks.traffic.read" {
		invoke = h.Broker.InvokeTraffic
	}
	graph, e := invoke(r.Context(), *record, int(user.UserID), payload.EnvironmentID, payload.StackID)
	if e != nil {
		switch status.Code(e) {
		case codes.PermissionDenied, codes.Unauthenticated:
			return topology.Graph{}, httperror.Forbidden("Extension operation denied", e)
		case codes.DeadlineExceeded:
			return topology.Graph{}, httperror.NewError(http.StatusGatewayTimeout, "Stack topology request timed out", e)
		}
		return topology.Graph{}, httperror.InternalServerError("Cannot load stack network topology", e)
	}
	return graph, nil
}

// Streams are explicitly started by the user and expire after one minute. Each
// sample rechecks package binding, extension grants and current stack access.
func (h *Handler) trafficStream(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload invokePayload
	if err := decode(w, r, &payload); err != nil {
		return httperror.BadRequest("Invalid stream scope", err)
	}
	if payload.Operation != "stacks.traffic.read" {
		return httperror.BadRequest("Traffic operation required", domain.ErrDenied)
	}
	ctx, cancel := context.WithTimeout(r.Context(), time.Minute)
	defer cancel()
	r = r.WithContext(ctx)
	graph, err := h.invokeGraph(r, payload)
	if err != nil {
		return err
	}
	w.Header().Set("Content-Type", "text/event-stream")
	// Prevent intermediary compression from buffering samples until stream end.
	w.Header().Set("Cache-Control", "no-store, no-transform")
	w.Header().Set("X-Accel-Buffering", "no")
	emit := func(event string, value any) bool {
		bytes, e := json.Marshal(value)
		if e != nil {
			return false
		}
		if _, e = fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event, bytes); e != nil {
			return false
		}
		return http.NewResponseController(w).Flush() == nil
	}
	if !emit("snapshot", graph) {
		return nil
	}
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			emit("end", map[string]string{"message": "Live session ended. Start live traffic again to continue."})
			return nil
		case <-ticker.C:
			graph, err = h.invokeGraph(r, payload)
			if err != nil {
				emit("error", map[string]string{"message": "Live traffic stopped because access changed or the Docker read failed."})
				return nil
			}
			if !emit("snapshot", graph) {
				return nil
			}
		}
	}
}
func (h *Handler) download(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, e := librequest.RetrieveNumericRouteVariableValue(r, "id")
	if e != nil || id <= 0 {
		return httperror.BadRequest("Invalid extension ID", domain.ErrDenied)
	}
	record, e := h.DataStore.NativeExtension().Read(id)
	if e != nil || !record.PackageAvailable {
		return httperror.NotFound("Package unavailable", e)
	}
	hash := strings.TrimPrefix(record.ArchiveDigest, "sha256:")
	if len(hash) != 64 || h.FileService == nil {
		return httperror.InternalServerError("Invalid stored package identity", errors.New("invalid archive identity"))
	}
	if _, e = hex.DecodeString(hash); e != nil {
		return httperror.InternalServerError("Invalid stored package identity", e)
	}
	filename := filepath.Join(h.FileService.GetDatastorePath(), "native-extensions", "packages", hash+".vesselhq")
	info, e := os.Lstat(filename)
	if e != nil || !info.Mode().IsRegular() || info.Size() > domain.MaxArchiveSize {
		return httperror.NotFound("Stored package unavailable", e)
	}
	file, e := os.Open(filename)
	if e != nil {
		return httperror.InternalServerError("Cannot read extension package", e)
	}
	defer file.Close()
	bytes, e := io.ReadAll(io.LimitReader(file, domain.MaxArchiveSize+1))
	if e != nil {
		return httperror.InternalServerError("Cannot read extension package", e)
	}
	actual := sha256.Sum256(bytes)
	if int64(len(bytes)) > domain.MaxArchiveSize || hex.EncodeToString(actual[:]) != hash {
		return httperror.InternalServerError("Stored package checksum mismatch", domain.ErrDenied)
	}
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", `attachment; filename="`+record.Manifest.ID+`.vesselhq"`)
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("ETag", `"`+record.ArchiveDigest+`"`)
	_, e = w.Write(bytes)
	if e != nil {
		return httperror.InternalServerError("Cannot send extension package", e)
	}
	return nil
}
