//go:build !unix

package projectfiles

import "os"

// os.Root enforces directory confinement on other supported platforms; the
// caller additionally rejects observed symlinks and nonregular files.
func openRegular(root *os.Root, name string) (*os.File, error) {
	return root.Open(name)
}
