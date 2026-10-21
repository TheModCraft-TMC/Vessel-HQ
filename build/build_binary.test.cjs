const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

function fixture(t) {
  // Include spaces to exercise quoting of source and version-file paths.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vessel binary build '));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'backend-src/api'), { recursive: true });
  fs.mkdirSync(path.join(root, 'mustache-templates'));
  fs.mkdirSync(path.join(root, 'bin'));
  fs.writeFileSync(path.join(root, 'RELEASE_VERSION'), '1.3.1\n');
  fs.writeFileSync(
    path.join(root, 'bin/go'),
    `#!/bin/bash
set -eu
printf '%s:%s %s\\n' "\${GOOS:-}" "\${GOARCH:-}" "$*" >> "$BUILD_LOG"
case "$*" in
  *'k8s.io/kubectl') echo v0.33.2 ;;
  *'list -m'*) echo v1.2.3 ;;
  'env GOOS') echo darwin ;;
  'env GOARCH') echo arm64 ;;
esac
`,
    { mode: 0o755 }
  );
  const env = {
    ...process.env,
    PATH: `${path.join(root, 'bin')}:${process.env.PATH}`,
    BUILD_SOURCESDIRECTORY: root,
    BUILD_LOG: path.join(root, 'build.log'),
    RELEASE_VERSION: '1.3.1',
    NODE_VERSION: 'v24.22.1',
    PNPM_VERSION: '10.26.2',
    WEBPACK_VERSION: '5',
    GO_VERSION: 'go1.26.6',
    GIT_COMMIT_HASH: 'test-commit',
    SKIP_GO_GET: 'true',
  };
  return {
    root,
    run(args = [], overrides = {}) {
      fs.writeFileSync(env.BUILD_LOG, '');
      const result = spawnSync('/bin/bash', [path.join(__dirname, 'build_binary.sh'), ...args], {
        cwd: root,
        env: { ...env, ...overrides },
        encoding: 'utf8',
      });
      assert.ifError(result.error);
      return { ...result, log: fs.readFileSync(env.BUILD_LOG, 'utf8') };
    },
  };
}

test('rejects a missing release file before invoking Go', (t) => {
  const build = fixture(t);
  fs.unlinkSync(path.join(build.root, 'RELEASE_VERSION'));
  const result = build.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing release version file/);
  assert.equal(result.log, '');
});

test('defaults Darwin hosts to Linux and skips go get when requested', (t) => {
  const result = fixture(t).run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.log, /linux:arm64 build /);
  assert.match(result.log, /-o ..\/..\/dist\/portainer /);
  assert.match(result.log, /DepKubectlVersion=v1\.33\.2/);
  assert.doesNotMatch(result.log, /get -t/);
});

for (const arch of ['amd64', 'arm64']) {
  test(`preserves explicit linux/${arch} and runs go get when enabled`, (t) => {
    const result = fixture(t).run(['linux', arch], { SKIP_GO_GET: 'false' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.log, /get -t -v \.\/\.\.\./);
    assert.ok(result.log.includes(`linux:${arch} build `));
    assert.match(result.log, /ReleaseVersion=1\.3\.1/);
  });
}

test('Windows builds retain the exe extension', (t) => {
  const result = fixture(t).run(['windows', 'amd64']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.log, /windows:amd64 build /);
  assert.match(result.log, /-o ..\/..\/dist\/portainer\.exe /);
});
