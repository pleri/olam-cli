---
name: olam-list
description: List all active Olam worlds. Use when the user says "list worlds", "show worlds", "what worlds exist", or wants to see running environments.
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
   - Status (running/paused/creating)
   - Repos
   - Cost so far
   - Created time

3. If no worlds exist, suggest creating one with `/olam:create`.

## Cloudflare mode

The CF Worker does not currently expose a "list all worlds" endpoint.
When `compute.default=cloudflare`, `olam_list` returns worlds known to
the local registry. Worlds created on other machines (or directly via
the Worker) won't appear. Dashboards are still reachable directly at
`$OLAM_WORKER_URL/sandbox/<sessionId>/` if the operator knows the id.
See `olam/docs/CF_WORLDS_SPEC.md` §4.2.
