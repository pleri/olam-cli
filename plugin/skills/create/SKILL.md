---
name: olam-create
description: Create a new isolated development world (local Docker or Cloudflare Sandbox). Use when the user says "create a world", "new world", "spin up an environment", or wants an isolated workspace for a task.
argument-hint: "[world name]"
user-invocable: true
allowed-tools:
  - mcp__olam__olam_create
  - mcp__olam__olam_list
---

# Create Olam World

Provision an isolated development world. Backend is selected by the
loaded Olam config (`compute.default`): `docker` (local) or `cloudflare`
(CF Sandbox). Both flow through the same MCP tool.

The definitive contract for Cloudflare worlds lives in
`olam/docs/CF_WORLDS_SPEC.md`. Skills must not diverge from it.

## Prerequisites

### Docker mode
No additional credentials needed.

### Cloudflare mode
Confirm the **current project's** `.env.local` contains (per
CF_WORLDS_SPEC.md §3):

- `OLAM_WORKER_URL` — `https://<your-worker>.workers.dev`
- `OLAM_PYLON_ORG_URL` — Pylon org URL MCP mints scoped tokens against
- `OLAM_PYLON_ORG_ID` — canonical org slug (matches `pylon-cli`'s `--org`)
- `OLAM_CF_ACCESS_CLIENT_ID` — CF Access service token id
- `OLAM_CF_ACCESS_CLIENT_SECRET` — CF Access service token secret

(Worker auth migrated to Pylon-validated scoped tokens in PR #31; the
legacy `OLAM_AUTH_TOKEN` static bearer was removed in
mcp-pylon-outbound-auth Phase A. Operator session JWT auto-resolves
from `pylon login`'s keychain entry.)

The MCP reads these from `.env.local` at the Olam project root (the
dir containing `.olam/config.yaml` or `olam.yaml`). There is **no**
global Olam config. If any var is missing the MCP will fail at
startup with the exact missing key — run `/olam:cf-login` and stop.

## Workflow

1. Parse the argument as the world name. If no argument provided, ask
   the user for a world name.

2. Optionally ask whether to scope to specific repos and/or include a
   task description. For CF mode, a `task` triggers auto-dispatch after
   in-container auth completes.

3. Call `olam_create`:
   - `name`: the world name
   - `repos`: (optional) array of repo names
   - `task`: (optional) task description
   - `branchName`: (optional) override default branch

4. Present the result. For CF mode specifically show:
   - `sessionId`
   - `dashboardUrl` (`https://olam.example.workers.dev/sandbox/<id>/`)
   - Status and next step (open dashboard to complete OAuth if task is set)

5. Remind the user that dispatch is available via
   `/olam:dispatch <world-id> <prompt>`.

## Failure handling

- 401/403 from Worker → CF Access service token is wrong or missing;
  route the user to `/olam:cf-login`.
- 502 on `/session/start` → container boot failed; tail with
  `npx wrangler tail olam --format pretty` and surface the last error
  line.
- `better-sqlite3` ABI errors are fixed (Dockerfile builder aligned to
  Node 20). If they recur, check `packages/cloudflare-worker/Dockerfile`
  stage 1 base image vs. the `cloudflare/sandbox` runtime Node version.
