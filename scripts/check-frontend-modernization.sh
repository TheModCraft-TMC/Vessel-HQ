#!/usr/bin/env bash

set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

failed=0
frontend_roots=(
  web-src/core
  web-src/domains
  web-src/providers
  web-src/shared
  web-src/ui
)

check_limit() {
  local label=$1
  local actual=$2
  local maximum=$3

  if (( actual > maximum )); then
    echo "ERROR: ${label} increased from the ratchet limit ${maximum} to ${actual}."
    failed=1
  else
    echo "${label}: ${actual}/${maximum}"
  fi
}

count_matches() {
  local pattern=$1
  shift
  (rg -o "$pattern" "$@" || true) | wc -l | tr -d ' '
}

# September 20, 2026 migration baseline. Lower a limit in the same change
# whenever legacy code or frontend polling is removed.
check_limit "React-to-Angular adapters" "$(count_matches 'r2a\(|react2angular\(' "${frontend_roots[@]}" --glob '*.{js,ts,tsx}')" 0
check_limit "Angular runtime imports" "$(count_matches "from ['\"]angular['\"]|import angular|angular\\.module|@uirouter/angularjs|@uirouter/react-hybrid" "${frontend_roots[@]}" package.json --glob '*.{js,jsx,ts,tsx,json}')" 0
check_limit "Angular package entries" "$(count_matches '"'"'(angular|angular-|angularjs-|@uirouter/angularjs|@uirouter/react-hybrid|ng-file-upload|ngtemplate-loader)'"'"' package.json)" 0
check_limit "Angular route registrations" "$(count_matches '\$stateRegistryProvider\.register' "${frontend_roots[@]}" --glob '*.{js,ts,tsx}')" 0
check_limit "UI-Router references" "$(count_matches '@uirouter|UIRouterReact|UIRouterContext|registerReactState|lazyRoute\(' web-src package.json --glob '*.{js,jsx,ts,tsx,json}')" 0
check_limit "Hash-route references" "$(count_matches '#!' web-src --glob '*.{js,jsx,ts,tsx}' --glob '!*.test.*')" 0
check_limit "Legacy HTML templates" "$(rg --files "${frontend_roots[@]}" -g '*.html' | wc -l | tr -d ' ')" 0
check_limit "Angular controllers" "$(rg --files "${frontend_roots[@]}" -g '*Controller.js' | wc -l | tr -d ' ')" 0
check_limit "Legacy configured Axios imports" "$(count_matches "@/(react/)?portainer/services/axios/axios|@/portainer/services/axios/utils/(isAxiosError|parseAxiosError)" web-src --glob '*.{js,jsx,ts,tsx}')" 0
check_limit "Legacy source root" "$(find web-src -maxdepth 1 -type d -name legacy | wc -l | tr -d ' ')" 0
check_limit "Legacy JavaScript files" "$(
  find "${frontend_roots[@]}" -type f -name '*.js' | wc -l | tr -d ' '
)" 0
check_limit "App Router page domain barrel imports" "$(count_matches "from ['\"]@/domains/[^/'\"]+['\"]" web-src/app --glob '**/page.{js,jsx,ts,tsx}')" 0
# Three migrated views intentionally use React Query's bounded polling for
# user-configured auto-refresh and live container statistics.
check_limit "Production React Query polling references" "$(count_matches 'refetchInterval' "${frontend_roots[@]}" --glob '*.{js,jsx,ts,tsx}' --glob '!*.test.*' --glob '!*.stories.*')" 3
check_limit "Production Angular polling references" "$(count_matches '\$interval' "${frontend_roots[@]}" --glob '*.{js,jsx,ts,tsx}' --glob '!*.test.*' --glob '!*.stories.*')" 0

if (( failed != 0 )); then
  echo "Frontend modernization debt may only move downward."
  exit 1
fi
