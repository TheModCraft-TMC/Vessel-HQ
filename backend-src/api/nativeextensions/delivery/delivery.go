// Package delivery projects stack deployment metadata without secrets or Compose contents.
package delivery

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	domain "github.com/portainer/portainer/api/nativeextensions"
)

type Source struct {
	ID              int    `json:"id"`
	Name            string `json:"name"`
	Ref             string `json:"ref"`
	Path            string `json:"path"`
	DesiredRevision string `json:"desiredRevision"`
	Status          int    `json:"status"`
	Interval        string `json:"interval"`
}
type Image struct {
	Reference  string `json:"reference"`
	Policy     string `json:"policy"`
	WorkloadID string `json:"workloadId"`
	Name       string `json:"name"`
	Kind       string `json:"kind"`
	Status     string `json:"status"`
}
type Snapshot struct {
	Automation       *domain.ImageAutomation `json:"automation,omitempty"`
	EnvironmentID    int                     `json:"environmentId"`
	StackID          int                     `json:"stackId"`
	Name             string                  `json:"name"`
	Version          string                  `json:"version"`
	Status           int                     `json:"status"`
	WorkflowID       int                     `json:"workflowId"`
	UpdatedAt        int64                   `json:"updatedAt"`
	DeployedRevision string                  `json:"deployedRevision"`
	SyncStatus       string                  `json:"syncStatus"`
	AutomaticSync    bool                    `json:"automaticSync"`
	RepullOnSync     bool                    `json:"repullOnSync"`
	Sources          []Source                `json:"sources"`
	Images           []Image                 `json:"images"`
}

// Version binds a review to the complete persisted deployment input. It never exposes it.
func Version(stack *portainer.Stack) string {
	bytes, _ := json.Marshal(stack)
	hash := sha256.Sum256(bytes)
	return hex.EncodeToString(hash[:])
}
func Read(ctx context.Context, store dataservices.DataStore, environmentID, stackID int) (Snapshot, error) {
	result := Snapshot{EnvironmentID: environmentID, StackID: stackID, Sources: []Source{}, Images: []Image{}, SyncStatus: "unknown"}
	if err := ctx.Err(); err != nil {
		return result, err
	}
	err := store.ViewTx(func(tx dataservices.DataStoreTx) error {
		stack, err := tx.Stack().Read(portainer.StackID(stackID))
		if err != nil {
			return err
		}
		if int(stack.EndpointID) != environmentID || (stack.Type != portainer.DockerComposeStack && stack.Type != portainer.DockerSwarmStack) {
			return errors.New("unsupported stack scope")
		}
		result.Name = stack.Name
		result.Version, err = ReviewVersionTx(tx, stack)
		if err != nil {
			return err
		}
		result.Status = int(stack.Status)
		result.WorkflowID = int(stack.WorkflowID)
		result.UpdatedAt = stack.UpdateDate
		if stack.CurrentDeploymentInfo != nil {
			result.DeployedRevision = stack.CurrentDeploymentInfo.ConfigHash
		}
		result.AutomaticSync = stack.AutoUpdate != nil
		result.RepullOnSync = stack.AutoUpdate != nil && stack.AutoUpdate.ForcePullImage
		if stack.WorkflowID == 0 {
			result.SyncStatus = "unmanaged"
			return nil
		}
		workflow, err := tx.Workflow().Read(stack.WorkflowID)
		if err != nil {
			return err
		}
		for _, artifact := range workflow.Artifacts {
			if artifact.StackID != stack.ID {
				continue
			}
			for _, file := range artifact.Files {
				src, err := tx.Source().Read(source.InsecureNewAdminContext(), file.SourceID)
				if err != nil {
					return err
				}
				result.Sources = append(result.Sources, Source{ID: int(src.ID), Name: src.Name, Ref: file.Ref, Path: file.Path, DesiredRevision: file.Hash, Status: int(src.Status), Interval: src.Interval})
			}
		}
		// Hash equality is revision alignment, not a comparison of runtime Compose state.
		if len(result.Sources) > 0 && result.DeployedRevision != "" && result.Sources[0].DesiredRevision != "" {
			result.SyncStatus = "out-of-sync"
			if result.Sources[0].DesiredRevision == result.DeployedRevision {
				result.SyncStatus = "synced"
			}
		}
		return nil
	})
	return result, err
}

// ReviewVersionTx binds source settings as well as stack inputs. Source credentials
// contribute only to the opaque hash and never enter the returned projection.
func ReviewVersionTx(tx dataservices.DataStoreTx, stack *portainer.Stack) (string, error) {
	input := struct {
		Stack    *portainer.Stack
		Workflow *portainer.Workflow
		Sources  []*portainer.Source
	}{Stack: stack}
	if stack.WorkflowID != 0 {
		workflow, err := tx.Workflow().Read(stack.WorkflowID)
		if err != nil {
			return "", err
		}
		input.Workflow = workflow
		for _, artifact := range workflow.Artifacts {
			if artifact.StackID != stack.ID {
				continue
			}
			for _, file := range artifact.Files {
				src, err := tx.Source().Read(source.InsecureNewAdminContext(), file.SourceID)
				if err != nil {
					return "", err
				}
				input.Sources = append(input.Sources, src)
			}
		}
	}
	bytes, err := json.Marshal(input)
	if err != nil {
		return "", err
	}
	hash := sha256.Sum256(bytes)
	return hex.EncodeToString(hash[:]), nil
}
