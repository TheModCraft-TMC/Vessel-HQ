// Package nativeextensions defines the native extension management contract.
// Approval does not activate UI code or provision credentials. Machine metadata
// reads require a separate explicit service grant and authenticated gRPC identity.
package nativeextensions

import (
	"errors"
	"fmt"
	"path"
	"regexp"
	"slices"
	"strings"
)

type Permission struct {
	Capability     string `json:"capability"`
	EnvironmentIDs []int  `json:"environmentIds"`
	StackIDs       []int  `json:"stackIds,omitempty"`
}
type UISlot struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Slot  string `json:"slot"`
}
type UI struct {
	Entry string   `json:"entry"`
	Slots []UISlot `json:"slots"`
}
type Backend struct {
	Type        string            `json:"type"`
	Entrypoints map[string]string `json:"entrypoints"`
}
type Manifest struct {
	ID            string       `json:"id"`
	Name          string       `json:"name"`
	Version       string       `json:"version"`
	Description   string       `json:"description,omitempty"`
	APIVersion    string       `json:"apiVersion"`
	PackageDigest string       `json:"packageDigest"`
	Permissions   []Permission `json:"permissions"`
	UI            *UI          `json:"ui,omitempty"`
	Backend       *Backend     `json:"backend,omitempty"`
}
type Note struct {
	Text    string `json:"text"`
	Version int    `json:"version"`
}

type Record struct {
	Note               *Note        `json:"note,omitempty"`
	ID                 int          `json:"id"`
	Manifest           Manifest     `json:"manifest"`
	Revision           int          `json:"revision"`
	Status             string       `json:"status"`
	Grants             []Permission `json:"grants"`
	TrustedNativeUI    bool         `json:"trustedNativeUI"`
	ServiceReadEnabled bool         `json:"serviceReadEnabled"`
	UpdatedAt          int64        `json:"updatedAt"`
	PackageAvailable   bool         `json:"packageAvailable"`
	ArchiveDigest      string       `json:"archiveDigest,omitempty"`
}
type Approval struct {
	Revision           int          `json:"revision"`
	TrustedNativeUI    bool         `json:"trustedNativeUI"`
	ServiceReadEnabled bool         `json:"serviceReadEnabled"`
	Grants             []Permission `json:"grants"`
}

var ErrDenied = errors.New("extension capability denied")
var slug = regexp.MustCompile(`^[a-z0-9][a-z0-9.-]{1,126}[a-z0-9]$`)
var digest = regexp.MustCompile(`^sha256:[a-f0-9]{64}$`)

func (m *Manifest) Validate() error {
	if !slug.MatchString(m.ID) || strings.Contains(m.ID, "..") || strings.TrimSpace(m.Name) == "" || len(m.Name) > 128 || len(m.Version) == 0 || len(m.Version) > 64 || len(m.Description) > 4096 || m.APIVersion != "v1" || !digest.MatchString(m.PackageDigest) {
		return errors.New("invalid manifest identity, version, API version, or package digest")
	}
	if err := validatePermissions(m.Permissions); err != nil {
		return err
	}
	if m.UI != nil {
		if m.UI.Entry == "" || path.IsAbs(m.UI.Entry) || path.Clean(m.UI.Entry) != m.UI.Entry || strings.Contains(m.UI.Entry, "\\") || strings.HasPrefix(m.UI.Entry, "../") || len(m.UI.Entry) > 256 || !strings.HasPrefix(m.UI.Entry, "ui/") || !(strings.HasSuffix(m.UI.Entry, ".ts") || strings.HasSuffix(m.UI.Entry, ".tsx")) {
			return errors.New("invalid UI entry path")
		}
		if !has(m.Permissions, "ui.native", 0) {
			return errors.New("UI requires ui.native permission")
		}
		if len(m.UI.Slots) == 0 || len(m.UI.Slots) > 32 {
			return errors.New("too many UI slots")
		}
		seen := map[string]bool{}
		for _, s := range m.UI.Slots {
			if !slug.MatchString(s.ID) || seen[s.ID] || strings.TrimSpace(s.Title) == "" || len(s.Title) > 128 || (s.Slot != "extension.page" && s.Slot != "docker.stack.detail.action") {
				return errors.New("invalid UI slot")
			}
			seen[s.ID] = true
		}
	}
	if m.Backend != nil {
		if m.Backend.Type != "executable" || len(m.Backend.Entrypoints) == 0 || len(m.Backend.Entrypoints) > 2 {
			return errors.New("invalid backend executable descriptor")
		}
		for platform, entry := range m.Backend.Entrypoints {
			if (platform != "linux-amd64" && platform != "linux-arm64") || entry != "backend/"+platform+"/extension" {
				return errors.New("unsupported backend platform or entrypoint")
			}
		}
	}
	return nil
}
func validatePermissions(ps []Permission) error {
	if len(ps) > 32 {
		return errors.New("too many permissions")
	}
	seen := map[string]bool{}
	for _, p := range ps {
		if seen[p.Capability] {
			return errors.New("duplicate capability")
		}
		seen[p.Capability] = true
		if !isStackCapability(p.Capability) && p.StackIDs != nil {
			return errors.New("stack scopes are only supported for stack network and traffic reads")
		}
		if isStackCapability(p.Capability) {
			if len(p.StackIDs) == 0 || len(p.StackIDs) > 1000 {
				return errors.New("explicit stack scopes required")
			}
			ids := map[int]bool{}
			for _, id := range p.StackIDs {
				if id <= 0 || ids[id] {
					return errors.New("invalid stack scope")
				}
				ids[id] = true
			}
		}

		switch p.Capability {
		case "ui.native", "storage.read", "storage.write", "storage.service.read", "storage.service.write":
			if len(p.EnvironmentIDs) != 0 {
				return errors.New("native UI and extension storage permissions are global")
			}
		case "environments.read", "containers.read", "stacks.read", "stacks.network.read", "stacks.traffic.read":
			if len(p.EnvironmentIDs) == 0 || len(p.EnvironmentIDs) > 1000 {
				return errors.New("explicit environment scope required")
			}
			ids := map[int]bool{}
			for _, id := range p.EnvironmentIDs {
				if id <= 0 || ids[id] {
					return errors.New("invalid or duplicate environment scope")
				}
				ids[id] = true
			}
		default:
			return fmt.Errorf("unsupported capability %q", p.Capability)
		}
	}
	return nil
}
func has(ps []Permission, capability string, environmentID int) bool {
	for _, p := range ps {
		if p.Capability == capability {
			if capability == "ui.native" || capability == "storage.read" || capability == "storage.write" || capability == "storage.service.read" || capability == "storage.service.write" {
				return environmentID == 0 && len(p.EnvironmentIDs) == 0
			}
			return environmentID > 0 && slices.Contains(p.EnvironmentIDs, environmentID)
		}
	}
	return false
}
func (a *Approval) ValidateFor(r Record) error {
	if err := r.Manifest.Validate(); err != nil {
		return err
	}
	if r.Revision <= 0 {
		return errors.New("invalid manifest revision")
	}
	if a.Revision != r.Revision {
		return errors.New("manifest revision changed; review current manifest")
	}
	if err := validatePermissions(a.Grants); err != nil {
		return err
	}
	for _, p := range a.Grants {
		if p.Capability == "ui.native" || p.Capability == "storage.read" || p.Capability == "storage.write" || p.Capability == "storage.service.read" || p.Capability == "storage.service.write" {
			if (p.Capability == "ui.native" && !a.TrustedNativeUI) || !has(r.Manifest.Permissions, p.Capability, 0) {
				return ErrDenied
			}
		} else {
			if isStackCapability(p.Capability) {
				for _, id := range p.StackIDs {
					found := false
					for _, requested := range r.Manifest.Permissions {
						if requested.Capability == p.Capability && slices.Contains(requested.StackIDs, id) {
							found = true
						}
					}
					if !found {
						return ErrDenied
					}
				}
			}
			for _, id := range p.EnvironmentIDs {
				if !has(r.Manifest.Permissions, p.Capability, id) {
					return ErrDenied
				}
			}
		}
	}
	if a.ServiceReadEnabled {
		scoped := false
		for _, grant := range a.Grants {
			if grant.Capability == "environments.read" && len(grant.EnvironmentIDs) > 0 {
				scoped = true
			}
		}
		if !scoped {
			return errors.New("service metadata reads require an explicit environments.read grant")
		}
	}
	if a.TrustedNativeUI && !has(a.Grants, "ui.native", 0) {
		return errors.New("native UI trust requires its explicit grant")
	}
	return nil
}

// Authorize checks an approved grant, not runtime activation or user access.
// A runtime caller must additionally authenticate the extension and enforce the
// operation's service grant or intersect the user's resource permissions.
func Authorize(r Record, capability string, environmentID int) error {
	if isStackCapability(capability) {
		return ErrDenied
	}
	if r.Status != "approved" || r.Manifest.Validate() != nil || validatePermissions(r.Grants) != nil || !has(r.Manifest.Permissions, capability, environmentID) || !has(r.Grants, capability, environmentID) {
		return ErrDenied
	}
	if capability == "ui.native" && !r.TrustedNativeUI {
		return ErrDenied
	}
	return nil
}

// AuthorizeStackNetwork requires both explicit environment and stack resource scopes.
func AuthorizeStackNetwork(r Record, environmentID, stackID int) error {
	return AuthorizeStackCapability(r, "stacks.network.read", environmentID, stackID)
}
func isStackCapability(capability string) bool {
	return capability == "stacks.network.read" || capability == "stacks.traffic.read"
}

// AuthorizeStackCapability never permits a stack capability using an environment grant alone.
func AuthorizeStackCapability(r Record, capability string, environmentID, stackID int) error {
	if !isStackCapability(capability) {
		return ErrDenied
	}
	if r.Status != "approved" || r.Manifest.Validate() != nil || validatePermissions(r.Grants) != nil || stackID <= 0 {
		return ErrDenied
	}
	for _, permissions := range [][]Permission{r.Manifest.Permissions, r.Grants} {
		found := false
		for _, p := range permissions {
			if p.Capability == capability && slices.Contains(p.EnvironmentIDs, environmentID) && slices.Contains(p.StackIDs, stackID) {
				found = true
			}
		}
		if !found {
			return ErrDenied
		}
	}
	return nil
}
