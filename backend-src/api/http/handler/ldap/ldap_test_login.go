package ldap

import (
	"errors"
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type testLoginPayload struct {
	LDAPSettings portainer.LDAPSettings
	Username     string
	Password     string
}

func (payload *testLoginPayload) Validate(r *http.Request) error {
	if strings.TrimSpace(payload.Username) == "" || payload.Password == "" {
		return errors.New("username and password are required")
	}
	return nil
}

type testLoginResponse struct {
	Valid bool `json:"valid"`
}

// @id LDAPTestLogin
// @summary Test LDAP user login
// @description Test user credentials against the supplied LDAP settings without creating a user or session.
// @description **Access policy**: administrator
// @tags ldap
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body testLoginPayload true "LDAP settings and user credentials"
// @success 200 {object} testLoginResponse
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 500 "Server error"
// @router /ldap/test [post]
func (handler *Handler) ldapTest(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload testLoginPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}
	if err := handler.prefillSettings(&payload.LDAPSettings); err != nil {
		return httperror.InternalServerError("Unable to fetch default settings", err)
	}
	err := handler.LDAPService.AuthenticateUser(payload.Username, payload.Password, &payload.LDAPSettings)
	if err != nil && !errors.Is(err, httperrors.ErrUnauthorized) {
		return httperror.InternalServerError("Unable to authenticate user against LDAP", err)
	}
	return response.JSON(w, testLoginResponse{Valid: err == nil})
}
