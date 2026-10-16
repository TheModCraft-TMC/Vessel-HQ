package nativeextensions

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	domain "github.com/portainer/portainer/api/nativeextensions"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	libresponse "github.com/portainer/portainer/pkg/libhttp/response"
)

func (h *Handler) upload(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	r.Body = http.MaxBytesReader(w, r.Body, domain.MaxArchiveSize+(1<<20))
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		var oversized *http.MaxBytesError
		if errors.As(err, &oversized) {
			return &httperror.HandlerError{StatusCode: http.StatusRequestEntityTooLarge, Message: "Package exceeds the 64 MiB upload limit", Err: err}
		}
		return httperror.BadRequest("Invalid package upload", err)
	}
	if r.MultipartForm != nil {
		defer r.MultipartForm.RemoveAll()
	}
	if r.MultipartForm == nil || len(r.MultipartForm.Value) != 0 || len(r.MultipartForm.File) != 1 || len(r.MultipartForm.File["file"]) != 1 {
		return httperror.BadRequest("Upload exactly one .vesselhq file", errors.New("multipart field file is required"))
	}
	header := r.MultipartForm.File["file"][0]
	if !strings.EqualFold(filepath.Ext(header.Filename), ".vesselhq") {
		return httperror.BadRequest("Package filename must end in .vesselhq", errors.New("invalid package extension"))
	}
	if header.Size > domain.MaxArchiveSize {
		return &httperror.HandlerError{StatusCode: http.StatusRequestEntityTooLarge, Message: "Package exceeds the 64 MiB upload limit", Err: errors.New("archive too large")}
	}
	file, err := header.Open()
	if err != nil {
		return httperror.BadRequest("Cannot read uploaded package", err)
	}
	defer file.Close()
	contents, err := io.ReadAll(io.LimitReader(file, domain.MaxArchiveSize+1))
	if err != nil {
		return httperror.BadRequest("Cannot read uploaded package", err)
	}
	if int64(len(contents)) > domain.MaxArchiveSize {
		return &httperror.HandlerError{StatusCode: http.StatusRequestEntityTooLarge, Message: "Package exceeds the 64 MiB upload limit", Err: errors.New("archive too large")}
	}
	bundle, err := domain.InspectPackage(contents)
	if err != nil {
		return httperror.BadRequest("Invalid .vesselhq package", err)
	}
	if h.FileService == nil {
		return httperror.InternalServerError("Package storage unavailable", errors.New("file service unavailable"))
	}
	if err = storePackage(h.FileService.GetDatastorePath(), bundle.ArchiveDigest, contents); err != nil {
		return httperror.InternalServerError("Cannot persist extension package", err)
	}
	// Immutable content may remain unreferenced if registration fails. Retaining it
	// avoids deleting an archive concurrently referenced by another registration.
	record, err := h.persistRegistration(r, bundle.Manifest, true, bundle.ArchiveDigest, "extension.upload")
	return libresponse.TxResponse(w, publicRecord(record), err)
}
func storePackage(root, digest string, contents []byte) error {
	if len(digest) != 71 || !strings.HasPrefix(digest, "sha256:") {
		return errors.New("invalid archive storage identity")
	}
	hexDigest := strings.TrimPrefix(digest, "sha256:")
	actualDigest := sha256.Sum256(contents)
	if hex.EncodeToString(actualDigest[:]) != hexDigest {
		return errors.New("archive storage checksum mismatch")
	}
	if _, err := hex.DecodeString(hexDigest); err != nil {
		return err
	}
	directory := root
	for _, part := range []string{"native-extensions", "packages"} {
		parent := directory
		directory = filepath.Join(directory, part)
		if err := os.Mkdir(directory, 0o700); err != nil && !errors.Is(err, os.ErrExist) {
			return err
		}
		info, err := os.Lstat(directory)
		if err != nil {
			return err
		}
		if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
			return errors.New("package storage must be a real directory")
		}
		// Sync existing paths too: an earlier interrupted upload may have created
		// them without reaching its durability checkpoint.
		if err := syncPackageDirectory(parent); err != nil {
			return err
		}
	}
	target := filepath.Join(directory, hexDigest+".vesselhq")
	verifyExisting := func() error {
		info, err := os.Lstat(target)
		if err != nil {
			return err
		}
		if !info.Mode().IsRegular() || info.Size() != int64(len(contents)) {
			return errors.New("existing package storage mismatch")
		}
		stored, err := os.ReadFile(target)
		if err != nil {
			return err
		}
		sum := sha256.Sum256(stored)
		if hex.EncodeToString(sum[:]) != hexDigest {
			return errors.New("existing package checksum mismatch")
		}
		return syncPackageDirectory(directory)
	}
	if _, err := os.Lstat(target); err == nil {
		return verifyExisting()
	} else if !errors.Is(err, os.ErrNotExist) {
		return err
	}
	temporary, err := os.CreateTemp(directory, ".upload-*")
	if err != nil {
		return err
	}
	defer os.Remove(temporary.Name())
	if _, err = temporary.Write(contents); err == nil {
		err = temporary.Sync()
	}
	closeErr := temporary.Close()
	if err != nil {
		return err
	}
	if closeErr != nil {
		return closeErr
	}
	if err = os.Link(temporary.Name(), target); errors.Is(err, os.ErrExist) {
		return verifyExisting()
	} else if err != nil {
		return fmt.Errorf("cannot retain immutable package: %w", err)
	}
	return syncPackageDirectory(directory)
}
func syncPackageDirectory(directory string) error {
	file, err := os.Open(directory)
	if err != nil {
		return err
	}
	if err = file.Sync(); err != nil {
		file.Close()
		return err
	}
	return file.Close()
}
