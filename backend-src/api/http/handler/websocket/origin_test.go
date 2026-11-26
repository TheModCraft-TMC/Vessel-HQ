package websocket

import (
	"net/http/httptest"
	"testing"
)

func TestCheckOrigin(t *testing.T) {
	for _, tt := range []struct {
		name      string
		peer      string
		origin    string
		forwarded []string
		fetchSite string
		want      bool
	}{
		{name: "CLI without origin", want: true},
		{name: "same host", origin: "http://localhost:9000", want: true},
		{name: "cross origin", origin: "https://other.example"},
		{name: "local proxy", peer: "127.0.0.1:3456", origin: "https://vessel.example", forwarded: []string{"vessel.example"}, fetchSite: "same-origin", want: true},
		{name: "local proxy without fetch metadata", peer: "[::1]:3456", origin: "https://vessel.example", forwarded: []string{"vessel.example"}, want: true},
		{name: "local proxy with cross-site browser", peer: "127.0.0.1:3456", origin: "https://vessel.example", forwarded: []string{"vessel.example"}, fetchSite: "cross-site"},
		{name: "local proxy with mismatched origin", peer: "127.0.0.1:3456", origin: "https://other.example", forwarded: []string{"vessel.example"}},
		{name: "untrusted forwarded host", peer: "192.0.2.10:3456", origin: "https://vessel.example", forwarded: []string{"vessel.example"}},
		{name: "ambiguous forwarded host", peer: "127.0.0.1:3456", origin: "https://vessel.example", forwarded: []string{"vessel.example", "other.example"}},
		{name: "origin with unexpected scheme", origin: "file://localhost:9000"},
	} {
		t.Run(tt.name, func(t *testing.T) {
			r := httptest.NewRequest("GET", "http://localhost:9000/websocket/events", nil)
			r.RemoteAddr = tt.peer
			if tt.origin != "" {
				r.Header.Set("Origin", tt.origin)
			}
			for _, host := range tt.forwarded {
				r.Header.Add("X-Forwarded-Host", host)
			}
			if tt.fetchSite != "" {
				r.Header.Set("Sec-Fetch-Site", tt.fetchSite)
			}
			if got := checkOrigin(r); got != tt.want {
				t.Fatalf("checkOrigin() = %t, want %t", got, tt.want)
			}
		})
	}
}
