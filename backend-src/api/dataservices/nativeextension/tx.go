package nativeextension

import (
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/nativeextensions"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[nativeextensions.Record, int]
}

// Create persists a new native extension registration.
func (service ServiceTx) Create(record *nativeextensions.Record) error {
	return service.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			record.ID = int(id)
			return int(record.ID), record
		},
	)
}
