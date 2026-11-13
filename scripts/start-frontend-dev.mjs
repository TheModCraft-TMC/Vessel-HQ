import { existsSync } from 'node:fs';
import process from 'node:process';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

process.env.PORTAINER_API_ORIGIN ||= `http://127.0.0.1:${process.env.PORTAINER_HTTP_PORT || '9000'}`;
process.env.DEV_AUTO_LOGIN = 'true';
const port = process.env.PORT || '8999';
process.argv = [process.argv[0], 'next', 'dev', 'web-src', '--turbopack', '--port', port];

await import('next/dist/bin/next');
