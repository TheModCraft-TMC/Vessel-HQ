const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

function launch() {
  const children = [];
  const supervisor = Object.assign(new EventEmitter(), {
    env: {},
    argv: ['node', 'next-entrypoint.js', '--version'],
    execPath: 'node',
  });

  vm.runInNewContext(
    readFileSync(path.join(__dirname, 'next-entrypoint.js'), 'utf8'),
    {
      process: supervisor,
      require() {
        return {
          spawn() {
            const child = Object.assign(new EventEmitter(), {
              signals: [],
              kill(signal) {
                this.signals.push(signal);
              },
            });
            children.push(child);
            return child;
          },
        };
      },
    }
  );

  return { supervisor, frontend: children[0], backend: children[1] };
}

test('successful backend exit remains successful after frontend shutdown', () => {
  const { supervisor, frontend, backend } = launch();
  backend.emit('exit', 0, null);
  assert.deepEqual(frontend.signals, ['SIGTERM']);
  frontend.emit('exit', null, 'SIGTERM');
  assert.equal(supervisor.exitCode, 0);
});

test('backend failure is preserved after frontend shutdown', () => {
  const { supervisor, frontend, backend } = launch();
  backend.emit('exit', 7, null);
  frontend.emit('exit', null, 'SIGTERM');
  assert.equal(supervisor.exitCode, 7);
});

test('frontend failure is preserved after backend shutdown', () => {
  const { supervisor, frontend, backend } = launch();
  frontend.emit('exit', 2, null);
  assert.deepEqual(backend.signals, ['SIGTERM']);
  backend.emit('exit', null, 'SIGTERM');
  assert.equal(supervisor.exitCode, 2);
});

test('unexpected child signal produces a failing exit status', () => {
  const { supervisor, frontend, backend } = launch();
  frontend.emit('exit', null, 'SIGKILL');
  backend.emit('exit', null, 'SIGTERM');
  assert.equal(supervisor.exitCode, 1);
});
