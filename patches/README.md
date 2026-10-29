# Maintained dependency patches

The patch paths and hashes are declared in `package.json` and `pnpm-lock.yaml`.
Install with the declared pnpm version and `pnpm install --frozen-lockfile`.

## `@hey-api/openapi-ts@0.99.0`

Fixes GitHub issues #157 and #158 in the generator's SSE runtime template.
`ReadableStreamDefaultReader.cancel()` returns a promise: a synchronous
`try/catch` does not handle its rejection. The abort callback now attaches a
rejection handler to this best-effort cleanup. The existing stream read path
still reports streaming errors.

The checked-in API client was regenerated from `openapi-ts.config.ts`; generated
files must not be patched by hand. Normal API generation retains this fix while
the patched generator version is installed. When upgrading the generator,
check its template and drop the patch only when the upstream runtime handles
cancellation rejection itself.

Regression check:

```sh
pnpm exec vitest run web-src/core/query/generated-sse-client.test.ts
```

This exercises both successful and rejected cancellation during an active read.

## deepmerge 4.3.1

`deepmerge@4.3.1.patch` mitigates
[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).
All object destination writes use `Object.defineProperty` with ordinary writable,
enumerable, configurable data properties. This prevents own `__proto__` keys in
an input or null-prototype source from invoking inherited destination setters,
while retaining nested merges, symbols, arrays and custom mergers. The published
CommonJS, UMD and source files are patched. No upstream fixed version is claimed;
replace this patch when a compatible maintained upstream remedy is available.

Run `node --test scripts/deepmerge-security.test.mjs` after frozen installation to
exercise the actual transitive package, including malicious keys and normal
merge behavior. Fresh npm advisory reports intentionally continue to show the
low affected-version advisory. No advisory exclusion is configured.
