package gitops

import (
	"context"
	"errors"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/stretchr/testify/require"
)

type previewFiles struct {
	portainer.FileService
	root string
}

func (f previewFiles) GetTemporaryPath() (string, error) { return f.root, nil }
func (f previewFiles) RemoveDirectory(path string) error { return os.RemoveAll(path) }

type failingPreviewGit struct {
	portainer.GitService
	t        *testing.T
	expected context.Context
}

func (g failingPreviewGit) CloneRepository(ctx context.Context, dst, _, _, _, _ string, _ bool) error {
	require.Equal(g.t, g.expected, ctx)
	require.NoError(g.t, os.WriteFile(filepath.Join(dst, "partial"), []byte("partial"), 0600))
	return errors.New("interrupted download")
}

func TestFailedPreviewRemovesPartialCloneAndPropagatesContext(t *testing.T) {
	root := filepath.Join(t.TempDir(), "preview")
	require.NoError(t, os.Mkdir(root, 0700))
	request := httptest.NewRequest("POST", "/gitops/repo/file/preview", strings.NewReader(`{"repository":"https://example.com/repo","targetFile":"compose.yml"}`))
	request = request.WithContext(security.StoreRestrictedRequestContext(request, &security.RestrictedRequestContext{IsAdmin: true, User: &portainer.User{ID: 1, Role: portainer.AdministratorRole}}))
	handler := &Handler{fileService: previewFiles{root: root}, gitService: failingPreviewGit{t: t, expected: request.Context()}}
	require.NotNil(t, handler.gitOperationRepoFilePreview(httptest.NewRecorder(), request))
	require.NoDirExists(t, root)
}
