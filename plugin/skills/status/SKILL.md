---
name: olam-status
description: Get detailed status of an Olam world. Use when the user says "world status", "check world", or wants details about a specific environment.
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
   - Compute provider
   - Cost tracking (current spend, budget)
   - Thought count
   - Created/updated timestamps

## Cloudflare mode

For CF worlds, `olam_status` reads from the local registry; container
state is authoritative. Verify at the edge with:

- `GET $OLAM_WORKER_URL/sandbox/<id>/api/status` — container health +
  auth state
- `GET $OLAM_WORKER_URL/sandbox/<id>/lanes` — lane registry (returns
  `{"lanes":[]}` when empty; a 500 here means the container's SQLite
  binding is broken — see `olam/docs/CF_WORLDS_SPEC.md` §6).
