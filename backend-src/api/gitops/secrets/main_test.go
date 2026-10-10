package secrets

import (
	"os"
	"testing"

	"github.com/portainer/portainer/pkg/fips"
)

func TestMain(m *testing.M) {
	fips.InitFIPS(false)
	os.Exit(m.Run())
}
