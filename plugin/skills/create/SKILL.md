---
name: olam-create
description: Create a new isolated development world (local Docker or Cloudflare Sandbox). Use when the user says "create a world", "new world", "spin up an environment", "start a fresh sandbox", "I need an isolated workspace for a task", or wants to dispatch an agent into a sandboxed branch. Selects the compute backend from the project's Olam config; both modes flow through one MCP tool.
argument-hint: "[world name]"
user-invocable: true
allowed-tools:
  - mcp__olam__olam_create
  - mcp__olam__olam_list
---

# Create Olam World

Provision an isolated development world. The backend is selected by
the loaded Olam config (`compute.default`): `docker` (local) or
`cloudflare` (CF Sandbox). Both flow through the same MCP tool.

The definitive contract for Cloudflare worlds lives at
[`docs/CF_WORLDS_SPEC.md`](https://github.com/pleri/olam/blob/main/docs/CF_WORLDS_SPEC.md)
in the source repo. Skills must not diverge from it.

## Prerequisites

### Docker mode
No additional credentials needed beyond a running Docker daemon.

### Cloudflare mode

Confirm the **current project's** `.env.local` contains:

- `OLAM_WORKER_URL` — `https://<your-worker>.workers.dev`
- `OLAM_PYLON_ORG_URL` — Pylon org URL the MCP mints scoped tokens against
- `OLAM_PYLON_ORG_ID` — canonical org slug (matches `pylon-cli`'s `--org`)
- `OLAM_CF_ACCESS_CLIENT_ID` — CF Access service token id
- `OLAM_CF_ACCESS_CLIENT_SECRET` — CF Access service token secret

The MCP reads these from `.env.local` at the Olam project root (the
directory containing `.olam/config.yaml` or `olam.yaml`). There is
**no** global Olam config. If any var is missing, the MCP fails at
startup with the exact missing key — ask your admin for the value and
re-export.

## Workflow

1. Parse the argument as the world name. If no argument is provided, ask the user for a world name.

2. Optionally ask whether to scope to specific repos and/or include a task description. For CF mode, a `task` triggers auto-dispatch after in-container auth completes.

3. Call `olam_create`:
   - `name` — the world name
   - `repos` (optional) — array of repo names
   - `task` (optional) — task description
   - `branchName` (optional) — override default branch

4. Present the result. For CF mode specifically, show:
   - `sessionId`
   - `dashboardUrl` (`https://<your-worker>.workers.dev/sandbox/<id>/`)
   - Status and next step (open dashboard to complete OAuth if a task is set)

5. Remind the user that dispatch is available via `/olam:dispatch <world-id> <prompt>`.

## Failure handling

- **401/403 from Worker** — CF Access service token is wrong, expired, or not allow-listed. Ask the admin to confirm `OLAM_CF_ACCESS_CLIENT_ID` is valid and that the caller's identity is in the allow-list.
- **502 on `/session/start`** — container boot failed. Tail with `npx wrangler tail <worker-name> --format pretty` and surface the last error line.
- **`better-sqlite3` ABI mismatch** — the Dockerfile's Node version drifted from the `cloudflare/sandbox` runtime. Align the builder image's Node version with the sandbox runtime.
- **Missing env var** — the MCP startup error names the exact key. Add it to `.env.local` at the project root.
- **`olam_create` returns "name already exists"** — pick a different name or call `olam-destroy` on the existing world first.

## Anti-scope (what this skill is NOT for)

- **Listing existing worlds** — see `olam-list`.
- **Tearing down a world** — see `olam-destroy`.
- **Sending a follow-up task to a running world** — see `olam-dispatch`. This skill creates net-new worlds.
- **Wiring up the MCP for the first time** — see `olam-connect` (admin-hosted path) or run `olam setup` (standard path).

## See also

- `olam-dispatch` — send a task to a running world.
- `olam-list` — show worlds you've already created.
- `olam-status` — inspect a single world in depth.
- `olam-destroy` — tear down a world.
