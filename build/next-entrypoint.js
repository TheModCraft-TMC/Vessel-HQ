const { spawn } = require('node:child_process');

const frontendServer =
  process.env.PORTAINER_FRONTEND_SERVER || '/next/web-src/server.js';
const backendBinary = process.env.PORTAINER_BINARY || '/portainer';

const frontend = spawn(process.execPath, [frontendServer], {
  env: process.env,
  stdio: 'inherit',
});
const backend = spawn(backendBinary, process.argv.slice(2), {
  env: process.env,
  stdio: 'inherit',
});

let shuttingDown = false;

function stop(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  frontend.kill(signal);
  backend.kill(signal);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => stop(signal));
}

frontend.on('exit', (code, signal) => {
  if (!shuttingDown) {
    shuttingDown = true;
    process.exitCode = code ?? (signal ? 1 : 0);
    backend.kill('SIGTERM');
  }
});

backend.on('exit', (code, signal) => {
  if (!shuttingDown) {
    shuttingDown = true;
    process.exitCode = code ?? (signal ? 1 : 0);
    frontend.kill('SIGTERM');
  }
});
