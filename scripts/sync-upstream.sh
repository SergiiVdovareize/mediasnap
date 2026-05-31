#!/usr/bin/env bash
# Pulls latest changes from upstream into the upstream/ subtree.
set -e
echo "Syncing upstream milancodess/universalDownloader..."
git fetch upstream
git subtree pull --prefix=upstream upstream/main --squash -m "chore: sync upstream"
echo "Done. Review changes in upstream/services/ and update src/ if APIs changed."
