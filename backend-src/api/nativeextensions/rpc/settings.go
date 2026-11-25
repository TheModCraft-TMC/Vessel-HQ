package rpc

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"time"

	v1 "github.com/TheModCraft-TMC/Vessel-HQ-Extension-SDK/proto/v1"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/nativeextensions"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// SettingsStorage reads only the certificate-bound registration. Authorization,
// revision checking, schema validation and metadata-only audit are transactional.
type SettingsStorage func(context.Context, string, string, int64, bool) (*nativeextensions.Settings, error)

func (s *Server) GetSettings(ctx context.Context, request *v1.GetSettingsRequest) (*v1.ExtensionSettings, error) {
	id, digest, err := identity(ctx)
	if err != nil {
		return nil, err
	}
	if request == nil || request.Revision <= 0 {
		return nil, status.Error(codes.InvalidArgument, "positive approval revision required")
	}
	if s.settings == nil {
		return nil, status.Error(codes.FailedPrecondition, "machine settings unavailable")
	}
	settings, err := s.settings(ctx, id, digest, request.Revision, request.IncludeSecrets)
	if err != nil {
		return nil, err
	}
	return &v1.ExtensionSettings{Version: int64(settings.Version), Values: settings.Values, Secrets: settings.Secrets}, nil
}

func NewSettingsStorage(store dataservices.DataStore) SettingsStorage {
	return newSettingsStorage(store, func(tx dataservices.DataStoreTx, event *portainer.ActivityLog) error {
		return tx.ActivityLog().Create(event)
	})
}

func newSettingsStorage(store dataservices.DataStore, audit noteAudit) SettingsStorage {
	return func(ctx context.Context, id, digest string, revision int64, includeSecrets bool) (*nativeextensions.Settings, error) {
		if err := ctx.Err(); err != nil {
			return nil, status.FromContextError(err).Err()
		}
		if revision <= 0 {
			return nil, status.Error(codes.InvalidArgument, "positive approval revision required")
		}
		var result *nativeextensions.Settings
		var operationErr error
		err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			records, err := tx.NativeExtension().ReadAll(func(r nativeextensions.Record) bool { return r.Manifest.ID == id })
			if err != nil {
				return err
			}
			if len(records) != 1 {
				return status.Error(codes.PermissionDenied, "extension registration unavailable")
			}
			r := records[0]
			approval := nativeextensions.Approval{Revision: r.Revision, TrustedNativeUI: r.TrustedNativeUI, ServiceReadEnabled: r.ServiceReadEnabled, Grants: r.Grants}
			if r.Manifest.PackageDigest != digest || approval.ValidateFor(r) != nil || nativeextensions.Authorize(r, "settings.service.read", 0) != nil || (includeSecrets && nativeextensions.Authorize(r, "settings.service.secrets.read", 0) != nil) {
				operationErr = status.Error(codes.PermissionDenied, "current package machine settings grants required")
			} else if int64(r.Revision) != revision {
				operationErr = status.Error(codes.FailedPrecondition, "approval revision changed; refresh registration")
			}
			current := r.Settings
			if current == nil {
				current = &nativeextensions.Settings{}
			}
			if operationErr == nil && (current.Version < 0 || nativeextensions.ValidateSettingsFor(r.Manifest, current.Values, current.Secrets) != nil) {
				operationErr = status.Error(codes.FailedPrecondition, "administrator settings do not match the current schema")
			}
			if operationErr == nil {
				result = &nativeextensions.Settings{Version: current.Version, Values: map[string]string{}, Secrets: map[string]string{}}
				for key, value := range current.Values {
					result.Values[key] = value
				}
				if includeSecrets {
					for key, value := range current.Secrets {
						result.Secrets[key] = value
					}
				}
			}
			if err := ctx.Err(); err != nil {
				return err
			}
			outcome := "allowed"
			if operationErr != nil {
				outcome = "denied"
			}
			metadata, _ := json.Marshal(map[string]any{"extensionId": id, "packageDigest": digest, "revision": r.Revision, "settingsVersion": current.Version, "includeSecrets": includeSecrets, "outcome": outcome})
			return audit(tx, &portainer.ActivityLog{Timestamp: time.Now().Unix(), Username: "extension:" + id, Action: "extension.grpc.settings.read", Context: "native-extensions", Payload: base64.StdEncoding.EncodeToString(metadata)})
		})
		if err != nil {
			if ctx.Err() != nil {
				return nil, status.FromContextError(ctx.Err()).Err()
			}
			if status.Code(err) == codes.PermissionDenied {
				return nil, err
			}
			return nil, status.Error(codes.Internal, "unable to commit extension settings audit")
		}
		if operationErr != nil {
			return nil, operationErr
		}
		return result, nil
	}
}
