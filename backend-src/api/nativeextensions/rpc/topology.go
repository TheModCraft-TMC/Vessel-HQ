package rpc

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	v1 "github.com/TheModCraft-TMC/Vessel-HQ/sdk/go/proto/v1"
	"github.com/portainer/portainer/api/nativeextensions"
	"github.com/portainer/portainer/api/nativeextensions/topology"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"
	"time"
)

type StackNetworkLookup func(context.Context, int, int) (topology.Graph, error)
type UserAuthorize func(context.Context, int, int, int) error

const leaseHeader = "x-vessel-user-lease"

type userLease struct {
	ExtensionID   string
	PackageDigest string
	UserID        int
	EnvironmentID int
	StackID       int
	Expires       int64
	Nonce         string
}
type leaseSigner struct{ key []byte }

func newLeaseSigner() (*leaseSigner, error) {
	key := make([]byte, 32)
	_, err := rand.Read(key)
	return &leaseSigner{key: key}, err
}
func (s *leaseSigner) sign(id, digest string, userID, environmentID, stackID int) (string, error) {
	nonce := make([]byte, 16)
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	lease := userLease{id, digest, userID, environmentID, stackID, time.Now().Add(15 * time.Second).Unix(), base64.RawURLEncoding.EncodeToString(nonce)}
	payload, err := json.Marshal(lease)
	if err != nil {
		return "", err
	}
	mac := hmac.New(sha256.New, s.key)
	mac.Write(payload)
	return base64.RawURLEncoding.EncodeToString(append(payload, mac.Sum(nil)...)), nil
}
func (s *leaseSigner) verify(ctx context.Context, id, digest string, environmentID, stackID int) (int, error) {
	incoming, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return 0, errors.New("missing delegated lease")
	}
	values := incoming.Get(leaseHeader)
	if len(values) != 1 || len(values[0]) > 4096 {
		return 0, errors.New("invalid delegated lease")
	}
	signed, err := base64.RawURLEncoding.DecodeString(values[0])
	if err != nil || len(signed) <= sha256.Size {
		return 0, errors.New("invalid delegated lease")
	}
	payload, signature := signed[:len(signed)-sha256.Size], signed[len(signed)-sha256.Size:]
	mac := hmac.New(sha256.New, s.key)
	mac.Write(payload)
	if !hmac.Equal(signature, mac.Sum(nil)) {
		return 0, errors.New("invalid delegated lease signature")
	}
	var lease userLease
	if json.Unmarshal(payload, &lease) != nil {
		return 0, errors.New("invalid delegated lease payload")
	}
	now := time.Now().Unix()
	if lease.ExtensionID != id || lease.PackageDigest != digest || lease.EnvironmentID != environmentID || lease.StackID != stackID || lease.UserID <= 0 || lease.Expires <= now || lease.Expires > now+30 || lease.Nonce == "" {
		return 0, errors.New("delegated lease is expired or outside scope")
	}
	return lease.UserID, nil
}
func (s *Server) GetStackNetwork(ctx context.Context, request *v1.GetStackNetworkRequest) (*v1.GetStackNetworkResponse, error) {
	return s.getStack(ctx, request, false)
}
func (s *Server) GetStackTraffic(ctx context.Context, request *v1.GetStackNetworkRequest) (*v1.GetStackNetworkResponse, error) {
	return s.getStack(ctx, request, true)
}
func (s *Server) getStack(ctx context.Context, request *v1.GetStackNetworkRequest, traffic bool) (*v1.GetStackNetworkResponse, error) {
	capability := "stacks.network.read"
	read := s.stackRead
	if traffic {
		capability = "stacks.traffic.read"
		read = s.trafficRead
	}

	id, digest, err := identity(ctx)
	if err != nil {
		return nil, err
	}
	if request == nil || request.EnvironmentId <= 0 || request.StackId <= 0 || int64(int(request.EnvironmentId)) != request.EnvironmentId || int64(int(request.StackId)) != request.StackId {
		return nil, status.Error(codes.InvalidArgument, "positive environment and stack IDs required")
	}
	if s.leases == nil || s.userAuthorize == nil || read == nil || s.audit == nil {
		return nil, status.Error(codes.FailedPrecondition, "delegated stack topology unavailable")
	}
	env, stack := int(request.EnvironmentId), int(request.StackId)
	user, err := s.leases.verify(ctx, id, digest, env, stack)
	if err != nil {
		return nil, status.Error(codes.PermissionDenied, "valid host user lease required")
	}
	event := AccessEvent{ExtensionID: id, PackageDigest: digest, Capability: capability, EnvironmentID: env, StackID: stack, UserID: user, Outcome: "denied"}
	allowed := func() bool {
		currentUser, leaseErr := s.leases.verify(ctx, id, digest, env, stack)
		if leaseErr != nil || currentUser != user {
			return false
		}
		record, err := s.lookup(ctx, id)
		return err == nil && record.Manifest.ID == id && record.Manifest.PackageDigest == digest && nativeextensions.Authorize(record, "ui.native", 0) == nil && nativeextensions.AuthorizeStackCapability(record, capability, env, stack) == nil && s.userAuthorize(ctx, user, env, stack) == nil
	}
	deny := func() (*v1.GetStackNetworkResponse, error) {
		if err := s.audit(ctx, event); err != nil {
			return nil, status.Error(codes.Internal, "unable to audit topology access")
		}
		return nil, status.Error(codes.PermissionDenied, "stack topology access denied")
	}
	if !allowed() {
		return deny()
	}
	graph, err := read(ctx, env, stack)
	if err != nil || graph.EnvironmentID != env || graph.StackID != stack {
		event.Outcome = "failed"
		if err := s.audit(ctx, event); err != nil {
			return nil, status.Error(codes.Internal, "unable to audit topology access")
		}
		return nil, status.Error(codes.Internal, "unable to read stack topology")
	}
	if !allowed() {
		return deny()
	}
	event.Outcome = "allowed"
	if err := s.audit(ctx, event); err != nil {
		return nil, status.Error(codes.Internal, "unable to audit topology access")
	}
	result := &v1.GetStackNetworkResponse{EnvironmentId: int64(env), StackId: int64(stack), Name: graph.Name}
	for _, network := range graph.Networks {
		result.Networks = append(result.Networks, &v1.Network{Id: network.ID, Name: network.Name, Driver: network.Driver, Scope: network.Scope, Internal: network.Internal})
	}
	for _, workload := range graph.Workloads {
		item := &v1.Workload{Id: workload.ID, Name: workload.Name, Kind: workload.Kind, State: workload.State}
		for _, network := range workload.Networks {
			item.Networks = append(item.Networks, &v1.NetworkAttachment{NetworkId: network.NetworkID})
		}
		result.Workloads = append(result.Workloads, item)
	}
	if graph.Traffic != nil {
		bytes, err := json.Marshal(graph.Traffic)
		if err != nil {
			return nil, status.Error(codes.Internal, "cannot encode traffic metadata")
		}
		result.Traffic = &v1.TrafficSnapshot{}
		if protojson.Unmarshal(bytes, result.Traffic) != nil {
			return nil, status.Error(codes.Internal, "cannot map traffic metadata")
		}
	}
	return result, nil
}
