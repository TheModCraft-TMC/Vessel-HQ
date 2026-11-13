package nativeextensions

import (
	"errors"
	"regexp"
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
