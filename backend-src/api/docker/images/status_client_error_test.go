package images

import (
	"context"
	"errors"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"

	dockerclient "github.com/moby/moby/client"
	"github.com/stretchr/testify/require"
)

type unavailableClientFactory struct {
	err error
}

func (f unavailableClientFactory) CreateClientWithContext(context.Context, *portainer.Endpoint, string, *time.Duration) (*dockerclient.Client, error) {
	return nil, f.err
}

func TestImageStatusPreservesClientCreationErrors(t *testing.T) {
	t.Parallel()
	for _, wantErr := range []error{errors.New("engine unavailable"), context.Canceled, context.DeadlineExceeded} {
		t.Run(wantErr.Error(), func(t *testing.T) {
			t.Parallel()
			c := NewClientWithRegistry(nil, unavailableClientFactory{err: wantErr})
			status, err := c.ContainerImageStatus(t.Context(), "container", &portainer.Endpoint{}, "")
			require.Equal(t, Error, status)
			require.ErrorIs(t, err, wantErr)
			status, err = c.ServiceImageStatus(t.Context(), "service", &portainer.Endpoint{})
			require.Equal(t, Error, status)
			require.ErrorIs(t, err, wantErr)
		})
	}
}
