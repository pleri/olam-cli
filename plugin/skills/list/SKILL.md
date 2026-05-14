---
name: olam-list
description: List all active Olam worlds (locally tracked) with status, repos, and cost-so-far. Use when the user says "list worlds", "show worlds", "what worlds exist", "which worlds are running", "what's running on this machine", or wants an overview of provisioned environments before picking one to operate on.
user-invocable: true
allowed-tools:
  - mcp__olam__olam_list
---

# List Olam Worlds

Show all active worlds with their status, repos, and costs.

## Workflow

1. Call `olam_list` to get all worlds.

2. Present results in a clear table format showing:
   - World ID
   - Name
   - Status (running / paused / creating)
   - Repos
   - Cost so far
   - Created time

3. If no worlds exist, suggest creating one with `/olam:create`.

4. If the user asks about a specific world after listing, hand off to `olam-status` for the detailed view.

## Cloudflare mode

The CF Worker does not currently expose a "list all worlds" endpoint.
When `compute.default = cloudflare`, `olam_list` returns worlds known
to the local registry only. Worlds created on other machines (or
directly via the Worker) won't appear. Operators who know a world's
session ID can still reach its dashboard at
`$OLAM_WORKER_URL/sandbox/<sessionId>/`.

Reference:
[`docs/CF_WORLDS_SPEC.md` §4.2](https://github.com/pleri/olam/blob/main/docs/CF_WORLDS_SPEC.md).

## Failure handling

- **`olam_list` returns empty** — no worlds. Suggest `olam-create`.
- **`olam_list` returns worlds with unknown status** — the local registry is out of sync. Run `olam clean` to reconcile.
- **Cost field missing** — cost-tracking is per-world; not all backends report it. Show the field as `-` rather than `0`.

## Anti-scope (what this skill is NOT for)

- **Deep inspection of one specific world** — see `olam-status` (single-world detail view).
- **Watching live agent reasoning** — see `olam-observe`.
- **Listing PRs filed by worlds** — see `olam-pr` (a separate command group).
- **Listing worlds on a different host** — `olam_list` is per-machine in Docker mode and per-local-registry in CF mode.

## See also

- `olam-status` — drill into a single world.
- `olam-create` — start a new world if none exist.
- `olam-destroy` — tear down a world you no longer need.
