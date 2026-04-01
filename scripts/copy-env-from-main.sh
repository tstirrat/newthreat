#!/usr/bin/env bash
# Copies local env/secrets files from the main worktree into this worktree.
# Safe to run from any linked worktree or from the main worktree itself.
#
# Files copied (if present in main worktree):
#   apps/api/.dev.vars
#   apps/web/.env.local
#   apps/web/.env.production.local

set -euo pipefail

CURRENT=$(git rev-parse --show-toplevel)
MAIN=$(git worktree list --porcelain | awk '/^worktree/{print $2; exit}')

if [ "$CURRENT" = "$MAIN" ]; then
  echo "Already in the main worktree — nothing to copy." >&2
  exit 0
fi

ENV_FILES=(
  "apps/api/.dev.vars"
  "apps/web/.env.local"
)

copied=0
skipped=0

for rel in "${ENV_FILES[@]}"; do
  src="$MAIN/$rel"
  dest="$CURRENT/$rel"

  if [ ! -f "$src" ]; then
    echo "  skip  $rel  (not found in main worktree)"
    ((skipped++)) || true
    continue
  fi

  if [ -f "$dest" ]; then
    echo "  skip  $rel  (already exists in this worktree)"
    ((skipped++)) || true
    continue
  fi

  cp "$src" "$dest"
  echo "  copy  $rel"
  ((copied++)) || true
done

echo ""
echo "Done: $copied copied, $skipped skipped."
echo "  main worktree : $MAIN"
echo "  this worktree : $CURRENT"
