package response

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
)

func TxResponse(w http.ResponseWriter, r any, err error) *httperror.HandlerError {
	return TxFuncResponse(err, func() *httperror.HandlerError { return JSON(w, r) })
}

func TxEmptyResponse(w http.ResponseWriter, err error) *httperror.HandlerError {
	if err != nil {
		if handlerError, ok := errors.AsType[*httperror.HandlerError](err); ok {
			return handlerError
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return Empty(w)
}

func TxFuncResponse(err error, validResponse func() *httperror.HandlerError) *httperror.HandlerError {
	if err != nil {
		if handlerError, ok := errors.AsType[*httperror.HandlerError](err); ok {
			return handlerError
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return validResponse()
}

func TxErrorResponse(err error) *httperror.HandlerError {
	if handlerError, ok := errors.AsType[*httperror.HandlerError](err); ok {
		return handlerError
	}

	return httperror.InternalServerError("Unexpected error", err)
}
