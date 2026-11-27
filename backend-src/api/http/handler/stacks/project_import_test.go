package stacks

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"testing"

	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/stacks/projectfiles"
	"github.com/stretchr/testify/require"
)

func TestProjectPreviewBindsDeploymentToTheReviewedArchive(t *testing.T) {
	directory := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(directory, "compose.yaml"), []byte("services: {app: {image: busybox:1.37.0}}"), 0o600))
	archive, err := projectfiles.Export(context.Background(), directory, "compose.yaml", nil, nil)
	require.NoError(t, err)
	var body bytes.Buffer
	form := multipart.NewWriter(&body)
	file, err := form.CreateFormFile("file", "project.zip")
	require.NoError(t, err)
	_, err = file.Write(archive)
	require.NoError(t, err)
	require.NoError(t, form.Close())
	req := httptest.NewRequest(http.MethodPost, "/stacks/project/inspect", &body)
	req.Header.Set("Content-Type", form.FormDataContentType())
	rr := httptest.NewRecorder()
	// No datastore, file service or engine: preview uses only uploaded bytes.
	handler := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusOK, rr.Code)
	require.Equal(t, "no-store", rr.Header().Get("Cache-Control"))
	var preview projectArchiveResponse
	require.NoError(t, json.Unmarshal(rr.Body.Bytes(), &preview))
	require.Equal(t, []string{"compose.yaml"}, preview.Manifest.ComposeFiles)
	require.Contains(t, preview.Files["compose.yaml"], "busybox:1.37.0")
	require.NotEmpty(t, preview.ArchiveDigest)

	upload := httptest.NewRequest(http.MethodPost, "/", nil)
	upload.Form = url.Values{}
	_, _, err = decodeProjectUpload(upload, archive, "project.zip")
	require.ErrorContains(t, err, "confirm")
	upload.Form.Set("ProjectDigest", "sha256:substituted")
	_, _, err = decodeProjectUpload(upload, archive, "project.zip")
	require.Error(t, err)
	upload.Form.Set("ProjectDigest", preview.ArchiveDigest)
	content, imported, err := decodeProjectUpload(upload, archive, "project.zip")
	require.NoError(t, err)
	require.Equal(t, archive, imported)
	require.Equal(t, preview.Files["compose.yaml"], string(content))
}
