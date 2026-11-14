package delivery

import (
	"encoding/json"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestSnapshotScopeRedactionAndRevision(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	src := &portainer.Source{Name: "deploy", Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "https://user:private@example.test/repo", Authentication: &gittypes.GitAuthentication{Password: "private"}}}
	require.NoError(t, store.Source().Create(source.InsecureNewAdminContext(), src))
	stack := &portainer.Stack{ID: 2, Name: "shop", EndpointID: 1, Type: portainer.DockerComposeStack, Env: []portainer.Pair{{Name: "PASSWORD", Value: "private"}}, CurrentDeploymentInfo: &portainer.StackDeploymentInfo{ConfigHash: "abc"}}
	wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{StackID: 2, Files: []portainer.ArtifactFile{{SourceID: src.ID, Ref: "main", Path: "compose.yml", Hash: "abc"}}}}}
	require.NoError(t, store.Workflow().Create(wf))
	stack.WorkflowID = wf.ID
	require.NoError(t, store.Stack().Create(stack))
	got, err := Read(t.Context(), store, 1, 2)
	require.NoError(t, err)
	require.Equal(t, "synced", got.SyncStatus)
	require.Len(t, got.Sources, 1)
	encoded, err := json.Marshal(got)
	require.NoError(t, err)
	require.NotContains(t, string(encoded), "private")
	require.NotContains(t, string(encoded), "PASSWORD")
	require.NotContains(t, string(encoded), "example.test")
	before := got.Version
	again, err := Read(t.Context(), store, 1, 2)
	require.NoError(t, err)
	require.Equal(t, before, again.Version)
	stack.Env[0].Value = "changed"
	require.NoError(t, store.Stack().Update(stack.ID, stack))
	changed, err := Read(t.Context(), store, 1, 2)
	require.NoError(t, err)
	require.NotEqual(t, before, changed.Version)
	src.Git.URL = "https://different.example/repo"
	require.NoError(t, store.Source().Update(source.InsecureNewAdminContext(), src.ID, src))
	sourceChanged, err := Read(t.Context(), store, 1, 2)
	require.NoError(t, err)
	require.NotEqual(t, changed.Version, sourceChanged.Version)
	_, err = Read(t.Context(), store, 9, 2)
	require.Error(t, err)
}
func TestUpdateLabels(t *testing.T) {
	for _, tc := range []struct {
		labels map[string]string
		want   string
	}{
		{nil, "manual"}, {map[string]string{"com.centurylinklabs.watchtower.enable": "false"}, "excluded"}, {map[string]string{"com.centurylinklabs.watchtower.monitor-only": "true"}, "monitor-only"}, {map[string]string{"com.getarcaneapp.arcane.update-check": "false"}, "excluded"},
	} {
		require.Equal(t, tc.want, UpdatePolicy(tc.labels))
	}
}
