package nativeextension

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/nativeextensions"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "native_extensions"

// Service persists native extension registrations independently of legacy extensions.
type Service struct {
	dataservices.BaseDataService[nativeextensions.Record, int]
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[nativeextensions.Record, int]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		BaseDataServiceTx: dataservices.BaseDataServiceTx[nativeextensions.Record, int]{
			Bucket:     BucketName,
			Connection: service.Connection,
			Tx:         tx,
		},
	}
}

// Create persists a new native extension registration.
func (service *Service) Create(record *nativeextensions.Record) error {
	return service.Connection.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			record.ID = int(id)
			return int(record.ID), record
		},
	)
}
