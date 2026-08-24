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
- `Gemfile` pins `github-pages` + `webrick`; `Gemfile.lock` is committed. CI uses Ruby 3.2 (`ruby/setup-ruby` + bundler-cache) and deploys `_site` → `built` branch.
- Comments use **Utterances** (`comments_provider: utterances` in `_config.yml`); the utterances GitHub App must be installed on `utterances.repo`.
- Large/local-only paths under `docs/presto` (and a few tooling files) are listed in `_config.yml` `exclude` and are skipped by the Pages build.
