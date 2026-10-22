package roles

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"

	"github.com/gorilla/mux"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestRoleCRUD(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, true)
	handler := &Handler{DataStore: store}

	// Exercise the actual initialized catalog rather than inserting test roles.
	// These are the keys the role editor uses for its permission checkboxes.
	listResponse := httptest.NewRecorder()
	require.Nil(t, handler.roleList(listResponse, httptest.NewRequest(http.MethodGet, "/roles", nil)))
	require.Equal(t, http.StatusOK, listResponse.Code)
	var roles []portainer.Role
	require.NoError(t, json.Unmarshal(listResponse.Body.Bytes(), &roles))
	require.Len(t, roles, 5)
	permissions := map[portainer.Authorization]bool{}
	for _, role := range roles {
		require.NotEmpty(t, role.Authorizations)
		for permission := range role.Authorizations {
			permissions[permission] = true
		}
	}
	require.Contains(t, permissions, portainer.OperationPortainerStackList)
	require.Contains(t, permissions, portainer.OperationDockerContainerRestart)
	require.Contains(t, permissions, portainer.OperationDockerAgentBrowseList)

	createBody := bytes.NewBufferString(`{"Name":"Automation reader","Description":"Agent account","Priority":5,"Authorizations":{"PortainerStackList":true,"PortainerStackCreate":false}}`)
	createRequest := httptest.NewRequest(http.MethodPost, "/roles", createBody)
	createResponse := httptest.NewRecorder()
	require.Nil(t, handler.roleCreate(createResponse, createRequest))

	var created portainer.Role
	require.NoError(t, json.Unmarshal(createResponse.Body.Bytes(), &created))
	require.Equal(t, portainer.RoleID(6), created.ID)
	require.True(t, created.Authorizations[portainer.OperationPortainerStackList])
	_, containsFalse := created.Authorizations[portainer.OperationPortainerStackCreate]
	require.False(t, containsFalse)

	require.NoError(t, store.Init())
	preserved, err := store.Role().Read(created.ID)
	require.NoError(t, err)
	require.Equal(t, created, *preserved)

	updateBody := bytes.NewBufferString(`{"Name":"Automation stack reader","Description":"Updated","Priority":6,"Authorizations":{"PortainerStackList":true}}`)
	updateRequest := mux.SetURLVars(httptest.NewRequest(http.MethodPut, "/roles/6", updateBody), map[string]string{"id": "6"})
	updateResponse := httptest.NewRecorder()
	require.Nil(t, handler.roleUpdate(updateResponse, updateRequest))
	updated, err := store.Role().Read(created.ID)
	require.NoError(t, err)
	require.Equal(t, "Automation stack reader", updated.Name)

	deleteRequest := mux.SetURLVars(httptest.NewRequest(http.MethodDelete, "/roles/6", nil), map[string]string{"id": "6"})
	require.Nil(t, handler.roleDelete(httptest.NewRecorder(), deleteRequest))
	_, err = store.Role().Read(created.ID)
	require.True(t, store.IsErrObjectNotFound(err))
}

func TestRoleCreateAfterInitRepairsCatalog(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	custom := &portainer.Role{ID: 42, Name: "Existing custom role", Priority: 9, Authorizations: portainer.Authorizations{portainer.OperationPortainerStackList: true}}
	require.NoError(t, store.Role().Update(custom.ID, custom))
	require.NoError(t, store.Role().Delete(portainer.RoleIDOperator))
	require.NoError(t, store.Init())

	handler := &Handler{DataStore: store}
	request := httptest.NewRequest(http.MethodPost, "/roles", bytes.NewBufferString(`{"Name":"New custom role","Priority":5,"Authorizations":{"PortainerStackList":true}}`))
	response := httptest.NewRecorder()
	require.Nil(t, handler.roleCreate(response, request))
	var created portainer.Role
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &created))
	require.Equal(t, portainer.RoleID(43), created.ID)
	preserved, err := store.Role().Read(custom.ID)
	require.NoError(t, err)
	require.Equal(t, custom, preserved)
}

func TestRoleDeleteProtectsBuiltInAndAssignedRoles(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, true)
	handler := &Handler{DataStore: store}

	builtInRequest := mux.SetURLVars(httptest.NewRequest(http.MethodDelete, "/roles/1", nil), map[string]string{"id": "1"})
	handlerError := handler.roleDelete(httptest.NewRecorder(), builtInRequest)
	require.NotNil(t, handlerError)
	require.Equal(t, http.StatusForbidden, handlerError.StatusCode)

	role := &portainer.Role{ID: 6, Name: "Assigned", Priority: 5, Authorizations: portainer.Authorizations{}}
	require.NoError(t, store.Role().Update(role.ID, role))
	require.NoError(t, store.Endpoint().Create(&portainer.Endpoint{
		ID: 1, Name: "local", UserAccessPolicies: portainer.UserAccessPolicies{1: {RoleID: role.ID}},
	}))

	assignedRequest := mux.SetURLVars(httptest.NewRequest(http.MethodDelete, "/roles/6", nil), map[string]string{"id": "6"})
	handlerError = handler.roleDelete(httptest.NewRecorder(), assignedRequest)
	require.NotNil(t, handlerError)
	require.Equal(t, http.StatusConflict, handlerError.StatusCode)
}
