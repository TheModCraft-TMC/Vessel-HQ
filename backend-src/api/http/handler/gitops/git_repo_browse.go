package gitops

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"path"
	"slices"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
	sourceDS "github.com/portainer/portainer/api/dataservices/source"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"
)

type repositoryBrowsePayload struct {
	SourceID  portainer.SourceID `json:"sourceId"`
	Reference string             `json:"reference,omitempty"`
	Keyword   string             `json:"keyword,omitempty"`
	DirOnly   bool               `json:"dirOnly,omitempty"`
}

func (h *Handler) browseSource(w http.ResponseWriter, r *http.Request) (*gittypes.GitSource, repositoryBrowsePayload, *httperror.HandlerError) {
	var payload repositoryBrowsePayload
	r.Body = http.MaxBytesReader(w, r.Body, 32<<10)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&payload); err != nil {
		return nil, payload, httperror.BadRequest("Invalid browse request", nil)
	}
	var extra any
	if decoder.Decode(&extra) != io.EOF || payload.SourceID <= 0 || len(payload.Reference) > 1024 || len(payload.Keyword) > 1024 || strings.ContainsAny(payload.Reference+payload.Keyword, "\x00\r\n") {
		return nil, payload, httperror.BadRequest("Invalid browse request", nil)
	}
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil || securityContext.User == nil {
		return nil, payload, httperror.Unauthorized("Authentication required", nil)
	}
	src, err := h.dataStore.Source().Read(sourceDS.NewUserContext(securityContext.User, securityContext.UserMemberships), payload.SourceID)
	if errors.Is(err, sourceDS.ErrNotEnoughPermission) {
		return nil, payload, httperror.Forbidden("Source access denied", nil)
	}
	if h.dataStore.IsErrObjectNotFound(err) {
		return nil, payload, httperror.NotFound("Source not found", nil)
	}
	if err != nil {
		return nil, payload, httperror.InternalServerError("Unable to read source", nil)
	}
	if src.Type != portainer.SourceTypeGit || src.Git == nil {
		return nil, payload, httperror.BadRequest("Git source required", nil)
	}
	if err := ssrf.CheckURL(r.Context(), src.Git.URL); err != nil {
		return nil, payload, httperror.BadRequest("Repository blocked by SSRF policy", nil)
	}
	return src.Git, payload, nil
}

func browseCredentials(config *gittypes.GitSource) (string, string) {
	if config.Authentication == nil {
		return "", ""
	}
	return config.Authentication.Username, config.Authentication.Password
}

// @id GitOperationRepoRefs
// @summary List references from an authorized stored Git source
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body repositoryBrowsePayload true "Stored source"
// @param force query bool false "Refresh cached references"
// @success 200 {array} string
// @failure 400 "Invalid request"
// @failure 403 "Source access denied"
// @failure 404 "Source not found"
// @router /gitops/repo/refs [post]
func (h *Handler) gitOperationRepoRefs(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	w.Header().Set("Cache-Control", "no-store")
	force := r.URL.Query().Get("force")
	if force != "" && force != "true" && force != "false" {
		return httperror.BadRequest("Invalid refresh flag", nil)
	}
	config, _, httpErr := h.browseSource(w, r)
	if httpErr != nil {
		return httpErr
	}
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	username, password := browseCredentials(config)
	refs, err := h.gitService.ListRefs(ctx, config.URL, username, password, force == "true", config.TLSSkipVerify)
	if err != nil {
		return httperror.NewError(http.StatusBadGateway, "Unable to list repository references", nil)
	}
	return response.JSON(w, boundedBrowseResults(refs, "", false))
}

// @id GitOperationRepoFileSearch
// @summary Search deployment paths in an authorized stored Git source
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body repositoryBrowsePayload true "Stored source, reference and path filter"
// @success 200 {array} string
// @failure 400 "Invalid request"
// @failure 403 "Source access denied"
// @failure 404 "Source not found"
// @router /gitops/repo/files/search [post]
func (h *Handler) gitOperationRepoFileSearch(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	w.Header().Set("Cache-Control", "no-store")
	config, payload, httpErr := h.browseSource(w, r)
	if httpErr != nil {
		return httpErr
	}
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	username, password := browseCredentials(config)
	extensions := []string{".yaml", ".yml", ".json", ".hcl"}
	if payload.DirOnly {
		extensions = nil
	}
	files, err := h.gitService.ListFiles(ctx, config.URL, payload.Reference, username, password, payload.DirOnly, false, extensions, config.TLSSkipVerify)
	if err != nil {
		return httperror.NewError(http.StatusBadGateway, "Unable to list repository paths", nil)
	}
	return response.JSON(w, boundedBrowseResults(files, payload.Keyword, true))
}

func boundedBrowseResults(input []string, keyword string, paths bool) []string {
	result := make([]string, 0, min(len(input), 1000))
	entries := slices.Clone(input)
	slices.Sort(entries)
	size := 0
	for _, entry := range entries {
		if len(entry) > 4096 || strings.ContainsAny(entry, "\x00\r\n") || !strings.Contains(strings.ToLower(entry), strings.ToLower(keyword)) {
			continue
		}
		if paths && (path.IsAbs(entry) || path.Clean(entry) == ".." || strings.HasPrefix(path.Clean(entry), "../") || strings.Contains(entry, "\\")) {
			continue
		}
		if len(result) > 0 && result[len(result)-1] == entry {
			continue
		}
		if len(result) == 1000 || size+len(entry) > 1<<20 {
			break
		}
		result = append(result, entry)
		size += len(entry)
	}
	return result
}
