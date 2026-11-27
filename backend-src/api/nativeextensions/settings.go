package nativeextensions

import (
	"errors"
	"regexp"
	"slices"
	"strconv"
	"unicode/utf8"
)

// Settings belong to one registration. Secrets are write-only through HTTP;
// they must never be included in registration metadata, audits or diagnostics.
// Datastore backups need the same protection as other server-side credentials.
type Settings struct {
	Version int               `json:"version"`
	Values  map[string]string `json:"values"`
	Secrets map[string]string `json:"secrets"`
}

var settingKey = regexp.MustCompile(`^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$`)

// SettingsSchema is a bounded field schema, not arbitrary JSON Schema. Values
// remain strings on the wire; secret fields never have defaults or enum values.
type SettingsSchema struct {
	Fields map[string]SettingField `json:"fields"`
}

type SettingField struct {
	Type     string   `json:"type"`
	Required bool     `json:"required,omitempty"`
	Secret   bool     `json:"secret,omitempty"`
	Enum     []string `json:"enum,omitempty"`
}

func (s *SettingsSchema) Validate() error {
	if s == nil {
		return nil
	}
	if len(s.Fields) == 0 || len(s.Fields) > 64 {
		return errors.New("settings schema requires 1 to 64 fields")
	}
	size := 0
	for key, field := range s.Fields {
		if !settingKey.MatchString(key) || (field.Type != "string" && field.Type != "boolean" && field.Type != "integer") || (field.Secret && (field.Type != "string" || len(field.Enum) != 0)) || len(field.Enum) > 64 {
			return errors.New("invalid settings schema field")
		}
		size += len(key)
		seen := map[string]bool{}
		for _, value := range field.Enum {
			if seen[value] || !validSettingValue(field.Type, value) {
				return errors.New("invalid settings schema enum")
			}
			seen[value] = true
			size += len(value)
		}
	}
	if size > 65536 {
		return errors.New("settings schema exceeds 64 KiB")
	}
	return nil
}

func validSettingValue(kind, value string) bool {
	if len(value) > 16384 || !utf8.ValidString(value) {
		return false
	}
	switch kind {
	case "boolean":
		return value == "true" || value == "false"
	case "integer":
		n, err := strconv.ParseInt(value, 10, 64)
		return err == nil && strconv.FormatInt(n, 10) == value
	default:
		return kind == "string"
	}
}

// ValidateSettingsFor rejects undeclared fields and enforces secret placement.
// Errors exclude caller-controlled names and values, including schema enums.
func ValidateSettingsFor(m Manifest, values, secrets map[string]string) error {
	if err := ValidateSettings(values, secrets); err != nil {
		return err
	}
	if err := m.Settings.Validate(); err != nil {
		return err
	}
	if m.Settings == nil {
		return nil
	}
	for key, field := range m.Settings.Fields {
		entries := values
		if field.Secret {
			entries = secrets
		}
		value, exists := entries[key]
		if field.Required && (!exists || value == "") {
			return errors.New("required setting missing")
		}
		if exists && (!validSettingValue(field.Type, value) || (len(field.Enum) > 0 && !slices.Contains(field.Enum, value))) {
			return errors.New("setting does not match its schema")
		}
	}
	for key := range values {
		if field, exists := m.Settings.Fields[key]; !exists || field.Secret {
			return errors.New("undeclared or misplaced setting")
		}
	}
	for key := range secrets {
		if field, exists := m.Settings.Fields[key]; !exists || !field.Secret {
			return errors.New("undeclared or misplaced setting")
		}
	}
	return nil
}

// ValidateSettings bounds the entire stored configuration, including retained
// secrets. Errors deliberately exclude keys and values supplied by the caller.
func ValidateSettings(values, secrets map[string]string) error {
	if len(values)+len(secrets) > 64 {
		return errors.New("settings allow at most 64 entries")
	}
	size := 0
	for _, entries := range []map[string]string{values, secrets} {
		for key, value := range entries {
			if !settingKey.MatchString(key) || len(value) > 16384 || !utf8.ValidString(value) {
				return errors.New("invalid settings key or value (maximum 16 KiB UTF-8 per value)")
			}
			size += len(key) + len(value)
		}
	}
	for key := range secrets {
		if _, exists := values[key]; exists {
			return errors.New("secret settings cannot also be public values")
		}
	}
	if size > 65536 {
		return errors.New("settings exceed the 64 KiB total limit")
	}
	return nil
}
