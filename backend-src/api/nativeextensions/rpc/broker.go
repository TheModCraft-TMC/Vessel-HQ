package rpc

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"errors"
	v1 "github.com/TheModCraft-TMC/Vessel-HQ/sdk/go/proto/v1"
	"github.com/portainer/portainer/api/nativeextensions"
	"github.com/portainer/portainer/api/nativeextensions/topology"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/test/bufconn"
	"google.golang.org/protobuf/encoding/protojson"
	"math/big"
	"net"
	"net/url"
	"time"
)

// InternalBroker performs real mutually authenticated gRPC over a private
// in-memory transport. Neither extension UI nor external clients receive its CA,
// client private keys, lease signer, user bearer token, or delegated lease.
type InternalBroker struct {
	listener *bufconn.Listener
	ca       *x509.Certificate
	key      ed25519.PrivateKey
	pool     *x509.CertPool
	leases   *leaseSigner
}

func serial() (*big.Int, error) { return rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128)) }
func (b *InternalBroker) certificate(id, digest string, server bool) (tls.Certificate, error) {
	public, key, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return tls.Certificate{}, err
	}
	number, err := serial()
	if err != nil {
		return tls.Certificate{}, err
	}
	now := time.Now()
	template := &x509.Certificate{SerialNumber: number, Subject: pkix.Name{CommonName: "Vessel internal extension broker"}, NotBefore: now.Add(-time.Minute), NotAfter: now.Add(24 * time.Hour), KeyUsage: x509.KeyUsageDigitalSignature}
	if server {
		template.DNSNames = []string{"extensions.internal"}
		template.ExtKeyUsage = []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth}
	} else {
		identity, err := url.Parse("spiffe://vessel.local/extensions/" + id + "/packages/" + digest[len("sha256:"):])
		if err != nil {
			return tls.Certificate{}, err
		}
		template.URIs = []*url.URL{identity}
		template.ExtKeyUsage = []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth}
		template.NotAfter = now.Add(time.Minute)
	}
	der, err := x509.CreateCertificate(rand.Reader, template, b.ca, public, b.key)
	if err != nil {
		return tls.Certificate{}, err
	}
	return tls.Certificate{Certificate: [][]byte{der, b.ca.Raw}, PrivateKey: key}, nil
}
func NewInternalBroker(ctx context.Context, lookup Lookup, read StackNetworkLookup, authorize UserAuthorize, audit AccessAudit, traffic ...StackNetworkLookup) (*InternalBroker, error) {
	if lookup == nil || read == nil || authorize == nil || audit == nil {
		return nil, errors.New("complete delegated topology policy required")
	}
	public, key, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, err
	}
	number, err := serial()
	if err != nil {
		return nil, err
	}
	now := time.Now()
	template := &x509.Certificate{SerialNumber: number, Subject: pkix.Name{CommonName: "Vessel ephemeral internal broker CA"}, NotBefore: now.Add(-time.Minute), NotAfter: now.Add(365 * 24 * time.Hour), IsCA: true, BasicConstraintsValid: true, KeyUsage: x509.KeyUsageCertSign | x509.KeyUsageCRLSign}
	der, err := x509.CreateCertificate(rand.Reader, template, template, public, key)
	if err != nil {
		return nil, err
	}
	ca, err := x509.ParseCertificate(der)
	if err != nil {
		return nil, err
	}
	signer, err := newLeaseSigner()
	if err != nil {
		return nil, err
	}
	broker := &InternalBroker{listener: bufconn.Listen(1024 * 1024), ca: ca, key: key, pool: x509.NewCertPool(), leases: signer}
	broker.pool.AddCert(ca)
	certificate, err := broker.certificate("", "", true)
	if err != nil {
		return nil, err
	}
	serverTLS := &tls.Config{MinVersion: tls.VersionTLS13, Certificates: []tls.Certificate{certificate}, ClientAuth: tls.RequireAndVerifyClientCert, ClientCAs: broker.pool}
	// Refresh server leaf certificates for long-running hosts; private CA remains
	// process-local. No persistent extension certificate management is involved.
	serverTLS.GetCertificate = func(*tls.ClientHelloInfo) (*tls.Certificate, error) {
		value, err := broker.certificate("", "", true)
		return &value, err
	}
	service := &Server{lookup: lookup, stackRead: read, userAuthorize: authorize, audit: audit, leases: signer}
	if len(traffic) > 0 {
		service.trafficRead = traffic[0]
	}
	server := newGRPCServer(credentials.NewTLS(serverTLS), service)
	go func() { <-ctx.Done(); server.Stop(); broker.listener.Close() }()
	go server.Serve(broker.listener)
	return broker, nil
}
func (b *InternalBroker) Invoke(ctx context.Context, record nativeextensions.Record, userID, environmentID, stackID int) (topology.Graph, error) {
	return b.invoke(ctx, record, userID, environmentID, stackID, false)
}
func (b *InternalBroker) InvokeTraffic(ctx context.Context, record nativeextensions.Record, userID, environmentID, stackID int) (topology.Graph, error) {
	return b.invoke(ctx, record, userID, environmentID, stackID, true)
}
func (b *InternalBroker) invoke(ctx context.Context, record nativeextensions.Record, userID, environmentID, stackID int, traffic bool) (topology.Graph, error) {
	result := topology.Graph{Networks: []topology.Network{}, Workloads: []topology.Workload{}}
	if record.Manifest.Validate() != nil {
		return result, errors.New("invalid extension identity")
	}
	lease, err := b.leases.sign(record.Manifest.ID, record.Manifest.PackageDigest, userID, environmentID, stackID)
	if err != nil {
		return result, err
	}
	certificate, err := b.certificate(record.Manifest.ID, record.Manifest.PackageDigest, false)
	if err != nil {
		return result, err
	}
	connection, err := grpc.NewClient("passthrough:///extensions.internal", grpc.WithContextDialer(func(ctx context.Context, _ string) (net.Conn, error) { return b.listener.DialContext(ctx) }), grpc.WithTransportCredentials(credentials.NewTLS(&tls.Config{MinVersion: tls.VersionTLS13, ServerName: "extensions.internal", RootCAs: b.pool, Certificates: []tls.Certificate{certificate}})), grpc.WithDefaultCallOptions(grpc.MaxCallRecvMsgSize(256*1024)))
	if err != nil {
		return result, err
	}
	defer connection.Close()
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	ctx = metadata.AppendToOutgoingContext(ctx, leaseHeader, lease)
	client := v1.NewExtensionGatewayClient(connection)
	read := client.GetStackNetwork
	if traffic {
		read = client.GetStackTraffic
	}
	response, err := read(ctx, &v1.GetStackNetworkRequest{EnvironmentId: int64(environmentID), StackId: int64(stackID)})
	if err != nil {
		return result, err
	}
	result.EnvironmentID = int(response.EnvironmentId)
	result.StackID = int(response.StackId)
	result.Name = response.Name
	for _, network := range response.Networks {
		result.Networks = append(result.Networks, topology.Network{ID: network.Id, Name: network.Name, Driver: network.Driver, Scope: network.Scope, Internal: network.Internal})
	}
	for _, workload := range response.Workloads {
		item := topology.Workload{ID: workload.Id, Name: workload.Name, Kind: workload.Kind, State: workload.State, Networks: []topology.Attachment{}}
		for _, network := range workload.Networks {
			item.Networks = append(item.Networks, topology.Attachment{NetworkID: network.NetworkId})
		}
		result.Workloads = append(result.Workloads, item)
	}
	if response.Traffic != nil {
		bytes, err := (protojson.MarshalOptions{EmitUnpopulated: true}).Marshal(response.Traffic)
		if err != nil {
			return result, err
		}
		result.Traffic = &topology.TrafficSnapshot{}
		if err = json.Unmarshal(bytes, result.Traffic); err != nil {
			return result, err
		}
	}
	return result, nil
}
