# Console header pointer access

## Scope and cause

A real production-UI check found that, after closing the mobile drawer at 390px,
search covered the sidebar expand button. The actions' unbounded account name
and flex min-content sizing could squeeze the header start to zero. Keyboard
activation worked, but did not make this a pointer-access pass. This is a focused
presentation fix, not a header redesign or a claim of a dependency regression.

The header now reserves space for the sidebar control and keeps actions from
shrinking into it. Account text is bounded and ellipsized, with the complete
identity retained as the trigger's title. A named inline-size container switches
search and account text to compact controls when the **available header width**
is at most 720px. This also handles desktop widths with an expanded sidebar;
viewport-only mobile breakpoints cannot describe that available space. Menus,
accessible control names, search shortcuts, and sidebar state handling are unchanged.

## Isolated production verification

Use the production standalone build, never another development server or an
existing backend on localhost:9000. The canonical platform harness snapshots the
standalone artifact, rewrites only its private copy to its owned API, and creates
and cleans up its own real Dex/Vessel fixtures on random loopback ports. See
`docs/themodcraft/isolated-platform-verification.md` in the canonical checkout
for resource ownership and limitations.

```sh
export PATH=/Users/josh/.nvm/versions/node/v24.22.1/bin:$PATH
pnpm build
# Set HARNESS to the canonical platform_smoke.py in the verification checkout.
python3 "$HARNESS" --suites oauth \
  --binary /tmp/vessel-dep-go-candidate-linux-arm64 \
  --runtime-image vessel-issues-toolkit:arm64 \
  --frontend-standalone "$PWD/web-src/.next/standalone" \
  --playwright-module /tmp/vessel-rest-platform-tools/browser/node_modules/playwright \
  --chrome '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --oauth-screenshot /tmp/vessel-header-fixed-oauth.png \
  --output /tmp/vessel-header-fixed-oauth.json
```

This UI-only check uses the explicitly supplied candidate backend, SHA256
`c5543423d87ada7d86dd0596f57448ee215ef697b300b588448fdce08c1f83f2`,
reporting Go 1.26.6/source `46882c1d4`. It does **not** certify a later final backend
artifact or external BE deployment. No API contracts, dependencies, Go source,
or infrastructure configuration are changed here.

### Results

Before: this workspace's unchanged production sources at `d94f6bb0f`, build
`wXvPeb0KGZYM4848TydOx`, standalone server SHA256
`6509d95591645975cc25ec0ca8175e387aacdac7eaffa368d52ce1277eda222e`.
`/tmp/vessel-header-before.json` reproduces the 390px pointer failure: the
34×34 sidebar expand button's center hits `GlobalSearch_trigger` instead.
Real OAuth, identity/ACL, cookie-session reload, and closed-drawer main-content
search/sort passed. The suite correctly failed overall; keyboard drawer activation
was not counted as a pointer pass. Cleanup failures: zero. Safe application
screenshots: `/tmp/vessel-header-before.png` and
`/tmp/vessel-header-before-mobile.png`.

After: source fix `6764172c4`, production build **`c0Yah-7hoYnjIv-fIvM8M`**.
The standalone bootstrap server SHA256 remains
`6509d95591645975cc25ec0ca8175e387aacdac7eaffa368d52ce1277eda222e`;
this generated bootstrap is unchanged, while the build ID and client assets are
new. The built header CSS is `.next/static/css/ccbe8a789366fc93.css`, SHA256
`a4426ba61e7714eabaf9dfaaa11c948325238275e07d1488b114d19b5eeae279`.

- `/tmp/vessel-header-fixed-oauth.json`: **passed**, 15.3 seconds. Real Dex
  authorization-code flow and frontend callback, invalid-state rejection,
  standard-user provisioning/ACL denial, cookie-session reload, main-content
  search/sort, and actual pointer drawer open/close all passed.
- `/tmp/vessel-header-fixed-matrix-oauth.json`: **passed**, 87.5 seconds, including
  the same real OAuth checks and the extended presentation matrix below.
- Both reports have **zero cleanup failures**. Read-only Docker checks also found
  no remaining containers, networks, or volumes for their exact owned prefixes
  `vessel-rest-platform-4c4bdf07c0` and `vessel-rest-platform-606ec9402c`.
- Safe final application screenshots reviewed:
  `/tmp/vessel-header-fixed-oauth.png` (1100px) and
  `/tmp/vessel-header-fixed-oauth-mobile.png` (390px, closed drawer).
  No populated login/password form, token, or private infrastructure is shown.
  Screenshots and reports remain private temporary artifacts, not repository assets.

At 390px, the corrected sidebar control occupies **x=16–50**, search **x=206–240**,
and the user trigger **x=332–366**, all 34×34px. They receive their own pointer
hits, with no overlapping control rectangles. The canonical pass does not use
forced clicks or keyboard fallback to turn a pointer failure into a pass.

### Extended production browser matrix

`/tmp/vessel-header-fixed-matrix.json`: **56/56 cases passed**, covering
320/390/720/721/900/1100/1440px, ordinary and 656-character unbroken account names,
normal and extra-action geometry, and sidebar scenarios. Browser-only
`/api/users/me` response fixtures change **only Username** after real OAuth/ACL
checks; authentication, user ID, roles, and the backend remain real and unchanged.
The extra action copies the existing help-link geometry to stress space equivalent
to an additional BE header action. This is **not** a claim of BE license/runtime
verification.

Every case checks natural pointer trial hits and center hits for visible header
buttons/links, pairwise control-rectangle non-overlap, viewport bounds and document
width, search dialog pointer open/close and input focus, and account-menu pointer
open plus Escape/focus return. Long names ellipsize in full presentation and cannot
widen the compact account control. `/` and Ctrl+K also open search at 390px.
Desktop headers are checked with the sidebar expanded and collapsed, including
real pointer collapse/reopen cycles. On mobile the open drawer intentionally
covers the header: the test opens it with the header pointer control, uses its
actual close control, waits for the transition to finish, then checks the
closed-drawer header rather than bypassing the backdrop.

The private, syntax-checked Playwright wrapper and launchers remain outside git.
Exact local rerun launchers (after a stable `pnpm build`) are:

```sh
/tmp/vessel-header-fixed-oauth.sh
/tmp/vessel-header-fixed-matrix-oauth.sh
```

The second launcher passes `/tmp/vessel-header-browser-matrix.cjs` as the harness's
Playwright module; that wrapper delegates to the real installed driver and runs
the matrix before closing its owned browser. The canonical harness is not edited.
These helpers are session-local verification artifacts, not new runtime or project
test dependencies. Browser coverage is Chrome only; a full application test run
and final-backend certification remain the parent integration workflow's scope.

### Focused static and unit checks

All of these passed after the fix (the full application suite is intentionally
left to the parent's integration verification):

```sh
pnpm check:frontend-modernization
pnpm check:frontend-boundaries
pnpm check:app-router-compliance
pnpm typecheck
pnpm lint:ci
pnpm test web-src/ui/layouts/view-layout/page-header \
  web-src/core/console/layout/SidebarToggleButton.test.tsx \
  web-src/core/console/layout/headerBreadcrumbs.test.ts \
  web-src/core/console/navigation/GlobalSearch/GlobalSearch.test.ts
git diff --check
```

Focused tests: **8 files, 19 tests passed**. `lint:ci` also passed its CSS Module
check and seven guard tests; ESLint reported **zero errors, 192 warnings** in the
existing repository. The new account-menu test checks that a very long identity
is preserved in text/title without changing the accessible trigger name, and
that the account/logout menu items remain usable. JSDOM does not validate layout;
the production browser run is the pointer-access oracle.
