#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend/cartunez-medusa"
COMPOSE="$ROOT/backend/docker-compose.verify.yml"
RUNTIME_DIR="$(mktemp -d)"
export NODE_ENV=test
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:ci-postgres-password@127.0.0.1:5432/cartunez_ci}"
export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}"
export MEILISEARCH_HOST="${MEILISEARCH_HOST:-http://127.0.0.1:7700}"
export MEILISEARCH_API_KEY="${MEILISEARCH_API_KEY:-ci-meilisearch-master-key}"
export JWT_SECRET="${JWT_SECRET:-ci-jwt-secret-at-least-thirty-two-characters}"
export COOKIE_SECRET="${COOKIE_SECRET:-ci-cookie-secret-at-least-thirty-two-characters}"
export STORE_CORS="${STORE_CORS:-http://127.0.0.1:8000}"
export ADMIN_CORS="${ADMIN_CORS:-http://127.0.0.1:9000}"
export MEDUSA_PUBLIC_URL="${MEDUSA_PUBLIC_URL:-http://127.0.0.1:9000}"
export MEDUSA_SMOKE_URL="${MEDUSA_SMOKE_URL:-http://127.0.0.1:9000}"
export APEXBOOKS_ENABLED=false
export CONFIRM_DISPOSABLE_DATABASE=yes
export ALLOW_TEST_ORDER_COMPLETION=true

command -v docker >/dev/null || { echo "Docker is required" >&2; exit 1; }
test -f "$BACKEND/package-lock.json" || { echo "Generate and review the backend lockfile with a complete public-registry npm install first." >&2; exit 1; }

cleanup() {
  if [[ -n "${MEDUSA_PID:-}" ]]; then kill "$MEDUSA_PID" 2>/dev/null || true; fi
  docker compose -f "$COMPOSE" down --volumes --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$RUNTIME_DIR"
}
trap cleanup EXIT
show_failure() {
  if [[ -f "$RUNTIME_DIR/medusa.log" ]]; then
    node "$BACKEND/scripts/redact-log.js" "$RUNTIME_DIR/medusa.log" "$RUNTIME_DIR/medusa.sanitized.log"
    cat "$RUNTIME_DIR/medusa.sanitized.log" >&2
  fi
}
trap show_failure ERR

cd "$BACKEND"
node scripts/verify-ci-environment.js
docker compose -f "$COMPOSE" up -d --wait
docker compose -f "$COMPOSE" exec -T postgres postgres --version
docker compose -f "$COMPOSE" exec -T redis redis-server --version
for _ in $(seq 1 30); do
  curl --fail --silent "$MEILISEARCH_HOST/version" && break
  sleep 2
done
curl --fail --silent "$MEILISEARCH_HOST/version" >/dev/null

npm ci
npm ls typeorm @medusajs/medusa
if npm ls medusa-extender --depth=0 >/dev/null 2>&1; then echo "medusa-extender must remain absent" >&2; exit 1; fi
npm test
npm run typecheck
npm run build
npm run migrations:show
npx --no-install medusa migrations run
npm run migrations:run
npm run migrations:show
npm run migrations:run
npm run seed

npm run start:dev > "$RUNTIME_DIR/medusa.log" 2>&1 &
MEDUSA_PID=$!
for _ in $(seq 1 60); do
  curl --fail --silent http://127.0.0.1:9000/ready >/dev/null && break
  sleep 2
done
curl --fail --silent http://127.0.0.1:9000/health
curl --fail --silent http://127.0.0.1:9000/ready
npm run test:integration
npm run smoke:store

cd "$ROOT/frontend"
npm ci
npm test
npm run lint
npx tsc --noEmit
npm run build
