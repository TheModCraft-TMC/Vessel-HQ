package nativeextensions

import (
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSettingsValidation(t *testing.T) {
	require.NoError(t, ValidateSettings(map[string]string{"display.theme": "dark"}, map[string]string{"api-token": "private"}))
	for _, tc := range []struct {
		name            string
		values, secrets map[string]string
	}{
		{"path", map[string]string{"../token": "value"}, nil},
		{"oversized key", map[string]string{strings.Repeat("x", 65): "value"}, nil},
		{"oversized value", nil, map[string]string{"token": strings.Repeat("x", 16385)}},
		{"invalid UTF8", map[string]string{"name": string([]byte{0xff})}, nil},
		{"public secret", map[string]string{"token": "value"}, map[string]string{"token": "private"}},
		{"total limit", map[string]string{"one": strings.Repeat("x", 16384), "two": strings.Repeat("x", 16384), "three": strings.Repeat("x", 16384)}, map[string]string{"four": strings.Repeat("x", 16384)}},
	} {
		t.Run(tc.name, func(t *testing.T) { require.Error(t, ValidateSettings(tc.values, tc.secrets)) })
	}
	values := map[string]string{}
	for i := range 65 {
		values[fmt.Sprintf("key%d", i)] = ""
	}
	require.Error(t, ValidateSettings(values, nil))
}
