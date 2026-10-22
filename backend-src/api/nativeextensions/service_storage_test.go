package nativeextensions

import (
	"strings"
	"testing"
)

func TestMachineStorageGrantsAreExplicitGlobalAndIndependent(t *testing.T) {
	permissions := []Permission{{Capability: "storage.service.read"}, {Capability: "storage.service.write"}}
	record := Record{Revision: 1, Status: "approved", Manifest: Manifest{ID: "org.example.notes", Name: "Notes", Version: "1", APIVersion: "v1", PackageDigest: "sha256:" + strings.Repeat("a", 64), Permissions: permissions}, Grants: permissions}
	approval := Approval{Revision: 1, Grants: permissions}
	if err := approval.ValidateFor(record); err != nil {
		t.Fatal(err)
	}
	for _, capability := range []string{"storage.service.read", "storage.service.write"} {
		if err := Authorize(record, capability, 0); err != nil {
			t.Fatal(err)
		}
		if err := Authorize(record, capability, 1); err == nil {
			t.Fatal("machine storage accepted environment scope")
		}
	}
	record.Grants = permissions[:1]
	if err := Authorize(record, "storage.service.write", 0); err == nil {
		t.Fatal("read implied write")
	}
	if err := Authorize(record, "ui.native", 0); err == nil {
		t.Fatal("machine storage implied UI trust")
	}
	for _, permission := range []Permission{{Capability: "storage.service.read", EnvironmentIDs: []int{1}}, {Capability: "storage.service.write", StackIDs: []int{1}}} {
		record.Manifest.Permissions = []Permission{permission}
		if err := record.Manifest.Validate(); err == nil {
			t.Fatal("scoped machine storage accepted")
		}
	}
}
