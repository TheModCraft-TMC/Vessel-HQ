package useractivity

import (
	"encoding/csv"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
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

func TestListAndExportRejectInvalidFilters(t *testing.T) {
	handler := &Handler{}
	for _, query := range []string{"after=oops", "before=-1", "after=20&before=10", "sortBy=Payload", "sortDesc=yes", "after=9223372036854775808"} {
		t.Run(query, func(t *testing.T) {
			for _, endpoint := range []func(http.ResponseWriter, *http.Request) *httperror.HandlerError{handler.list, handler.exportCSV} {
				err := endpoint(httptest.NewRecorder(), httptest.NewRequest("GET", "/useractivity/logs?"+query, nil))
				require.NotNil(t, err)
				require.Equal(t, http.StatusBadRequest, err.StatusCode)
			}
		})
	}
}

func TestExactFiltersAndCSVFormulaEscaping(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, false, true)
	base := time.Now().Unix()
	for _, entry := range []portainer.ActivityLog{
		{Timestamp: base, Username: "=alice()", Action: "POST", Context: "/stacks"},
		{Timestamp: base, Username: "=alice()", Action: "DELETE", Context: "/stacks"},
		{Timestamp: base, Username: "bob", Action: "POST", Context: "/stacks"},
	} {
		require.NoError(t, store.ActivityLog().Create(&entry))
	}
	h := &Handler{DataStore: store}
	query := "?username=%3Dalice%28%29&action=POST&context=%2Fstacks"
	logs, total, err := h.filtered(httptest.NewRequest("GET", "/useractivity/logs"+query, nil))
	require.NoError(t, err)
	require.Equal(t, 1, total)
	require.Equal(t, "=alice()", logs[0].Username)
	w := httptest.NewRecorder()
	require.Nil(t, h.exportCSV(w, httptest.NewRequest("GET", "/useractivity/logs.csv"+query, nil)))
	rows, err := csv.NewReader(w.Body).ReadAll()
	require.NoError(t, err)
	require.Len(t, rows, 2)
	require.Equal(t, "'=alice()", rows[1][1])
	require.Equal(t, "no-store", w.Header().Get("Cache-Control"))
	for _, value := range []string{"=SUM(1)", "+SUM(1)", "-1+1", "@SUM(1)", " \t=SUM(1)", "\rtext", "\ttext", "\ntext"} {
		require.Equal(t, "'"+value, csvText(value))
	}
	require.Equal(t, "/stacks", csvText("/stacks"))
}
