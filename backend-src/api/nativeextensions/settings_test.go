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

func TestSettingsSchema(t *testing.T) {
	m := Manifest{Settings: &SettingsSchema{Fields: map[string]SettingField{
		"token":   {Type: "string", Secret: true, Required: true},
		"enabled": {Type: "boolean"},
		"retries": {Type: "integer", Enum: []string{"0", "3"}},
	}}}
	require.NoError(t, m.Settings.Validate())
	require.NoError(t, ValidateSettingsFor(m, map[string]string{"enabled": "false", "retries": "3"}, map[string]string{"token": "private"}))
	for _, tc := range []struct{ values, secrets map[string]string }{
		{map[string]string{"token": "private"}, nil},
		{nil, nil},
		{nil, map[string]string{"token": ""}},
		{map[string]string{"enabled": "yes"}, map[string]string{"token": "private"}},
		{map[string]string{"retries": "03"}, map[string]string{"token": "private"}},
		{map[string]string{"retries": "4"}, map[string]string{"token": "private"}},
		{map[string]string{"unknown": "private"}, map[string]string{"token": "private"}},
		{nil, map[string]string{"token": "private", "enabled": "false"}},
	} {
		err := ValidateSettingsFor(m, tc.values, tc.secrets)
		require.Error(t, err)
		require.NotContains(t, err.Error(), "private")
	}
	for _, field := range []SettingField{
		{Type: "number"}, {Type: "boolean", Secret: true}, {Type: "string", Secret: true, Enum: []string{"private"}},
		{Type: "integer", Enum: []string{"9223372036854775808"}}, {Type: "integer", Enum: []string{"-0"}},
		{Type: "boolean", Enum: []string{"1"}}, {Type: "string", Enum: []string{"same", "same"}},
	} {
		require.Error(t, (&SettingsSchema{Fields: map[string]SettingField{"field": field}}).Validate())
	}
	require.Error(t, (&SettingsSchema{}).Validate())
	require.NoError(t, (*SettingsSchema)(nil).Validate())
	require.NoError(t, ValidateSettingsFor(Manifest{}, map[string]string{"legacy": "unchanged"}, nil))
}
