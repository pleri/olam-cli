---
name: olam-destroy
description: Destroy an Olam world and clean up all resources. Use when the user says "destroy world", "tear down", "clean up world", or wants to remove an environment.
argument-hint: "[world-id]"
user-invocable: true
allowed-tools:
  - mcp__olam__olam_destroy
  - mcp__olam__olam_list
  - mcp__olam__olam_status
---

# Destroy Olam World

Destroy a world, cleaning up containers, worktrees, and services.

## Workflow

1. Parse the argument as the world ID.

2. If no argument, call `olam_list` to show available worlds and ask which to destroy.

3. Call `olam_status` to show current state before destroying (confirmation).

4. Call `olam_destroy` with the world ID.

5. Confirm destruction and remind about crystallization if thoughts were captured.

## Cloudflare mode

Destroy flushes the trace buffer, archives artifacts to R2, and
releases the Durable Object (per `olam/docs/CF_WORLDS_SPEC.md` §4.4).
Dashboards at `$OLAM_WORKER_URL/sandbox/<id>/` will return 404 once the
DO is released. R2 snapshots persist and can be inspected via the CF
dashboard if needed for post-mortem.
