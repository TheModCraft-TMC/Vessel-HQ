package gitops

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	sourceDS "github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/require"
)

type browseGit struct {
	portainer.GitService
	t     *testing.T
	calls int
	fail  bool
}

func (g *browseGit) check(ctx context.Context, url, user, password string) {
	g.calls++
	require.Equal(g.t, "https://github.com/example/private", url)
	require.Equal(g.t, "stored-user", user)
	require.Equal(g.t, "stored-credential", password)
	_, ok := ctx.Deadline()
	require.True(g.t, ok)
}
func (g *browseGit) ListRefs(ctx context.Context, url, user, password string, force, tls bool) ([]string, error) {
	g.check(ctx, url, user, password)
	if g.fail {
		return nil, fmt.Errorf("stored-credential must never be reflected")
	}
	return []string{"refs/heads/main", "refs/heads/develop", "refs/heads/main"}, nil
}
func (g *browseGit) ListFiles(ctx context.Context, url, ref, user, password string, dirs, force bool, ext []string, tls bool) ([]string, error) {
	g.check(ctx, url, user, password)
	require.Equal(g.t, "refs/heads/main", ref)
	if dirs {
		require.Empty(g.t, ext)
	} else {
		require.Contains(g.t, ext, ".yml")
	}
	return []string{"other.yml", "deploy/compose.yml", "../outside.yml", "/absolute.yml"}, nil
}
func TestGitBrowseRoutesUseAuthorizedStoredSource(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, false, false)
	src := &portainer.Source{Type: portainer.SourceTypeGit, Name: "private", AdministratorsOnly: true, Git: &gittypes.GitSource{URL: "https://github.com/example/private", Authentication: &gittypes.GitAuthentication{Username: "stored-user", Password: "stored-credential"}}}
	require.NoError(t, store.Source().Create(sourceDS.InsecureNewAdminContext(), src))
	git := &browseGit{t: t}
	h := NewHandler(testhelpers.NewTestRequestBouncer(), store, git, nil, nil, nil)
	call := func(route, body string, role portainer.UserRole) *httptest.ResponseRecorder {
		r := httptest.NewRequest(http.MethodPost, route, strings.NewReader(body))
		r = r.WithContext(security.StoreRestrictedRequestContext(r, &security.RestrictedRequestContext{User: &portainer.User{ID: 7, Role: role}, IsAdmin: role == portainer.AdministratorRole}))
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		return w
	}
	body := fmt.Sprintf(`{"sourceId":%d}`, src.ID)
	w := call("/gitops/repo/refs", body, portainer.AdministratorRole)
	require.Equal(t, 200, w.Code)
	require.JSONEq(t, `["refs/heads/develop","refs/heads/main"]`, w.Body.String())
	require.Equal(t, "no-store", w.Header().Get("Cache-Control"))
	w = call("/gitops/repo/files/search", fmt.Sprintf(`{"sourceId":%d,"reference":"refs/heads/main","keyword":"compose"}`, src.ID), portainer.AdministratorRole)
	require.Equal(t, 200, w.Code)
	require.JSONEq(t, `["deploy/compose.yml"]`, w.Body.String())
	previous := git.calls
	w = call("/gitops/repo/refs", body, portainer.StandardUserRole)
	require.Equal(t, 403, w.Code)
	require.Equal(t, previous, git.calls)
	for _, invalid := range []string{`{"sourceId":0}`, fmt.Sprintf(`{"sourceId":%d,"repository":"https://attacker.invalid"}`, src.ID), body + ` {}`} {
		w = call("/gitops/repo/refs", invalid, portainer.AdministratorRole)
		require.Equal(t, 400, w.Code)
		require.Equal(t, previous, git.calls)
	}
	git.fail = true
	w = call("/gitops/repo/refs", body, portainer.AdministratorRole)
	require.Equal(t, 502, w.Code)
	require.NotContains(t, w.Body.String(), "stored-credential")
}
func TestBrowseResultsBoundedAndCacheUnchanged(t *testing.T) {
	entries := []string{"z.yml", "a.yml", "a.yml", "../outside", "/absolute", "line\nbreak"}
	before := append([]string(nil), entries...)
	require.Equal(t, []string{"a.yml", "z.yml"}, boundedBrowseResults(entries, "", true))
	require.Equal(t, before, entries)
	many := make([]string, 1200)
	for i := range many {
		many[i] = fmt.Sprintf("file-%04d.yml", i)
	}
	require.Len(t, boundedBrowseResults(many, "", true), 1000)
}
