#!/bin/bash
# World Braille Day go-live, in three steps. Run from a worktree of the `world-braille-day` branch.
#
#   Before: put Delaney's copy in by hand (her paragraph; keep or drop the paid-lessons line; the
#   alphabet sheet or not), commit it on the branch. Approve on Jackson's Inbox `teachbraille-wbd-copy`
#   means the draft goes live as it is.
#
#   bash scripts/wbd-golive.sh check   # the whole "Before every merge" list (docs/accuracy/HANDOFF.md)
#   bash scripts/wbd-golive.sh merge   # merge the branch into master in /root/braille-course-web and push (deploys)
#   bash scripts/wbd-golive.sh live    # read the live page and sitemap back, geometry and axe against production
#
# Heavy steps go through `heavy` (falls back to running directly where it is absent).
set -euo pipefail
here=$(cd "$(dirname "$0")/.." && pwd)
main=/root/braille-course-web
site=https://teachbraille.org
port=${WBD_PORT:-3190}
h() { if command -v heavy >/dev/null; then heavy --label "wbd-$1" -- "${@:2}"; else "${@:2}"; fi; }

case "${1:-}" in
  check)
    cd "$here"
    [ "$(git branch --show-current)" = world-braille-day ] || { echo "not on world-braille-day" >&2; exit 1; }
    [ -z "$(git status --porcelain)" ] || { echo "commit the copy first" >&2; exit 1; }
    git merge-base --is-ancestor master HEAD || { echo "master has moved: git merge master, then rerun" >&2; exit 1; }
    [ -d node_modules ] || h npm-ci npm ci
    h format npm run format:check
    h lint npm run lint
    h tsc npx tsc --noEmit -p .
    h oracle npm run braille:oracle
    git diff --exit-code -- __tests__/fixtures/liblouis-oracle.json
    h build env NODE_ENV=production npm run build
    npm run start -- -p "$port" >/dev/null 2>&1 &
    server=$!
    trap 'kill $server 2>/dev/null || true' EXIT
    for _ in $(seq 60); do curl -fs "http://localhost:$port/world-braille-day" >/dev/null && break; sleep 1; done
    h geometry npm run braille:geometry -- "http://localhost:$port"
    h axe npm run a11y:axe -- "http://localhost:$port"
    echo "check: all green. Next: bash scripts/wbd-golive.sh merge"
    ;;
  merge)
    cd "$main"
    [ "$(git branch --show-current)" = master ] && [ -z "$(git status --porcelain)" ] || { echo "$main must be clean on master" >&2; exit 1; }
    git fetch -q origin
    git merge --ff-only origin/master
    git merge --no-edit world-braille-day
    git push origin master world-braille-day
    echo "pushed $(git rev-parse --short HEAD). Wait for the Vercel deploy, then: bash scripts/wbd-golive.sh live"
    ;;
  live)
    cd "$here"
    code=$(curl -s -o /dev/null -w '%{http_code}' "$site/world-braille-day")
    [ "$code" = 200 ] || { echo "page returned $code" >&2; exit 1; }
    sitemap=$(curl -fs "$site/sitemap.xml")
    [[ $sitemap == *"$site/world-braille-day"* ]] || { echo "sitemap lacks the page" >&2; exit 1; }
    home=$(curl -fs "$site/")
    [[ $home == *'href="/world-braille-day"'* ]] || echo "note: no home link (expected only December 1 to January 31)"
    h geometry npm run braille:geometry -- "$site"
    h axe npm run a11y:axe -- "$site"
    echo "live: page 200, in the sitemap, geometry and axe clean. Then one FYI line and the outreach note (Delaney's)."
    ;;
  *) sed -n '2,13p' "$0"; exit 2 ;;
esac
