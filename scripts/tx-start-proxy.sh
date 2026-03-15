#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  . "$NVM_DIR/nvm.sh"
  nvm use 20.19.0 >/dev/null || nvm install 20.19.0 >/dev/null
fi

cd "$ROOT_DIR/proxy"

if [[ ! -f .env ]]; then
  echo "proxy/.env is missing. Create proxy/.env from proxy/.env.example before starting the proxy." >&2
  exit 1
fi

pnpm run dev
