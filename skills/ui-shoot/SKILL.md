---
name: olam-ui-shoot
description: Take spec-driven screenshots of a web app via the supervisor's Chromium. Use when the user says "screenshot the X page", "capture before/after for the PR", "show me what /foo looks like", or after any UI change that warrants visual evidence. Reads a `screenshots.yaml` spec from the project, brokers the actual rendering through `olam_capture_view` (no Playwright in worlds), writes PNG/JPEG artifacts, optionally embeds them in the active PR.
argument-hint: "[--spec PATH] [--world ID|--url BASE] [--out DIR] [--allow-eval]"
user-invocable: true
allowed-tools:
  - mcp__olam__olam_capture_view
  - mcp__olam__olam_list
  - mcp__olam__olam_status
  - Read
  - Bash
  - Edit
---

# UI Shoot — spec-driven screenshots

Take a deterministic set of screenshots of a web app from a YAML spec. Single source of truth lives in the project's repo (`screenshots.yaml` or `.olam/screenshots.yaml`); this skill orchestrates the capture and (optionally) embeds artifacts in the active PR.

## Why a brokered primitive

Worlds (Cloudflare Sandbox containers) **never** run Playwright themselves — that would mean a 300 MB Chromium install per world plus a security blast-radius bigger than the world abstraction can defend. Instead, the supervisor owns one Chromium install and exposes the narrow `olam_capture_view` MCP tool. Hosts and worlds both call it; the supervisor renders. See [`docs/architecture/04-authority-boundary.md`](https://github.com/pleri/olam/blob/main/docs/architecture/04-authority-boundary.md) for the full reasoning.

## Inputs

### Spec resolution (in order)

1. `--spec PATH` if passed.
2. `./screenshots.yaml` in the cwd.
3. `./.olam/screenshots.yaml`.
4. Fail with a friendly diagnostic listing the searched paths.

### Target resolution (in order)

1. `--world <id>` → URLs in the spec are resolved against the world's exposed port via the supervisor's local proxy (`world://<id>/<path>`). Worlds never get a public URL.
2. `--url <base>` → URLs resolved against an arbitrary base (e.g. `http://localhost:8787` for local `wrangler dev`, `https://example.com` for prod).
3. Default → call `olam_list`. If exactly one world matches the cwd's repo, use it. If multiple, prompt. If none, fail with guidance.

### Output

- `--out DIR` → host-side directory for PNG/JPEG output. Default `.olam/shoots/<correlation_id>/`.
- Artifacts: `<shot.name>.png` (or `.jpeg`), plus `manifest.json` with sha256s and redacted URLs.

## Spec format

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/pleri/olam/main/schemas/screenshots.schema.json
shots:
  - name: bootstrap-shader
    url: /bootstrap                    # resolved against --world or --url base
    viewport: { width: 1280, height: 800 }
    afterLoadMs: 1500                   # let the WebGL aurora reach a non-zero frame

  - name: bootstrap-reduced-motion
    url: /bootstrap
    media: { reducedMotion: reduce }    # CSS media-feature emulation
    afterLoadMs: 500

  - name: device-after-success
    url: /device
    fill: { "#user_code": "ABCD-1234" }
    submit: "#dev-form"
    mockFetch:
      - pattern: "/device/complete"
        status: 200
        bodyJson: { email: "test@example.com", org_id: "olam-test" }
    afterSubmitMs: 800
```

Full schema at `schemas/screenshots.schema.json`. JSON-Schema-aware editors (VS Code, Zed, IntelliJ) get autocomplete + inline validation when the `# yaml-language-server:` line is present.

## Workflow

1. **Resolve spec + target** (see above). Validate the YAML against the JSON schema; fail loudly on the first error.

2. **Compute the URL allow-list** by walking `shots[].url` and `shots[].mockFetch[].pattern`. This becomes the capability token's scope; any request outside it is rejected at the supervisor's local proxy *and* by Playwright's route handler.

3. **Call `olam_capture_view`** with the parsed shots. The MCP tool:
   - Mints a short-lived capability token (TTL default 120 s, max 600 s for host calls, 60 s for in-world calls).
   - Spawns the supervisor's local proxy for the lifetime of the call.
   - Boots one Chromium, iterates shots in a fresh BrowserContext per shot, writes artifacts to `outDir`.
   - Returns `{ shots: [{ name, path, sha256, urlRedacted }] }`.

4. **Surface results** to the operator with the artifact paths and a one-line summary per shot.

5. **Optional: embed in PR.** If a PR is open on the current branch and the user opts in (or the skill is invoked with `--embed-pr`), call `gh pr view --json number,headRefName` and `gh pr edit` to append the screenshots into a `## Screenshots` section. Image references use `https://github.com/{owner}/{repo}/blob/{sha}/{path}?raw=1` so private-repo PRs render correctly for authenticated reviewers. Compress PNG → JPEG q85 first if any shot is over 500 KB.

## Failure handling

- **Spec invalid** → print the first Zod/JSON-Schema error with line/column; halt.
- **Target ambiguous** (`olam_list` returned >1 world) → prompt the user to pick.
- **Capability token denied** (e.g. URL outside allow-list, or RFC1918 host) → print the rejected URL and the allow-list; halt.
- **Chromium boot failed** → check whether Playwright is installed (`pnpm --filter @olam/mcp-server exec playwright install chromium`). If yes, surface the underlying error.
- **Network error / 5xx mid-capture** → mark that shot as failed in the manifest, continue with remaining shots, exit non-zero.
- **`eval` field present but `--allow-eval` not passed** → reject with a clear "this spec uses raw page-script; pass --allow-eval after reviewing the YAML".

## What this skill does NOT do

- Visual regression / pixel diffing — separate skill, future work. This one captures; comparing is for `pixelmatch`/`odiff` downstream.
- Video recording — see the `ui-demo` skill.
- Discover-and-record (auto-derive a spec by exploring) — different skill, future.
- Run Playwright inside worlds — explicitly forbidden; that would break the authority boundary documented in [`docs/architecture/04-authority-boundary.md`](https://github.com/pleri/olam/blob/main/docs/architecture/04-authority-boundary.md).

## Notes for in-world callers

When this skill (or the underlying `olam_capture_view` tool) is invoked from inside a world by an autonomous Claude agent:
- `world_id` defaults to the calling world; cannot be overridden.
- `allowed_paths` cannot include paths outside the world's own domain.
- TTL is capped at 60 s.
- Per-world hourly quota applies (default 50 shoots / hour).

These asymmetries are the point: the host has operator privilege; the world has narrow observability. Same primitive, different policies.
