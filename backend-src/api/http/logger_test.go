package http

import (
	"bytes"
	"testing"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/require"
)

func TestLogger(t *testing.T) {
	// This test replaces the process-wide logger, so it must not run in parallel.
	original := log.Logger
	t.Cleanup(func() { log.Logger = original })
	msg := "Testing HTTP logger"
	buf := &bytes.Buffer{}

	log.Logger = zerolog.New(buf)

	NewHTTPLogger().Print(msg)

	require.Contains(t, buf.String(), msg)
}
