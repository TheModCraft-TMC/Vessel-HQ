package stacks

import (
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/portainer/portainer/api/stacks/projectfiles"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type projectArchiveResponse struct {
	Manifest      projectfiles.Manifest `json:"manifest"`
	ArchiveDigest string                `json:"archiveDigest"`
	Files         map[string]string     `json:"files"`
}

// @id StackProjectInspect
// @summary Validate and preview a portable Compose project without deployment
// @description Checks bounded archive paths, checksums, file order and YAML syntax. Does not resolve interpolation or referenced host files, contact an engine, or certify external requirements.
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @accept multipart/form-data
// @produce json
// @param file formData file true "Portable project ZIP archive"
// @success 200 {object} projectArchiveResponse
// @failure 400 "Invalid project archive"
// @router /stacks/project/inspect [post]
func (handler *Handler) inspectProject(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	r.Body = http.MaxBytesReader(w, r.Body, projectfiles.MaxArchiveBytes+(1<<20))
	file, _, err := r.FormFile("file")
	if err != nil {
		return httperror.BadRequest("Project ZIP file is required", errors.New("invalid archive upload"))
	}
	defer file.Close()
	if r.MultipartForm != nil {
		defer r.MultipartForm.RemoveAll()
	}
	data, err := io.ReadAll(io.LimitReader(file, projectfiles.MaxArchiveBytes+1))
	if len(data) > projectfiles.MaxArchiveBytes {
		return httperror.BadRequest("Project archive exceeds upload limit", errors.New("archive too large"))
	}
	if err != nil {
		return httperror.BadRequest("Unable to read bounded project archive", errors.New("invalid archive body"))
	}
	project, err := projectfiles.Import(r.Context(), data)
	if err != nil {
		return httperror.BadRequest("Invalid portable Compose project", err)
	}
	w.Header().Set("Cache-Control", "no-store")
	manifest := project.Manifest()
	files := make(map[string]string, len(manifest.ComposeFiles))
	for _, name := range manifest.ComposeFiles {
		files[name] = string(project.File(name))
	}
	return response.JSON(w, projectArchiveResponse{Manifest: manifest, ArchiveDigest: project.ArchiveDigest, Files: files})
}

func limitProjectUpload(r *http.Request) {
	r.Body = http.MaxBytesReader(nil, r.Body, projectfiles.MaxArchiveBytes+(1<<20))
}

func retrieveProjectUploadFile(r *http.Request) ([]byte, string, error) {
	file, header, err := r.FormFile("file")
	if err != nil {
		return nil, "", err
	}
	defer file.Close()
	if header.Size > projectfiles.MaxArchiveBytes {
		return nil, "", errors.New("stack upload exceeds size limit")
	}
	data, err := io.ReadAll(io.LimitReader(file, projectfiles.MaxArchiveBytes+1))
	if err != nil {
		return nil, "", err
	}
	if len(data) > projectfiles.MaxArchiveBytes {
		return nil, "", errors.New("stack upload exceeds size limit")
	}
	return data, header.Filename, nil
}

func decodeProjectUpload(r *http.Request, data []byte, name string) (content, archive []byte, err error) {
	if !strings.HasSuffix(strings.ToLower(name), ".zip") {
		return data, nil, nil
	}
	project, err := projectfiles.Import(r.Context(), data)
	if err != nil {
		return nil, nil, err
	}
	if r.FormValue("ProjectDigest") != project.ArchiveDigest {
		return nil, nil, errors.New("preview this exact project archive and confirm its requirements before deploying")
	}
	return project.File(project.Manifest().EntryPoint), data, nil
}
