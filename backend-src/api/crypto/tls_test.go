package crypto

import (
	"crypto/tls"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/require"
)

func TestCreateTLSConfiguration(t *testing.T) {
	t.Parallel()
	// InsecureSkipVerify = false
	config := CreateTLSConfiguration(false)
	require.Equal(t, config.MinVersion, uint16(tls.VersionTLS12)) //nolint:forbidigo
	require.False(t, config.InsecureSkipVerify)                   //nolint:forbidigo

	// InsecureSkipVerify = true
	config = CreateTLSConfiguration(true)
	require.Equal(t, config.MinVersion, uint16(tls.VersionTLS12)) //nolint:forbidigo
	require.True(t, config.InsecureSkipVerify)                    //nolint:forbidigo
}

func TestCreateTLSConfigurationFIPS(t *testing.T) {
	t.Parallel()
	fips := true

	fipsCipherSuites := []uint16{
		tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
		tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
		tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
		tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
	}

	fipsCurvePreferences := []tls.CurveID{tls.CurveP256, tls.CurveP384, tls.CurveP521}

	config := createTLSConfiguration(fips, false)
	require.Equal(t, config.MinVersion, uint16(tls.VersionTLS12))   //nolint:forbidigo
	require.Equal(t, config.MaxVersion, uint16(tls.VersionTLS13))   //nolint:forbidigo
	require.Equal(t, config.CipherSuites, fipsCipherSuites)         //nolint:forbidigo
	require.Equal(t, config.CurvePreferences, fipsCurvePreferences) //nolint:forbidigo
	require.False(t, config.InsecureSkipVerify)                     //nolint:forbidigo
}

func TestCreateTLSConfigurationFromBytes(t *testing.T) {
	t.Parallel()
	// No TLS
	config, err := CreateTLSConfigurationFromBytes(false, nil, nil, nil, false, false)
	require.NoError(t, err)
	require.Nil(t, config)

	// Skip TLS client/server verifications
	config, err = CreateTLSConfigurationFromBytes(true, nil, nil, nil, true, true)
	require.NoError(t, err)
	require.NotNil(t, config)

	// Empty TLS
	config, err = CreateTLSConfigurationFromBytes(true, nil, nil, nil, false, false)
	require.Error(t, err)
	require.Nil(t, config)
}

func TestCreateTLSConfigurationFromDisk(t *testing.T) {
	t.Parallel()
	// No TLS
	config, err := CreateTLSConfigurationFromDisk(portainer.TLSConfiguration{})
	require.NoError(t, err)
	require.Nil(t, config)

	// Skip TLS verifications
	config, err = CreateTLSConfigurationFromDisk(portainer.TLSConfiguration{
		TLS:           true,
		TLSSkipVerify: true,
	})
	require.NoError(t, err)
	require.NotNil(t, config)
}

func TestCreateTLSConfigurationFromDiskFIPS(t *testing.T) {
	t.Parallel()
	fips := true

	// Skipping TLS verifications cannot be done in FIPS mode
	config, err := createTLSConfigurationFromDisk(fips, portainer.TLSConfiguration{
		TLS:           true,
		TLSSkipVerify: true,
	})
	require.NoError(t, err)
	require.NotNil(t, config)
	require.False(t, config.InsecureSkipVerify) //nolint:forbidigo
}

func TestTLSConfigurationOnlyAllowsForwardSecretAEAD(t *testing.T) {
	t.Parallel()
	for _, fipsEnabled := range []bool{false, true} {
		config := createTLSConfiguration(fipsEnabled, false)
		for _, suiteID := range config.CipherSuites {
			name := tls.CipherSuiteName(suiteID)
			require.Contains(t, name, "ECDHE_", "TLS 1.2 must have forward secrecy")
			require.True(t, strings.Contains(name, "GCM_") || strings.Contains(name, "CHACHA20_POLY1305_"), name)
		}
	}
}

func TestTLSConfigurationHandshake(t *testing.T) {
	t.Parallel()
	srv := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	srv.TLS = createTLSConfiguration(false, false)
	srv.StartTLS()
	defer srv.Close()

	for _, tc := range []struct {
		name      string
		version   uint16
		suite     uint16
		wantError bool
	}{
		{"TLS12_AEAD", tls.VersionTLS12, tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256, false},
		{"TLS12_CBC_rejected", tls.VersionTLS12, tls.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA, true},
		{"TLS12_static_RSA_rejected", tls.VersionTLS12, tls.TLS_RSA_WITH_AES_128_GCM_SHA256, true},
		{"TLS13_automatic_suites", tls.VersionTLS13, 0, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			// Use the test server's certificate rather than disabling verification.
			config := srv.Client().Transport.(*http.Transport).TLSClientConfig.Clone()
			config.MinVersion, config.MaxVersion = tc.version, tc.version
			if tc.suite != 0 {
				config.CipherSuites = []uint16{tc.suite}
			}
			conn, err := tls.Dial("tcp", srv.Listener.Addr().String(), config)
			if tc.wantError {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			require.NoError(t, conn.Close())
		})
	}
}
