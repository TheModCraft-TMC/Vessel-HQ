package stackbuilders

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/stacks/projectfiles"
	"github.com/portainer/portainer/pkg/libstack"
	"github.com/portainer/portainer/pkg/libstack/compose"
	"github.com/stretchr/testify/require"
	"go.yaml.in/yaml/v3"
)

func TestStorePortableProjectPreservesNestedFilesAndOverrideOrder(t *testing.T) {
	source := t.TempDir()
	files := map[string]string{"compose.yaml": "services: {app: {image: busybox:1.37.0}}", "配置/z.yaml": "services: {app: {command: echo first}}", "配置/a.yaml": "services: {app: {command: echo final}}"}
	for name, content := range files {
		require.NoError(t, os.MkdirAll(filepath.Dir(filepath.Join(source, name)), 0o700))
		require.NoError(t, os.WriteFile(filepath.Join(source, name), []byte(content), 0o600))
	}
	archive, err := projectfiles.Export(context.Background(), source, "compose.yaml", []string{"配置/z.yaml", "配置/a.yaml"}, nil)
	require.NoError(t, err)
	service, err := filesystem.NewService(t.TempDir(), "")
	require.NoError(t, err)
	builder := CreateStackBuilder(nil, service, nil)
	builder.stack = &portainer.Stack{ID: 1}
	require.NoError(t, builder.storeProject(context.Background(), &StackPayload{ProjectArchive: archive}))
	require.Equal(t, "compose.yaml", builder.stack.EntryPoint)
	require.Equal(t, []string{"配置/z.yaml", "配置/a.yaml"}, builder.stack.AdditionalFiles)
	for name, content := range files {
		actual, err := os.ReadFile(filepath.Join(builder.stack.ProjectPath, name))
		require.NoError(t, err)
		require.Equal(t, content, string(actual))
	}
	paths := []string{filepath.Join(builder.stack.ProjectPath, builder.stack.EntryPoint)}
	for _, name := range builder.stack.AdditionalFiles {
		paths = append(paths, filepath.Join(builder.stack.ProjectPath, name))
	}
	config, err := compose.NewComposeDeployer().Config(context.Background(), paths, libstack.Options{ProjectName: "portable", Host: "tcp://127.0.0.1:1"})
	require.NoError(t, err, "configuration must validate without an engine")
	var result struct {
		Services map[string]struct {
			Command []string `yaml:"command"`
		} `yaml:"services"`
	}
	require.NoError(t, yaml.Unmarshal(config, &result))
	require.Equal(t, []string{"echo", "final"}, result.Services["app"].Command)
}
