#!/usr/bin/env bash
set -euo pipefail

repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
next_build="$repository_root/web-src/.next"
output="$repository_root/dist/next"

if [[ "${1:-}" == "--clean" ]]; then
  rm -rf "$output"
  exit 0
fi

if [[ ! -f "$next_build/standalone/web-src/server.js" ]]; then
  echo "Next.js standalone server is missing; run the production build first." >&2
  exit 1
fi

rm -rf "$output"
mkdir -p "$output/web-src/.next"
cp -R "$next_build/standalone/." "$output/"
cp -R "$next_build/static" "$output/web-src/.next/static"

if [[ -d "$repository_root/web-src/public" ]]; then
  cp -R "$repository_root/web-src/public" "$output/web-src/public"
fi
