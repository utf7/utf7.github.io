#!/usr/bin/env bash
# Concatenate site CSS into one cacheable bundle (fixes relative octicon font paths).
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/assets/css/site.bundle.css"

{
  cat "$root/assets/vendor/primer-css/css/primer.css"
  cat "$root/assets/vendor/primer-markdown/dist/user-content.min.css"
  # Rewrite relative font URLs so they still resolve after relocating CSS.
  sed "s|url('octicons\\.|url('/assets/vendor/octicons/octicons/octicons.|g" \
    "$root/assets/vendor/octicons/octicons/octicons.css"
  cat "$root/assets/css/components/collection.css"
  cat "$root/assets/css/components/repo-card.css"
  cat "$root/assets/css/sections/repo-list.css"
  cat "$root/assets/css/sections/mini-repo-list.css"
  cat "$root/assets/css/components/boxed-group.css"
  cat "$root/assets/css/globals/common.css"
  cat "$root/assets/css/globals/responsive.css"
  cat "$root/assets/css/posts/index.css"
  cat "$root/assets/css/globals/prism.css"
  cat "$root/assets/css/modules/sidebar-search.css"
  cat "$root/assets/css/components/share.css"
  cat "$root/assets/css/components/site-extras.css"
  # Home-only rules are scoped under .home — safe to include globally.
  cat "$root/assets/css/pages/index.css"
} > "$out"

echo "Wrote $out ($(wc -c < "$out") bytes)"
