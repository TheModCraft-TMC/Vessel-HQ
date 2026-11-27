package stacks

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/require"
)

func TestProjectExportUsesStackReadPermissionsAndRejectsIncompleteProjects(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, false, true)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)
	directory := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(directory, "compose.yaml"), []byte("services: {}"), 0o600))
	stack := &portainer.Stack{ID: 1, Name: "export", Type: portainer.DockerComposeStack, EndpointID: endpoint.ID, ProjectPath: directory, EntryPoint: "compose.yaml"}
	require.NoError(t, store.Stack().Create(stack))
	handler := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	handler.DataStore = store
	request := func() *http.Request {
		return mockCreateStackRequestWithSecurityContext(http.MethodGet, "/stacks/1/file?format=project", nil)
	}

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, request())
	require.Equal(t, http.StatusOK, rr.Code)
	require.Equal(t, "application/zip", rr.Header().Get("Content-Type"))
	require.Equal(t, "no-store", rr.Header().Get("Cache-Control"))
	archive, err := zip.NewReader(bytes.NewReader(rr.Body.Bytes()), int64(rr.Body.Len()))
	require.NoError(t, err)
	require.Len(t, archive.File, 2)

	user := &portainer.User{ID: 2, Username: "unrelated", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(user))
	req := request()
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{User: user, UserID: user.ID}))
	rr = httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusForbidden, rr.Code)
	require.NotEqual(t, "application/zip", rr.Header().Get("Content-Type"))

	stack.AdditionalFiles = []string{"missing.yaml"}
	require.NoError(t, store.Stack().Update(stack.ID, stack))
	rr = httptest.NewRecorder()
	handler.ServeHTTP(rr, request())
	require.Equal(t, http.StatusConflict, rr.Code)
	require.NotEqual(t, "application/zip", rr.Header().Get("Content-Type"))
}

func TestExternalProjectEditRejectsStaleDeploymentBeforeMutation(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, false, true)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)
	directory := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(directory, "compose.yaml"), []byte("services: {}"), 0o600))
	require.NoError(t, os.WriteFile(filepath.Join(directory, "override.yaml"), []byte("name: before"), 0o600))
	stack := &portainer.Stack{ID: 1, Name: "revision", Type: portainer.DockerComposeStack, EndpointID: endpoint.ID, ProjectPath: directory, EntryPoint: "compose.yaml", AdditionalFiles: []string{"override.yaml"}}
	require.NoError(t, store.Stack().Create(stack))
	handler := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	handler.DataStore = store
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, mockCreateStackRequestWithSecurityContext(http.MethodGet, "/stacks/1/file", nil))
	require.Equal(t, http.StatusOK, rr.Code)
	var original stackFileResponse
	require.NoError(t, json.Unmarshal(rr.Body.Bytes(), &original))
	require.NotEmpty(t, original.Revision)
	require.Equal(t, `"`+original.Revision+`"`, rr.Header().Get("ETag"))
	require.NoError(t, os.WriteFile(filepath.Join(directory, "override.yaml"), []byte("name: external"), 0o600))
	req := mockCreateStackRequestWithSecurityContext(http.MethodPut, "/stacks/1?endpointId=1", strings.NewReader(`{"StackFileContent":"services: {overwrite: {image: alpine}}"}`))
	req.Header.Set("If-Match", `"`+original.Revision+`"`)
	rr = httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusConflict, rr.Code)
	primary, err := os.ReadFile(filepath.Join(directory, "compose.yaml"))
	require.NoError(t, err)
	require.Equal(t, "services: {}", string(primary))
	override, err := os.ReadFile(filepath.Join(directory, "override.yaml"))
	require.NoError(t, err)
	require.Equal(t, "name: external", string(override))
	saved, err := store.Stack().Read(stack.ID)
	require.NoError(t, err)
	require.Equal(t, stack.Status, saved.Status)
}
