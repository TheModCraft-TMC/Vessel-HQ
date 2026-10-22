// Package rpc implements the extension identity handshake over mutually
// authenticated gRPC, scoped environment reads and extension-owned note storage.
package rpc

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"os"
	"strings"
	"time"

	extensionv1 "github.com/TheModCraft-TMC/Vessel-HQ/sdk/go/proto/v1"
	"github.com/portainer/portainer/api/nativeextensions"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/peer"
	"google.golang.org/grpc/status"
)

// Lookup must read the current registry for each RPC, never a grant snapshot.
type Lookup func(context.Context, string) (nativeextensions.Record, error)

type Environment struct {
	ID     int64
	Name   string
	Type   int32
	Status int32
}
type EnvironmentLookup func(context.Context, int) (Environment, error)
type AccessEvent struct {
	ExtensionID   string `json:"extensionId"`
	PackageDigest string `json:"packageDigest"`
	Capability    string `json:"capability"`
	EnvironmentID int    `json:"environmentId"`
	Outcome       string `json:"outcome"`
	StackID       int    `json:"stackId,omitempty"`
	UserID        int    `json:"userId,omitempty"`
}
type AccessAudit func(context.Context, AccessEvent) error

var ErrEnvironmentNotFound = errors.New("environment not found")

type Config struct {
	Address         string
	CertificateFile string
	KeyFile         string
	ClientCAFile    string
}

// ConfigFromEnvironment keeps the listener disabled unless explicitly configured.
// Partial configuration fails closed rather than falling back to plaintext.
func ConfigFromEnvironment() (Config, error) {
	c := Config{os.Getenv("VESSEL_EXTENSION_GRPC_ADDRESS"), os.Getenv("VESSEL_EXTENSION_GRPC_CERT"), os.Getenv("VESSEL_EXTENSION_GRPC_KEY"), os.Getenv("VESSEL_EXTENSION_GRPC_CLIENT_CA")}
	count := 0
	for _, value := range []string{c.Address, c.CertificateFile, c.KeyFile, c.ClientCAFile} {
		if value != "" {
			count++
		}
	}
	if count != 0 && count != 4 {
		return Config{}, errors.New("extension gRPC requires address, certificate, key, and dedicated client CA")
	}
	return c, nil
}

type Server struct {
	extensionv1.UnimplementedExtensionGatewayServer
	lookup        Lookup
	read          EnvironmentLookup
	audit         AccessAudit
	stackRead     StackNetworkLookup
	trafficRead   StackNetworkLookup
	userAuthorize UserAuthorize
	leases        *leaseSigner
	notes         NoteStorage
}

// NewServer never accepts caller-supplied transport credentials or auth options.
func NewServer(config Config, lookup Lookup, read EnvironmentLookup, audit AccessAudit, notes ...NoteStorage) (*grpc.Server, error) {
	if lookup == nil {
		return nil, errors.New("extension registry lookup required")
	}
	cert, err := tls.LoadX509KeyPair(config.CertificateFile, config.KeyFile)
	if err != nil {
		return nil, err
	}
	pem, err := os.ReadFile(config.ClientCAFile)
	if err != nil {
		return nil, err
	}
	pool := x509.NewCertPool()
	if !pool.AppendCertsFromPEM(pem) {
		return nil, errors.New("invalid extension client CA")
	}
	transport := credentials.NewTLS(&tls.Config{MinVersion: tls.VersionTLS13, Certificates: []tls.Certificate{cert}, ClientCAs: pool, ClientAuth: tls.RequireAndVerifyClientCert})
	service := &Server{lookup: lookup, read: read, audit: audit}
	if len(notes) > 0 {
		service.notes = notes[0]
	}
	return newGRPCServer(transport, service), nil
}
func newGRPCServer(transport credentials.TransportCredentials, service *Server) *grpc.Server {
	server := grpc.NewServer(grpc.Creds(transport), grpc.MaxRecvMsgSize(64*1024), grpc.MaxSendMsgSize(256*1024), grpc.MaxConcurrentStreams(16), grpc.ConnectionTimeout(10*time.Second), grpc.KeepaliveParams(keepalive.ServerParameters{MaxConnectionAge: 5 * time.Minute, MaxConnectionAgeGrace: 10 * time.Second, Time: time.Minute, Timeout: 10 * time.Second}))
	extensionv1.RegisterExtensionGatewayServer(server, service)
	return server
}

// Start serves on a dedicated listener; it is never exposed through the public
// browser router. Cancellation closes existing connections and ongoing RPCs.
func Start(ctx context.Context, config Config, lookup Lookup, read EnvironmentLookup, audit AccessAudit, notes ...NoteStorage) (<-chan error, error) {
	server, err := NewServer(config, lookup, read, audit, notes...)
	if err != nil {
		return nil, err
	}
	listener, err := listenGateway(config.Address)
	if err != nil {
		server.Stop()
		return nil, err
	}
	result := make(chan error, 1)
	done := make(chan struct{})
	go func() {
		select {
		case <-ctx.Done():
			server.Stop()
		case <-done:
		}
	}()
	go func() { defer close(done); defer close(result); result <- server.Serve(listener) }()
	return result, nil
}

func (s *Server) GetRegistration(ctx context.Context, _ *extensionv1.GetRegistrationRequest) (*extensionv1.GetRegistrationResponse, error) {
	id, digest, err := identity(ctx)
	if err != nil {
		return nil, err
	}
	record, err := s.lookup(ctx, id)
	if err != nil {
		return nil, status.Error(codes.PermissionDenied, "extension registration unavailable")
	}
	approval := nativeextensions.Approval{Revision: record.Revision, TrustedNativeUI: record.TrustedNativeUI, ServiceReadEnabled: record.ServiceReadEnabled, Grants: record.Grants}
	if record.Manifest.ID != id || record.Manifest.PackageDigest != digest || record.Status != "approved" || record.Manifest.Validate() != nil || approval.ValidateFor(record) != nil {
		return nil, status.Error(codes.PermissionDenied, "extension registration is not approved for this package")
	}
	response := &extensionv1.GetRegistrationResponse{ExtensionId: id, PackageDigest: digest, Revision: int64(record.Revision), Status: record.Status, RuntimeAvailable: record.ServiceReadEnabled && s.read != nil && s.audit != nil}
	for _, grant := range record.Grants {
		p := &extensionv1.Permission{Capability: grant.Capability}
		for _, stack := range grant.StackIDs {
			p.StackIds = append(p.StackIds, int64(stack))
		}
		for _, env := range grant.EnvironmentIDs {
			p.EnvironmentIds = append(p.EnvironmentIds, int64(env))
		}
		response.Grants = append(response.Grants, p)
	}
	return response, nil
}

func (s *Server) GetEnvironment(ctx context.Context, request *extensionv1.GetEnvironmentRequest) (*extensionv1.GetEnvironmentResponse, error) {
	id, digest, err := identity(ctx)
	if err != nil {
		return nil, err
	}
	if request == nil || request.EnvironmentId <= 0 || int64(int(request.EnvironmentId)) != request.EnvironmentId {
		return nil, status.Error(codes.InvalidArgument, "positive environment ID required")
	}
	environmentID := int(request.EnvironmentId)
	event := AccessEvent{ExtensionID: id, PackageDigest: digest, Capability: "environments.read", EnvironmentID: environmentID, Outcome: "denied"}
	if s.read == nil || s.audit == nil {
		return nil, status.Error(codes.FailedPrecondition, "environment read service unavailable")
	}
	allowed := func() bool {
		r, lookupErr := s.lookup(ctx, id)
		return lookupErr == nil && r.Manifest.ID == id && r.Manifest.PackageDigest == digest && r.ServiceReadEnabled && nativeextensions.Authorize(r, "environments.read", environmentID) == nil
	}
	if !allowed() {
		if err := s.audit(ctx, event); err != nil {
			return nil, status.Error(codes.Internal, "unable to audit extension access")
		}
		return nil, status.Error(codes.PermissionDenied, "environment read grant required for this package and scope")
	}
	environment, err := s.read(ctx, environmentID)
	if err != nil {
		event.Outcome = "failed"
		if auditErr := s.audit(ctx, event); auditErr != nil {
			return nil, status.Error(codes.Internal, "unable to audit extension access")
		}
		if errors.Is(err, ErrEnvironmentNotFound) {
			return nil, status.Error(codes.NotFound, "environment not found")
		}
		if ctx.Err() != nil {
			return nil, status.FromContextError(ctx.Err()).Err()
		}
		return nil, status.Error(codes.Internal, "unable to read environment metadata")
	}
	// Recheck after reading so a concurrent disable/scope update blocks delivery.
	if !allowed() {
		if err := s.audit(ctx, event); err != nil {
			return nil, status.Error(codes.Internal, "unable to audit extension access")
		}
		return nil, status.Error(codes.PermissionDenied, "environment read grant was revoked")
	}
	if environment.ID != request.EnvironmentId {
		event.Outcome = "failed"
		if err := s.audit(ctx, event); err != nil {
			return nil, status.Error(codes.Internal, "unable to audit extension access")
		}
		return nil, status.Error(codes.Internal, "environment identity mismatch")
	}
	event.Outcome = "allowed"
	if err := s.audit(ctx, event); err != nil {
		return nil, status.Error(codes.Internal, "unable to audit extension access")
	}
	return &extensionv1.GetEnvironmentResponse{Id: environment.ID, Name: environment.Name, Type: environment.Type, Status: environment.Status}, nil
}

// Dedicated CA-issued URI SAN binds credentials to both extension and package:
// spiffe://vessel.local/extensions/<manifest-id>/packages/<sha256 hex>.
// Metadata headers and certificate CommonName are never used as authority.
func identity(ctx context.Context) (string, string, error) {
	denied := status.Error(codes.Unauthenticated, "verified extension certificate required")
	p, ok := peer.FromContext(ctx)
	if !ok {
		return "", "", denied
	}
	info, ok := p.AuthInfo.(credentials.TLSInfo)
	if !ok || len(info.State.VerifiedChains) == 0 || len(info.State.PeerCertificates) == 0 {
		return "", "", denied
	}
	cert := info.State.PeerCertificates[0]
	now := time.Now()
	if now.Before(cert.NotBefore) || !now.Before(cert.NotAfter) {
		return "", "", denied
	}
	if len(cert.URIs) != 1 {
		return "", "", denied
	}
	uri := cert.URIs[0]
	if uri.Scheme != "spiffe" || uri.Host != "vessel.local" || uri.RawQuery != "" || uri.Fragment != "" || uri.User != nil || uri.RawPath != "" {
		return "", "", denied
	}
	parts := strings.Split(uri.Path, "/")
	if len(parts) != 5 || parts[1] != "extensions" || parts[3] != "packages" {
		return "", "", denied
	}
	// Reuse the manifest identity checks without widening the accepted ID grammar.
	manifest := nativeextensions.Manifest{ID: parts[2], Name: "identity", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + parts[4]}
	if manifest.Validate() != nil {
		return "", "", denied
	}
	return manifest.ID, manifest.PackageDigest, nil
}
