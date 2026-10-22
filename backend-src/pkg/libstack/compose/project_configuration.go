package compose

import (
	"context"
	"fmt"
	"strconv"

	"github.com/compose-spec/compose-go/v2/types"
	cmdcompose "github.com/docker/compose/v5/cmd/compose"
	"github.com/docker/compose/v5/pkg/compose"
	"github.com/portainer/portainer/pkg/libstack"
)

// configuredProject shares project loading and parallel-limit validation between
// engine operations and offline configuration. It performs no engine I/O.
func configuredProject(ctx context.Context, filePaths []string, options libstack.Options) (*types.Project, []compose.Option, error) {
	if len(filePaths) == 0 {
		return nil, nil, nil
	}
	project, err := createProject(ctx, filePaths, options)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create compose project: %w", err)
	}
	var serviceOptions []compose.Option
	if value, ok := project.Environment[cmdcompose.ComposeParallelLimit]; ok {
		parallel, err := strconv.Atoi(value)
		if err != nil {
			return nil, nil, fmt.Errorf("%s must be an integer (found: %q)", cmdcompose.ComposeParallelLimit, value)
		}
		if parallel > 0 {
			serviceOptions = append(serviceOptions, compose.WithMaxConcurrency(parallel))
		}
	}
	return project, serviceOptions, nil
}
