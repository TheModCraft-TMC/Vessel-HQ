// Package extensiontest owns a fixed wire-format regression vector, not an installable plugin.
package extensiontest

const Manifest = `{
  "id": "environment-summary",
  "name": "Environment summary",
  "version": "0.1.0",
  "description": "Native UI reference package; no infrastructure operations.",
  "apiVersion": "v1",
  "packageDigest": "sha256:7352da43730269f8c7720f389d89865efd42364932e0d85f541fb7d9d98af4b9",
  "permissions": [{ "capability": "ui.native", "environmentIds": [] }],
  "ui": {
    "entry": "ui/index.tsx",
    "slots": [{ "id": "overview", "title": "Environment summary", "slot": "extension.page" }]
  }
}
`

const Source = `export default function EnvironmentSummary() {
  return (
    <section aria-label="Environment summary extension">
      <h2>Environment summary</h2>
      <p>This native extension was compiled into a candidate Vessel console.</p>
      <p>Infrastructure access remains unavailable until a scoped gateway is connected.</p>
    </section>
  );
}
`
