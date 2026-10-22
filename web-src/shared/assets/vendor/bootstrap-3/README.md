# Bootstrap 3 presentation assets only

These are Bootstrap 3.4.1's MIT-licensed compiled CSS and Glyphicon font assets,
not a renamed Bootstrap package. The complete npm `bootstrap` dependency has
been removed. **Do not add its JavaScript, jQuery plugins, Less build pipeline,
or source maps here.** Vessel uses React-managed interactions, not Bootstrap's
`data-*` JavaScript handlers.

The two Bootstrap advisories in the remediation inventory affect its tooltip,
popover and other JavaScript `data-*` processing. None of that executable code
is present in this directory or the dependency graph. Audited retained CSS has
no remote imports, executable CSS constructs, or behavior bindings. Its SVG
font has no scripts, event handlers or external links. CSS's print selector
`a[href^="javascript:"]:after` merely suppresses printed link annotations; it
is not an executable URL.

Provenance: npm `bootstrap@3.4.1`, `dist/css/bootstrap.css` (original SHA-256
`d170052c16caec3810f2dee6456539045d8e326f6d8ed7c7f78e59ed34de348a`),
`dist/fonts/*` and the original `LICENSE`. Only CSS font URLs were changed from
`../fonts/` to `./fonts/` and the unavailable source-map comment was removed.
No selectors or declarations were changed. Original font files are byte-for-byte
identical; their hashes and retained CSS hash are enforced by
`scripts/check-dependency-styles.test.mjs`.

The retained grid, forms, buttons, typography and Glyphicon rules preserve
existing workflows while Vessel gradually replaces legacy presentation classes.
The root application layout and Storybook import this stylesheet before Vessel's
existing styles and overrides, in the same order as the former package import.
