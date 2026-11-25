//go:build unix

package projectfiles

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestDirectoryLinkSwapCannotSelectUndeclaredProjectContent(t *testing.T) {
	directory := t.TempDir()
	for name, content := range map[string]string{"public/compose.yaml": "services: {safe: {image: alpine}}", "private/compose.yaml": "UNDECLARED-CONTENT"} {
		if err := os.MkdirAll(filepath.Dir(filepath.Join(directory, name)), 0o700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(directory, name), []byte(content), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	stop := make(chan struct{})
	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			select {
			case <-stop:
				return
			default:
			}
			if os.Rename(filepath.Join(directory, "public"), filepath.Join(directory, "saved")) != nil {
				continue
			}
			os.Symlink("private", filepath.Join(directory, "public"))
			os.Remove(filepath.Join(directory, "public"))
			os.Rename(filepath.Join(directory, "saved"), filepath.Join(directory, "public"))
		}
	}()
	defer func() { close(stop); <-done }()
	for range 100 {
		snapshot, err := Read(context.Background(), directory, "public/compose.yaml", nil)
		if err == nil && string(snapshot.Content) != "services: {safe: {image: alpine}}" {
			t.Fatal("directory link swap selected undeclared source content")
		}
	}
}
