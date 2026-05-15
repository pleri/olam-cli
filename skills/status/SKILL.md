---
name: olam-status
description: Get detailed status of a single Olam world — state, repos, branch, compute backend, cost, thought count, timestamps. Use when the user says "world status", "check world", "is world X running", "what's the state of world X", "how much did world X cost", "show world details", or wants a deep view of one specific environment (vs. the table view in `olam-list`).
argument-hint: "[world-id]"
user-invocable: true
allowed-tools:
  - mcp__olam__olam_status
  - mcp__olam__olam_list
---

# Olam World Status

Show detailed information about a specific world.

## Workflow

1. Parse the argument as the world ID.

2. If no argument, call `olam_list` and ask which world to inspect.

3. Call `olam_status` with the world ID.

4. Present comprehensive status:
   - World ID, name, status
   - Repos and branch
   - Compute provider (docker / cloudflare)
   - Cost tracking (current spend, budget)
   - Thought count
   - Created / updated timestamps

## Cloudflare mode

For CF worlds, `olam_status` reads from the local registry; container
state is authoritative. Verify at the edge with:

- `GET $OLAM_WORKER_URL/sandbox/<id>/api/status` — container health + auth state
- `GET $OLAM_WORKER_URL/sandbox/<id>/lanes` — lane registry (returns `{"lanes":[]}` when empty; a `500` here means the container's SQLite binding is broken)

Reference:
[`docs/CF_WORLDS_SPEC.md` §6](https://github.com/pleri/olam/blob/main/docs/CF_WORLDS_SPEC.md).

## Failure handling

- **`olam_status` returns "world not found"** — the world ID is stale or never existed. Call `olam_list` to refresh.
- **Local registry shows running but `/api/status` returns 502 (CF mode)** — container exited but the registry wasn't notified. Run `olam clean` to reconcile.
- **Cost is `null` or `0`** — billing-reporter may not be wired for this compute backend. Surface the discrepancy so the operator knows the figure is not authoritative.
- **`updated` timestamp is hours old on a "running" world** — the agent may be idle or the heartbeat is broken. Suggest `olam-observe` to verify.

## Anti-scope (what this skill is NOT for)

- **The full table of all worlds** — see `olam-list`.
- **Watching live agent reasoning** — see `olam-observe`. Status is a snapshot; observe is a stream.
- **Inspecting the world's container filesystem** — see `olam-enter`.
- **Inspecting PRs filed by the world** — see `olam-pr`.

## See also

- `olam-list` — find a world to inspect.
- `olam-observe` — live agent trace stream.
- `olam-enter` — drop into the world's shell.
- `olam-destroy` — tear down if no longer needed.
