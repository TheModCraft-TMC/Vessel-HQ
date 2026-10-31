package useractivity

import (
	"encoding/csv"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/stretchr/testify/require"
)

func TestFilteredAppliesSearchSortAndPagination(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)
	base := time.Now().Unix()
	entries := []portainer.ActivityLog{
		{Timestamp: base, Username: "alice", Action: "POST", Context: "/stacks"},
		{Timestamp: base + 10, Username: "bob", Action: "DELETE", Context: "/registries/1"},
		{Timestamp: base + 20, Username: "alice", Action: "PUT", Context: "/stacks/2"},
	}
	for i := range entries {
		require.NoError(t, store.ActivityLog().Create(&entries[i]))
	}

	handler := &Handler{DataStore: store}
	request := httptest.NewRequest("GET", "/useractivity/logs?keyword=alice&sortBy=Timestamp&sortDesc=true&offset=1&limit=1", nil)
	logs, total, err := handler.filtered(request)
	require.NoError(t, err)
	require.Equal(t, 2, total)
	require.Len(t, logs, 1)
	require.Equal(t, base, logs[0].Timestamp)
}

func TestListRejectsNegativePagination(t *testing.T) {
	handler := &Handler{}
	for _, query := range []string{"offset=-1", "offset=oops", "limit=-1"} {
		err := handler.list(httptest.NewRecorder(), httptest.NewRequest("GET", "/useractivity/logs?"+query, nil))
		require.NotNil(t, err)
		require.Equal(t, http.StatusBadRequest, err.StatusCode)
	}
}

func TestCSVExportsAllFilteredRowsFromLaterPage(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, false, true)
	for i, user := range []string{"alice", "bob", "alice"} {
		require.NoError(t, store.ActivityLog().Create(&portainer.ActivityLog{Timestamp: time.Now().Unix() + int64(i), Username: user, Action: "POST"}))
	}
	handler := &Handler{DataStore: store}
	response := httptest.NewRecorder()
	require.Nil(t, handler.exportCSV(response, httptest.NewRequest("GET", "/useractivity/logs.csv?keyword=alice&offset=1&limit=1", nil)))
	rows, err := csv.NewReader(response.Body).ReadAll()
	require.NoError(t, err)
	require.Len(t, rows, 3)
	require.Equal(t, "alice", rows[1][1])
	require.Equal(t, "alice", rows[2][1])
}
