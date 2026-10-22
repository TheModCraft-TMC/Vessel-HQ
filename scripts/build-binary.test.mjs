import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modules = {
  'github.com/moby/moby/client': 'v0.5.1',
  'github.com/docker/compose/v5': 'v5.3.1',
  'k8s.io/kubectl': 'v0.35.2',
  'helm.sh/helm/v4': 'v4.1.4',
};

function buildFixture(args, failModule = '') {
  const root = mkdtempSync(join(tmpdir(), 'vessel-build-binary-'));
  try {
    mkdirSync(join(root, 'bin'));
    mkdirSync(join(root, 'backend-src/api'), { recursive: true });
    mkdirSync(join(root, 'mustache-templates'));
    writeFileSync(join(root, 'RELEASE_VERSION'), '1.3.1\n');
    writeFileSync(join(root, 'bin/go'), `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
if (args[0] === '-C') {
  const versions = ${JSON.stringify(modules)};
  const moduleName = args.at(-1);
  if (!Object.hasOwn(versions, moduleName) || moduleName === process.env.FAIL_MODULE) {
    process.stderr.write('module lookup failed: ' + moduleName + '\\n');
    process.exit(42);
  }
  process.stdout.write(versions[moduleName] + '\\n');
} else if (args[0] === 'build') {
  fs.writeFileSync(process.env.BUILD_CAPTURE, JSON.stringify({
    args, platform: process.env.GOOS, arch: process.env.GOARCH,
    cgo: process.env.CGO_ENABLED,
  }));
} else {
  process.stderr.write('unexpected go command: ' + JSON.stringify(args));
  process.exit(43);
}
`, { mode: 0o755 });
    const capture = join(root, 'build.json');
    const result = spawnSync('bash', [join(repoRoot, 'build/build_binary.sh'), ...args], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${join(root, 'bin')}:${process.env.PATH}`,
        BUILD_SOURCESDIRECTORY: root,
        BUILD_CAPTURE: capture,
        FAIL_MODULE: failModule,
        SKIP_GO_GET: 'true',
        NODE_VERSION: 'v24.22.1',
        PNPM_VERSION: '10.26.2',
        WEBPACK_VERSION: '5.112.0',
        GO_VERSION: 'go1.26.6',
        GIT_COMMIT_HASH: 'fixture',
        RELEASE_VERSION: '1.3.1',
      },
    });
    return {
      ...result,
      build: existsSync(capture) ? JSON.parse(readFileSync(capture, 'utf8')) : null,
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('build metadata uses the maintained split SDK and Compose modules', () => {
  const result = buildFixture(['linux', 'amd64']);
  assert.equal(result.status, 0, result.stderr);
  const { args, platform, arch, cgo } = result.build;
  const flags = args[args.indexOf('--ldflags') + 1];
  for (const [field, version] of Object.entries({
    DockerVersion: modules['github.com/moby/moby/client'],
    ComposeVersion: modules['github.com/docker/compose/v5'],
    KubectlVersion: 'v1.35.2',
    HelmVersion: modules['helm.sh/helm/v4'],
  })) {
    assert.ok(flags.includes(`pkg/build.Dep${field}=${version}'`), flags);
  }
  assert.ok(flags.includes("pkg/build.ReleaseVersion=1.3.1'"), flags);
  assert.equal(platform, 'linux');
  assert.equal(arch, 'amd64');
  assert.equal(cgo, '0');
  assert.equal(args[args.indexOf('-o') + 1], '../../dist/portainer');
});

test('Windows packaging keeps the executable suffix', () => {
  const result = buildFixture(['windows', 'arm64']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.build.platform, 'windows');
  assert.equal(result.build.arch, 'arm64');
  assert.equal(result.build.args[result.build.args.indexOf('-o') + 1], '../../dist/portainer.exe');
});

test('failed dependency metadata lookup stops before compiling', () => {
  const result = buildFixture(['linux', 'amd64'], 'github.com/moby/moby/client');
  assert.equal(result.status, 42);
  assert.match(result.stderr, /module lookup failed: github\.com\/moby\/moby\/client/);
  assert.equal(result.build, null);
});
