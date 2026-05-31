#!/usr/bin/env bash
# Pulls latest changes from upstream into the lib/ subtree.
set -e
echo "Syncing upstream milancodess/universalDownloader..."
git fetch upstream
git subtree pull --prefix=lib upstream/main --squash -m "chore: sync upstream"
echo "Done. Review changes in lib/services/ and update src/ if APIs changed."
