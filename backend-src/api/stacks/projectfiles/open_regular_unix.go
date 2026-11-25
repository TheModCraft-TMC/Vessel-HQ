//go:build unix

package projectfiles

import (
	"os"
	"strings"

	"golang.org/x/sys/unix"
)

// Walk pinned directory descriptors with O_NOFOLLOW on every component. Even a
// link swapped between Lstat and open cannot select an undeclared source file.
func openRegular(root *os.Root, name string) (*os.File, error) {
	directory, err := root.Open(".")
	if err != nil {
		return nil, err
	}
	defer func() { directory.Close() }()
	parts := strings.Split(name, "/")
	for index, part := range parts {
		flags := unix.O_RDONLY | unix.O_NOFOLLOW | unix.O_CLOEXEC | unix.O_NONBLOCK
		if index != len(parts)-1 {
			flags |= unix.O_DIRECTORY
		}
		descriptor, err := unix.Openat(int(directory.Fd()), part, flags, 0)
		if err != nil {
			return nil, err
		}
		file := os.NewFile(uintptr(descriptor), part)
		if index == len(parts)-1 {
			return file, nil
		}
		directory.Close()
		directory = file
	}
	return nil, os.ErrInvalid
}
