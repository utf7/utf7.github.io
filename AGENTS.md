# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single **Jekyll static blog** (Chinese personal blog, deployed to GitHub Pages via `.github/workflows/ci.yml`). There is no backend, database, or other service — the only runnable process is the Jekyll dev server. Dependencies are managed with Bundler using the `github-pages` gem (see `Gemfile`).

### Services

| Service | Run command | Notes |
|---|---|---|
| Jekyll dev server | `bundle exec jekyll serve --host 0.0.0.0 --port 4000` | Serves the site at `http://localhost:4000`. Add `--watch` (default) for auto-regeneration; use `--host 0.0.0.0` so it's reachable in the VM. |

### Build / test

- Build (what CI runs): `bundle exec jekyll build` → output in `_site/` (gitignored). There is no automated test suite or linter configured; "build succeeds + pages render" is the correctness bar.

### Non-obvious caveats

- Gems are installed to the **system gem path** (`/var/lib/gems`), so dependency installs require `sudo` (e.g. `sudo bundle install`). Running `bundle exec jekyll serve/build` does **not** need sudo.
- `bundle exec jekyll build` prints a **YAML Exception** for `_posts/2022-07-20-spark-resource-used-metrics.md` (malformed front matter in that post's content). This is a pre-existing content issue, not an environment problem; Jekyll skips that file and still builds the rest of the site.
- The build logs `To use retry middleware with Faraday v2.0+, install faraday-retry gem` — a harmless warning that does not block the build.
- No `Gemfile.lock` is committed (it's gitignored), so gem versions resolve from the `github-pages` gem at install time.
