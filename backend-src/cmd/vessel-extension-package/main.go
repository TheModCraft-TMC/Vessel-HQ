// vessel-extension-package verifies and extracts inert .vesselhq packages.
package main

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/portainer/portainer/api/nativeextensions"
)

func main() {
	archive := flag.String("archive", "", "Input .vesselhq archive")
	digest := flag.String("expected-digest", "", "Trusted archive SHA256 digest from the approved package record")
	out := flag.String("out", "", "New private extraction directory")
	flag.Parse()
	if err := extract(*archive, *digest, *out, os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func extract(archiveFile, digest, output string, result io.Writer) (err error) {
	if archiveFile == "" || output == "" || !strings.HasSuffix(archiveFile, ".vesselhq") || digest == "" {
		return errors.New("archive, trusted expected-digest and new out directory are required")
	}
	file, err := os.Open(archiveFile)
	if err != nil {
		return err
	}
	defer file.Close()
	data, err := io.ReadAll(io.LimitReader(file, nativeextensions.MaxArchiveSize+1))
	if err != nil {
		return err
	}
	verified, err := nativeextensions.InspectPackage(data)
	if err != nil {
		return err
	}
	if verified.ArchiveDigest != digest {
		return errors.New("trusted archive digest mismatch")
	}
	output, err = filepath.Abs(output)
	if err != nil {
		return err
	}
	if err = os.Mkdir(output, 0o700); err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = os.RemoveAll(output)
		}
	}()
	archive, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return err
	}
	for _, entry := range archive.File {
		target := filepath.Join(output, filepath.FromSlash(strings.TrimSuffix(entry.Name, "/")))
		if !strings.HasPrefix(target, output+string(filepath.Separator)) {
			return errors.New("extraction path escapes private output")
		}
		if entry.FileInfo().IsDir() {
			if err = os.MkdirAll(target, 0o755); err != nil {
				return err
			}
			continue
		}
		if err = os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return err
		}
		input, openErr := entry.Open()
		if openErr != nil {
			return openErr
		}
		mode := os.FileMode(0o644)
		if verified.Manifest.Backend != nil {
			for _, binary := range verified.Manifest.Backend.Entrypoints {
				if entry.Name == binary {
					mode = 0o755
				}
			}
		}
		outputFile, createErr := os.OpenFile(target, os.O_WRONLY|os.O_CREATE|os.O_EXCL, mode)
		if createErr != nil {
			_ = input.Close()
			return createErr
		}
		_, copyErr := io.Copy(outputFile, input)
		closeErr := outputFile.Close()
		_ = input.Close()
		if copyErr != nil {
			return copyErr
		}
		if closeErr != nil {
			return closeErr
		}
	}
	return json.NewEncoder(result).Encode(struct {
		Directory     string                    `json:"directory"`
		ArchiveDigest string                    `json:"archiveDigest"`
		Manifest      nativeextensions.Manifest `json:"manifest"`
	}{output, verified.ArchiveDigest, verified.Manifest})
}
