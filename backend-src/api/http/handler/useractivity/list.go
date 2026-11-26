package useractivity

import (
	"encoding/csv"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"unicode"

	portainer "github.com/portainer/portainer/api"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type listResponse struct {
	Logs       []portainer.ActivityLog `json:"logs"`
	TotalCount int                     `json:"totalCount"`
}

var errInvalidPagination = errors.New("offset and limit must be nonnegative integers")
var errInvalidFilter = errors.New("invalid activity log date range or sort")

func (handler *Handler) filtered(r *http.Request) ([]portainer.ActivityLog, int, error) {
	return handler.queryLogs(r, true)
}

func (handler *Handler) queryLogs(r *http.Request, paginate bool) ([]portainer.ActivityLog, int, error) {
	q := r.URL.Query()
	offset, limit := 0, 0
	if paginate {
		for key, value := range map[string]*int{"offset": &offset, "limit": &limit} {
			if q.Get(key) != "" {
				parsed, err := strconv.Atoi(q.Get(key))
				if err != nil || parsed < 0 {
					return nil, 0, errInvalidPagination
				}
				*value = parsed
			}
		}
	}
	keyword := strings.ToLower(q.Get("keyword"))
	var after, before int64
	for key, target := range map[string]*int64{"after": &after, "before": &before} {
		if q.Get(key) != "" {
			parsed, err := strconv.ParseInt(q.Get(key), 10, 64)
			if err != nil || parsed < 0 {
				return nil, 0, errInvalidFilter
			}
			*target = parsed
		}
	}
	if before != 0 && after > before {
		return nil, 0, errInvalidFilter
	}
	sortBy, desc := q.Get("sortBy"), q.Get("sortDesc") == "true"
	if q.Get("sortDesc") != "" && q.Get("sortDesc") != "true" && q.Get("sortDesc") != "false" {
		return nil, 0, errInvalidFilter
	}
	switch sortBy {
	case "", "Timestamp", "Action", "Context", "Username":
	default:
		return nil, 0, errInvalidFilter
	}
	if sortBy == "" {
		sortBy = "Timestamp"
		if q.Get("sortDesc") == "" {
			desc = true
		}
	}
	logs, err := handler.DataStore.ActivityLog().ReadAll(func(entry portainer.ActivityLog) bool {
		if q.Get("username") != "" && entry.Username != q.Get("username") || q.Get("action") != "" && entry.Action != q.Get("action") || q.Get("context") != "" && entry.Context != q.Get("context") {
			return false
		}
		if after != 0 && entry.Timestamp < after || before != 0 && entry.Timestamp > before {
			return false
		}
		return keyword == "" || strings.Contains(strings.ToLower(entry.Action), keyword) ||
			strings.Contains(strings.ToLower(entry.Context), keyword) || strings.Contains(strings.ToLower(entry.Username), keyword)
	})
	if err != nil {
		return nil, 0, err
	}

	sort.SliceStable(logs, func(i, j int) bool {
		comparison := 0
		switch sortBy {
		case "Action":
			comparison = strings.Compare(logs[i].Action, logs[j].Action)
		case "Context":
			comparison = strings.Compare(logs[i].Context, logs[j].Context)
		case "Username":
			comparison = strings.Compare(logs[i].Username, logs[j].Username)
		default:
			if logs[i].Timestamp < logs[j].Timestamp {
				comparison = -1
			} else if logs[i].Timestamp > logs[j].Timestamp {
				comparison = 1
			}
		}
		if comparison == 0 {
			if logs[i].ID < logs[j].ID {
				comparison = -1
			} else if logs[i].ID > logs[j].ID {
				comparison = 1
			}
		}
		if desc {
			return comparison > 0
		}
		return comparison < 0
	})

	total := len(logs)
	if offset > len(logs) {
		offset = len(logs)
	}
	logs = logs[offset:]
	if limit > 0 && limit < len(logs) {
		logs = logs[:limit]
	}
	return logs, total, nil
}

// @id UserActivityLogs
// @summary List user activity logs
// @description Lists retained authenticated state-changing API requests. Request bodies and credentials are never recorded.
// @tags users
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {object} listResponse "Success"
// @router /useractivity/logs [get]
func (handler *Handler) list(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	w.Header().Set("Cache-Control", "no-store")
	logs, total, err := handler.filtered(r)
	if errors.Is(err, errInvalidPagination) {
		return httperror.BadRequest("Invalid pagination", err)
	}
	if errors.Is(err, errInvalidFilter) {
		return httperror.BadRequest("Invalid activity log filters", err)
	}
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user activity logs", err)
	}
	return response.JSON(w, listResponse{Logs: logs, TotalCount: total})
}

func (handler *Handler) exportCSV(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	w.Header().Set("Cache-Control", "no-store")
	logs, _, err := handler.queryLogs(r, false)
	if errors.Is(err, errInvalidFilter) {
		return httperror.BadRequest("Invalid activity log filters", err)
	}
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user activity logs", err)
	}
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="vessel-activity-logs.csv"`)
	writer := csv.NewWriter(w)
	if err := writer.Write([]string{"Timestamp", "Username", "Action", "Context", "Payload"}); err != nil {
		return httperror.InternalServerError("Unable to export user activity logs", err)
	}
	for _, entry := range logs {
		if err := writer.Write([]string{strconv.FormatInt(entry.Timestamp, 10), csvText(entry.Username), csvText(entry.Action), csvText(entry.Context), csvText(entry.Payload)}); err != nil {
			return httperror.InternalServerError("Unable to export user activity logs", err)
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		return httperror.InternalServerError(fmt.Sprintf("Unable to export %d user activity logs", len(logs)), err)
	}
	return nil
}

// csv.Writer quotes delimiters, but spreadsheet applications also evaluate cell
// formulas. Prefix risky text without changing the stored audit record.
func csvText(value string) string {
	trimmed := strings.TrimLeftFunc(value, unicode.IsSpace)
	if strings.HasPrefix(value, "\t") || strings.HasPrefix(value, "\r") || strings.HasPrefix(value, "\n") || (trimmed != "" && strings.ContainsAny(trimmed[:1], "=+-@")) {
		return "'" + value
	}
	return value
}
