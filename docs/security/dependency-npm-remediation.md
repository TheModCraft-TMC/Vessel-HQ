# npm dependency security remediation

Scope: the 61 npm alerts from the supplied GitHub advisory snapshot, plus the newer advisories returned by the npm feed during this work. No alert dismissals, ignore lists, package renames, vulnerable-JS vendoring, or remote changes. This document is not a statement about Go or live infrastructure coverage.

## Compatibility decisions

- Removed npm Bootstrap entirely: only audited CSS/Glyphicon presentation assets and original license remain in `web-src/shared/assets/vendor/bootstrap-3/`. The original stylesheet is unchanged except local font URLs and removing its source-map comment. No Bootstrap JavaScript, button/tooltip/popover plugins, or data-attribute handlers remain. See its provenance README and hash/asset regression test.
- `braces` has no patched release (registry latest remains 3.0.3). Removed its real parents rather than overriding/renaming it: Tailwind 3 → Tailwind 4.3.3/PostCSS + Oxide scanner, Storybook webpack → Next.js/Vite builder 10.6.3, and unused standalone webpack docgen/CSS preset packages. Dropped obsolete Recharts Redux downgrade overrides, allowing its supported Redux 2/react-redux 9 graph. Re-resolved the lockfile without the obsolete virtual-store lock so unused optional React Native/Metro peers and their micromatch dependency are genuinely absent. No peer-disable or security-ignore setting was added.
- Tailwind upstream codemod applies equivalent class renames (important suffix, shadow/radius/outline and arbitrary CSS-variable syntax). Migrated all 19 @apply stylesheets with explicit references and opacity modifiers. **No preflight** is imported; utilities stay **unlayered**, retaining their precedence over Bootstrap. Existing theme palette, edition variants, dark/high-contrast variants, and animation plugin are retained. This is dependency maintenance, not a redesign.
- `sprintf-js` has no patched release. Removed retired swagger-cli/js-yaml 3/argparse 1 chain. `pnpm swagger-cli validate <file>` remains compatible with the existing Makefile through `scripts/validate-openapi.mjs` and maintained swagger-parser 13.1.0; YAML/local references, invalid documents and CLI errors are tested. No unsafe js-yaml 3→4 override.
- Removed vulnerable markdown-it 12 override; codemirror-json-schema already declares compatible markdown-it ^14.1.0, now resolved to 14.3.3 with linkify-it 5.0.2. No generator update. `js-yaml@4` alone receives a same-major ^4.3.2 floor because the generator’s reference parser pins an affected 4.2.0 release.
- Same-major dependency refresh resolves the remaining compiler, CSS, URI, YAML, WebSocket, form-data and parser fixes. I18next stays on compatible 21.10.0/react-i18next 11.18.6; no unnecessary React Query 5 or i18next-major rewrite. Slider now derives its public handle callback types rather than importing an incompatible internal DTO, and a no-longer-needed TypeScript inference suppression is removed.
- Zustand is pinned to the original 4.1.1: newer 4.x deprecated the existing persistence contract and causes strict-console regression failures. This package has no advisory in either source. Prettier is pinned to original 3.8.3: 3.9 changes generated-client formatting, violating the zero-diff generator reproduction requirement.
- `@hey-api/openapi-ts` remains exactly 0.99.0 and all three active patch hashes are unchanged. Generation must produce zero diff, including SSE runtime. Node 24 baseline, pnpm 10.26.2, RELEASE_VERSION 1.3.1 and API/datastore identity 2.45.0 are unchanged.

## Graph inventory

Resolved package-version records: **1785 → 1452**; 905 prior records removed and 572 new records added (includes compatible upgrades). The lockfile records the complete exact graph.

| Package | Before | After | Representative original dependency chain |
| --- | --- | --- | --- |
| @babel/plugin-transform-modules-systemjs | 7.23.3 | 7.29.8 | @babel/preset-env → @babel/plugin-transform-modules-systemjs |
| @babel/runtime | 7.26.0 | 7.29.10 | @uiw/react-codemirror → @babel/runtime |
| @humanfs/node | 0.16.7 | 0.16.8 | eslint → @humanfs/node |
| baseline-browser-mapping | 2.10.33, 2.11.29 | 2.11.30 | next → baseline-browser-mapping |
| bootstrap | 3.4.1 | Removed | bootstrap |
| brace-expansion | 1.1.11, 5.0.5 | 1.1.21, 5.0.12 | @eslint/eslintrc → minimatch → brace-expansion |
| braces | 3.0.3 | Removed | react-docgen-typescript-plugin → micromatch → braces |
| browserslist | 4.28.2, 4.29.3 | 4.29.4 | autoprefixer → browserslist |
| esbuild | 0.27.3 | 0.28.2 | storybook → esbuild |
| fast-copy | 3.0.2 | 3.1.0 | codemirror-json-schema → json-schema-library → fast-copy |
| fast-uri | 3.1.0 | 3.1.9 | babel-loader → schema-utils → ajv → fast-uri |
| form-data | 4.0.5, 4.0.6 | 4.0.6 | axios → form-data |
| js-yaml | 3.14.2, 4.1.1, 4.2.0 | 4.3.2, 5.5.0 | @apidevtools/swagger-cli → js-yaml |
| linkify-it | 3.0.3 | 5.0.2 | codemirror-json-schema → markdown-it → linkify-it |
| markdown-it | 12.3.2 | 14.3.3 | codemirror-json-schema → markdown-it |
| mdast-util-to-hast | 13.2.0 | 13.2.1 | codemirror-json-schema → shiki → @shikijs/core → hast-util-to-html → mdast-util-to-hast |
| postcss-selector-parser | 6.0.13, 7.1.1 | 7.1.7 | tailwindcss → postcss-selector-parser |
| rollup | 4.54.0 | Removed | @storybook/addon-docs → @storybook/csf-plugin → rollup |
| source-map-js | 1.2.1, 1.2.2 | 1.2.2 | postcss → source-map-js |
| sprintf-js | 1.0.3 | Removed | @apidevtools/swagger-cli → js-yaml → argparse → sprintf-js |
| svgo | 3.0.2, 4.0.1 | 3.3.5, 4.1.0 | @svgr/webpack → @svgr/plugin-svgo → svgo |
| validator | 13.7.0 | Removed | @apidevtools/swagger-cli → @apidevtools/swagger-parser → z-schema → validator |
| webpack-dev-middleware | 6.1.3 | Removed | @storybook/react-webpack5 → @storybook/builder-webpack5 → webpack-dev-middleware |
| ws | 7.5.13, 8.19.0 | 8.22.0 | jsdom → ws |

## All 61 GitHub alert dispositions

The accompanying [machine-readable inventory](dependency-npm-alerts.json) preserves every alert number, advisory id, original version/range and published patch (including null/NO_PATCH). `pnpm check:npm-security` checks every lockfile package-version record against all these ranges and fails closed on invalid ranges. Its tests first prove that each original affected version is detected, including GitHub’s comma-separated range syntax. It does not replace fresh advisory feeds.

| Alert | Advisory | Package / original version | Vulnerable range | First published patch | Final graph |
| --- | --- | --- | --- | --- | --- |
| #29 | [GHSA-968p-4wvh-cqc8](https://github.com/advisories/GHSA-968p-4wvh-cqc8) | @babel/runtime 7.26.0 | `< 7.26.10` | 7.26.10 | 7.29.10 |
| #30 | [GHSA-v6h2-p8h4-qcjw](https://github.com/advisories/GHSA-v6h2-p8h4-qcjw) | brace-expansion 1.1.11 | `>= 1.0.0, <= 1.1.11` | 1.1.12 | 1.1.21, 5.0.12 |
| #31 | [GHSA-q58r-hwc8-rm9j](https://github.com/advisories/GHSA-q58r-hwc8-rm9j) | bootstrap 3.4.1 | `= 3.4.1` | NO_PATCH | Removed |
| #32 | [GHSA-vxmc-5x29-h64v](https://github.com/advisories/GHSA-vxmc-5x29-h64v) | bootstrap 3.4.1 | `>= 1.4.0, <= 3.4.1` | NO_PATCH | Removed |
| #33 | [GHSA-9965-vmph-33xx](https://github.com/advisories/GHSA-9965-vmph-33xx) | validator 13.7.0 | `< 13.15.20` | 13.15.20 | Removed |
| #34 | [GHSA-4fh9-h7wg-q85m](https://github.com/advisories/GHSA-4fh9-h7wg-q85m) | mdast-util-to-hast 13.2.0 | `>= 13.0.0, < 13.2.1` | 13.2.1 | 13.2.1 |
| #35 | [GHSA-vghf-hv5q-vc2g](https://github.com/advisories/GHSA-vghf-hv5q-vc2g) | validator 13.7.0 | `< 13.15.22` | 13.15.22 | Removed |
| #39 | [GHSA-mw96-cpmx-2vgc](https://github.com/advisories/GHSA-mw96-cpmx-2vgc) | rollup 4.54.0 | `>= 4.0.0, < 4.59.0` | 4.59.0 | Removed |
| #40 | [GHSA-xpqw-6gx7-v673](https://github.com/advisories/GHSA-xpqw-6gx7-v673) | svgo 3.0.2 | `>= 3.0.0, < 3.3.3` | 3.3.3 | 3.3.5, 4.1.0 |
| #45 | [GHSA-f886-m6hf-6m8v](https://github.com/advisories/GHSA-f886-m6hf-6m8v) | brace-expansion 1.1.11 | `< 1.1.13` | 1.1.13 | 1.1.21, 5.0.12 |
| #49 | [GHSA-fv7c-fp4j-7gwp](https://github.com/advisories/GHSA-fv7c-fp4j-7gwp) | @babel/plugin-transform-modules-systemjs 7.23.3 | `>= 7.12.0, <= 7.29.3` | 7.29.4 | 7.29.8 |
| #51 | [GHSA-58qx-3vcg-4xpx](https://github.com/advisories/GHSA-58qx-3vcg-4xpx) | ws 8.19.0 | `>= 8.0.0, < 8.20.1` | 8.20.1 | 8.22.0 |
| #54 | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) | esbuild 0.27.3 | `>= 0.27.3, < 0.28.1` | 0.28.1 | 0.28.2 |
| #55 | [GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p) | ws 8.19.0 | `>= 8.0.0, < 8.21.0` | 8.21.0 | 8.22.0 |
| #57 | [GHSA-hmw2-7cc7-3qxx](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx) | form-data 4.0.5 | `>= 4.0.0, < 4.0.6` | 4.0.6 | 4.0.6 |
| #58 | [GHSA-6v5v-wf23-fmfq](https://github.com/advisories/GHSA-6v5v-wf23-fmfq) | markdown-it 12.3.2 | `<= 14.1.1` | 14.2.0 | 14.3.3 |
| #59 | [GHSA-22p9-wv53-3rq4](https://github.com/advisories/GHSA-22p9-wv53-3rq4) | linkify-it 3.0.3 | `<= 5.0.0` | 5.0.1 | 5.0.2 |
| #60 | [GHSA-h67p-54hq-rp68](https://github.com/advisories/GHSA-h67p-54hq-rp68) | js-yaml 4.1.1 | `>= 4.0.0, <= 4.1.1` | 4.2.0 | 4.3.2, 5.5.0 |
| #61 | [GHSA-h67p-54hq-rp68](https://github.com/advisories/GHSA-h67p-54hq-rp68) | js-yaml 3.14.2 | `< 3.15.0` | 3.15.0 | 4.3.2, 5.5.0 |
| #62 | [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) | brace-expansion 5.0.5 | `>= 3.0.0, < 5.0.7` | 5.0.7 | 1.1.21, 5.0.12 |
| #63 | [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) | brace-expansion 1.1.11 | `< 1.1.16` | 1.1.16 | 1.1.21, 5.0.12 |
| #64 | [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m) | js-yaml 3.14.2 | `>= 3.0.0, < 3.15.0` | 3.15.0 | 4.3.2, 5.5.0 |
| #65 | [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m) | js-yaml 4.1.1 | `>= 4.0.0, < 4.3.0` | 4.3.0 | 4.3.2, 5.5.0 |
| #67 | [GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6) | fast-uri 3.1.0 | `>= 3.0.0, < 3.1.3` | 3.1.3 | 3.1.9 |
| #68 | [GHSA-v245-v573-v5vm](https://github.com/advisories/GHSA-v245-v573-v5vm) | linkify-it 3.0.3 | `<= 5.0.1` | 5.0.2 | 5.0.2 |
| #69 | [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) | svgo 3.0.2 | `>= 3.0.0, < 3.3.4` | 3.3.4 | 3.3.5, 4.1.0 |
| #70 | [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) | svgo 4.0.1 | `>= 4.0.0, < 4.0.2` | 4.0.2 | 3.3.5, 4.1.0 |
| #71 | [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx) | fast-uri 3.1.0 | `>= 3.0.0, <= 3.1.3` | 3.1.4 | 3.1.9 |
| #74 | [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | brace-expansion 1.1.11 | `< 1.1.17` | 1.1.17 | 1.1.21, 5.0.12 |
| #76 | [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | brace-expansion 1.1.11 | `< 1.1.18` | 1.1.18 | 1.1.21, 5.0.12 |
| #79 | [GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7) | fast-uri 3.1.0 | `>= 3.0.0, < 3.1.5` | 3.1.5 | 3.1.9 |
| #80 | [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) | js-yaml 4.1.1 | `>= 4.0.0, < 4.3.1` | 4.3.1 | 4.3.2, 5.5.0 |
| #81 | [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) | js-yaml 3.14.2 | `>= 3.0.0, < 3.15.1` | 3.15.1 | 4.3.2, 5.5.0 |
| #83 | [GHSA-v39h-62p7-jpjc](https://github.com/advisories/GHSA-v39h-62p7-jpjc) | fast-uri 3.1.0 | `>= 3.0.0, <= 3.1.1` | 3.1.2 | 3.1.9 |
| #84 | [GHSA-q3j6-qgpj-74h6](https://github.com/advisories/GHSA-q3j6-qgpj-74h6) | fast-uri 3.1.0 | `>= 3.0.0, <= 3.1.0` | 3.1.1 | 3.1.9 |
| #86 | [GHSA-w9m9-85wc-3x92](https://github.com/advisories/GHSA-w9m9-85wc-3x92) | postcss-selector-parser 7.1.1 | `>= 7.1.0, < 7.1.3` | 7.1.3 | 7.1.7 |
| #87 | [GHSA-73wf-gq98-2v4g](https://github.com/advisories/GHSA-73wf-gq98-2v4g) | browserslist 4.28.2 | `<= 4.28.6` | 4.28.7 | 4.29.4 |
| #90 | [GHSA-p498-v437-472g](https://github.com/advisories/GHSA-p498-v437-472g) | @humanfs/node 0.16.7 | `< 0.16.8` | 0.16.8 | 0.16.8 |
| #92 | [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp) | fast-uri 3.1.0 | `>= 3.0.0, < 3.1.6` | 3.1.6 | 3.1.9 |
| #93 | [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) | fast-uri 3.1.0 | `>= 3.0.0, < 3.1.6` | 3.1.6 | 3.1.9 |
| #95 | [GHSA-w5vr-8v7q-w6rv](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv) | baseline-browser-mapping 2.10.33 | `>= 2.0.0, < 2.11.0` | 2.11.0 | 2.11.30 |
| #98 | [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j87) | svgo 3.0.2 | `>= 3.0.0, < 3.3.5` | 3.3.5 | 3.3.5, 4.1.0 |
| #99 | [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j87) | svgo 4.0.1 | `>= 4.0.0, < 4.1.0` | 4.1.0 | 3.3.5, 4.1.0 |
| #100 | [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r) | svgo 3.0.2 | `>= 3.0.0, < 3.3.5` | 3.3.5 | 3.3.5, 4.1.0 |
| #101 | [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r) | svgo 4.0.1 | `>= 4.0.0, < 4.1.0` | 4.1.0 | 3.3.5, 4.1.0 |
| #102 | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | js-yaml 4.1.1 | `>= 4.0.0, < 4.3.2` | 4.3.2 | 4.3.2, 5.5.0 |
| #103 | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | js-yaml 3.14.2 | `>= 3.0.0, < 3.15.2` | 3.15.2 | 4.3.2, 5.5.0 |
| #104 | [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3) | fast-uri 3.1.0 | `>= 3.0.0, < 3.1.7` | 3.1.7 | 3.1.9 |
| #105 | [GHSA-g84c-rxfj-3j2c](https://github.com/advisories/GHSA-g84c-rxfj-3j2c) | webpack-dev-middleware 6.1.3 | `< 7.4.5` | 7.4.6 | Removed |
| #106 | [GHSA-253c-mchw-3w2r](https://github.com/advisories/GHSA-253c-mchw-3w2r) | markdown-it 12.3.2 | `< 14.3.1` | 14.3.1 | 14.3.3 |
| #108 | [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | brace-expansion 1.1.11 | `< 1.1.19` | 1.1.19 | 1.1.21, 5.0.12 |
| #110 | [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | brace-expansion 1.1.11 | `< 1.1.20` | 1.1.20 | 1.1.21, 5.0.12 |
| #111 | [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | brace-expansion 5.0.5 | `>= 4.0.0, < 5.0.12` | 5.0.12 | 1.1.21, 5.0.12 |
| #112 | [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | brace-expansion 1.1.11 | `< 1.1.21` | 1.1.21 | 1.1.21, 5.0.12 |
| #127 | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | braces 3.0.3 | `<= 3.0.3` | NO_PATCH | Removed |
| #128 | [GHSA-jggr-w7fw-pc2j](https://github.com/advisories/GHSA-jggr-w7fw-pc2j) | fast-copy 3.0.2 | `>= 3.0.0, < 3.1.0` | 3.1.0 | 3.1.0 |
| #129 | [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) | postcss-selector-parser 6.0.13 | `< 7.1.6` | 7.1.6 | 7.1.7 |
| #130 | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | source-map-js 1.2.1 | `>= 1.0.0, < 1.2.2` | 1.2.2 | 1.2.2 |
| #131 | [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | sprintf-js 1.0.3 | `<= 1.1.3` | NO_PATCH | Removed |
| #134 | [GHSA-r7fv-28h4-cvq7](https://github.com/advisories/GHSA-r7fv-28h4-cvq7) | markdown-it 12.3.2 | `< 14.3.2` | 14.3.2 | 14.3.3 |
| #141 | [GHSA-vfgh-jcmw-g37q](https://github.com/advisories/GHSA-vfgh-jcmw-g37q) | markdown-it 12.3.2 | `< 14.3.3` | 14.3.3 | 14.3.3 |

## Verification

Results are recorded below after the final runs; these are frontend/dependency checks only. Live Docker/Swarm/Podman/Kubernetes/Azure backends and Sonar access belong to the parent task.
