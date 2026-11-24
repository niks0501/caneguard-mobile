#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
# Resolve the selected checkout, not the registered original project.
repo="$(git -C "${T3CODE_WORKTREE_PATH:-$PWD}" rev-parse --show-toplevel)"
repo="$(realpath -e -- "$repo")"
[[ -f "$repo/.git" && ! -L "$repo/.git" ]] || { echo 'Refusing main checkout. Select a linked worktree.' >&2; exit 1; }
[[ "$(git -C "$repo" rev-parse --path-format=absolute --git-dir)" != "$(git -C "$repo" rev-parse --path-format=absolute --git-common-dir)" ]] || { echo 'Refusing main checkout.' >&2; exit 1; }
cd "$repo"
[[ -f app.config.js && -f scripts/live-up.js && -f package-lock.json ]] || { echo 'Not a CaneGuard Mobile checkout.' >&2; exit 1; }
[[ ! -L .env ]] || { echo 'Refusing linked .env.' >&2; exit 1; }
if git ls-files --error-unmatch -- .env >/dev/null 2>&1 || ! git check-ignore -q -- .env; then echo '.env must be untracked and ignored.' >&2; exit 1; fi
if [[ ! -e .env ]]; then
  cp -- .env.example .env
fi
[[ -f .env && "$(stat -c %h -- .env)" == 1 ]] || { echo 'Unsafe .env.' >&2; exit 1; }
chmod 600 .env
npm ci --no-audit --no-fund
# Reuse the original checkout's fingerprint-keyed APK cache, if present.
if [[ -n "${T3CODE_PROJECT_ROOT:-}" && -d "$T3CODE_PROJECT_ROOT/.apk-cache" && ! -e .apk-cache && ! -L .apk-cache ]]; then
  original="$(realpath -e -- "$T3CODE_PROJECT_ROOT")"
  if [[ "$original" != "$repo" && "$(git -C "$original" rev-parse --path-format=absolute --git-common-dir)" == "$(git rev-parse --path-format=absolute --git-common-dir)" ]]; then
    ln -s -- "$original/.apk-cache" .apk-cache
    echo 'Reusing fingerprint-keyed APK cache.'
  fi
fi
echo 'Mobile worktree prepared. Verify the API target in .env before starting Metro.'
