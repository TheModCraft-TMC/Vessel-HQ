package rpc

import (
	"errors"
	"net"
	"os"
	"path/filepath"
	"strings"
)

// listenGateway allows one shared private socket without publishing a TCP port.
// The operator owns the parent directory; never remove an existing path to bind.
func listenGateway(address string) (net.Listener, error) {
	if !strings.HasPrefix(address, "unix://") {
		return net.Listen("tcp", address)
	}
	path := strings.TrimPrefix(address, "unix://")
	if !filepath.IsAbs(path) || filepath.Clean(path) != path || path == "/" || strings.ContainsAny(path, "?#%@\\ \t\r\n\x00") {
		return nil, errors.New("extension Unix address must be unix:///absolute/clean/socket-path")
	}
	// A private parent prevents another user racing the bind/chmod operations.
	parent, err := os.Lstat(filepath.Dir(path))
	if err != nil || !parent.IsDir() || parent.Mode().Perm()&0077 != 0 {
		return nil, errors.New("extension Unix socket requires an existing private parent directory (0700)")
	}
	if _, err := os.Lstat(path); !os.IsNotExist(err) {
		return nil, errors.New("extension Unix socket path already exists or cannot be inspected")
	}
	listener, err := net.Listen("unix", path)
	if err != nil {
		return nil, err
	}
	if err := os.Chmod(path, 0600); err != nil {
		_ = listener.Close()
		return nil, err
	}
	return listener, nil
}
