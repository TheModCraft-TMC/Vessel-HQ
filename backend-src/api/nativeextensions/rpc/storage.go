package rpc

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"math"
	"time"
	"unicode/utf8"

	v1 "github.com/TheModCraft-TMC/Vessel-HQ/sdk/go/proto/v1"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/nativeextensions"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// NoteStorage applies package identity, current machine grants, approval revision,
// note CAS and metadata-only audit inside one datastore transaction.
type NoteStorage func(context.Context, string, string, int64, int64, string, bool) (*v1.ExtensionNote, error)
type noteAudit func(dataservices.DataStoreTx, *portainer.ActivityLog) error

func NewNoteStorage(store dataservices.DataStore) NoteStorage {
	return newNoteStorage(store, func(tx dataservices.DataStoreTx, event *portainer.ActivityLog) error {
		return tx.ActivityLog().Create(event)
	})
}
func newNoteStorage(store dataservices.DataStore, audit noteAudit) NoteStorage {
	return func(ctx context.Context, id, digest string, revision, version int64, text string, write bool) (*v1.ExtensionNote, error) {
		if err := ctx.Err(); err != nil {
			return nil, status.FromContextError(err).Err()
		}
		if revision <= 0 || (write && (version < 0 || len(text) > 16384 || !utf8.ValidString(text))) {
			return nil, status.Error(codes.InvalidArgument, "invalid note revision, version or text")
		}
		capability, action := "storage.service.read", "extension.grpc.storage.read"
		if write {
			capability, action = "storage.service.write", "extension.grpc.storage.write"
		}
		var result *v1.ExtensionNote
		var operationErr error
		err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			records, err := tx.NativeExtension().ReadAll(func(r nativeextensions.Record) bool { return r.Manifest.ID == id })
			if err != nil {
				return err
			}
			if len(records) != 1 {
				return status.Error(codes.PermissionDenied, "extension registration unavailable")
			}
			record := records[0]
			approval := nativeextensions.Approval{Revision: record.Revision, TrustedNativeUI: record.TrustedNativeUI, ServiceReadEnabled: record.ServiceReadEnabled, Grants: record.Grants}
			outcome := "allowed"
			if record.Manifest.PackageDigest != digest || approval.ValidateFor(record) != nil || nativeextensions.Authorize(record, capability, 0) != nil {
				operationErr = status.Error(codes.PermissionDenied, "current package machine storage grant required")
			} else if int64(record.Revision) != revision {
				operationErr = status.Error(codes.FailedPrecondition, "approval revision changed; refresh registration")
			}
			note := nativeextensions.Note{}
			if record.Note != nil {
				note = *record.Note
			}
			if operationErr == nil && write && int64(note.Version) != version {
				operationErr = status.Error(codes.Aborted, "note changed; reload before saving")
			}
			if operationErr == nil && write && note.Version == math.MaxInt {
				operationErr = status.Error(codes.ResourceExhausted, "note version exhausted")
			}
			if operationErr == nil {
				if write {
					note = nativeextensions.Note{Text: text, Version: note.Version + 1}
					record.Note = &note
					if err := tx.NativeExtension().Update(record.ID, &record); err != nil {
						return err
					}
				}
				result = &v1.ExtensionNote{Text: note.Text, Version: int64(note.Version)}
			} else {
				outcome = "denied"
			}
			if err := ctx.Err(); err != nil {
				return err
			}
			metadata, _ := json.Marshal(map[string]any{"extensionId": id, "packageDigest": digest, "revision": record.Revision, "capability": capability, "outcome": outcome})
			return audit(tx, &portainer.ActivityLog{Timestamp: time.Now().Unix(), Username: "extension:" + id, Action: action, Context: "native-extensions", Payload: base64.StdEncoding.EncodeToString(metadata)})
		})
		if err != nil {
			if ctx.Err() != nil {
				return nil, status.FromContextError(ctx.Err()).Err()
			}
			if status.Code(err) == codes.PermissionDenied {
				return nil, err
			}
			return nil, status.Error(codes.Internal, "unable to commit extension storage and audit")
		}
		if operationErr != nil {
			return nil, operationErr
		}
		return result, nil
	}
}
func (s *Server) GetNote(ctx context.Context, request *v1.GetNoteRequest) (*v1.ExtensionNote, error) {
	id, digest, err := identity(ctx)
	if err != nil {
		return nil, err
	}
	if request == nil || request.Revision <= 0 {
		return nil, status.Error(codes.InvalidArgument, "positive approval revision required")
	}
	if s.notes == nil {
		return nil, status.Error(codes.FailedPrecondition, "machine storage unavailable")
	}
	return s.notes(ctx, id, digest, request.Revision, 0, "", false)
}
func (s *Server) PutNote(ctx context.Context, request *v1.PutNoteRequest) (*v1.ExtensionNote, error) {
	id, digest, err := identity(ctx)
	if err != nil {
		return nil, err
	}
	if request == nil || request.Revision <= 0 || request.Version < 0 || len(request.Text) > 16384 || !utf8.ValidString(request.Text) {
		return nil, status.Error(codes.InvalidArgument, "positive revision, nonnegative version and UTF-8 text up to 16 KiB required")
	}
	if s.notes == nil {
		return nil, status.Error(codes.FailedPrecondition, "machine storage unavailable")
	}
	return s.notes(ctx, id, digest, request.Revision, request.Version, request.Text, true)
}
