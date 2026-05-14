---
name: olam-destroy
description: Destroy an Olam world and clean up all resources (containers, worktrees, services, R2 artifacts). Use when the user says "destroy world", "tear down", "clean up world", "kill that world", "remove environment", or wants to free resources held by a world they no longer need. Confirms current state before destroying.
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

3. Call `olam_status` to show current state before destroying (confirmation surface — operator sees what they are about to lose).

4. **Remind the user about `olam-crystallize`** if the world has uncaptured thoughts. Destroy is irreversible for in-memory trace state.

5. Call `olam_destroy` with the world ID.

6. Confirm destruction and surface any retained artifact paths (R2 snapshots persist in CF mode).

## Cloudflare mode

Destroy flushes the trace buffer, archives artifacts to R2, and
releases the Durable Object. Dashboards at
`$OLAM_WORKER_URL/sandbox/<id>/` will return 404 once the DO is
released. R2 snapshots persist and can be inspected via the CF
dashboard if needed for post-mortem.

Reference:
[`docs/CF_WORLDS_SPEC.md` §4.4](https://github.com/pleri/olam/blob/main/docs/CF_WORLDS_SPEC.md).

## Failure handling

- **`olam_destroy` returns "world not found"** — call `olam_list` to verify the ID; the world may have already been destroyed.
- **Destroy times out (CF mode)** — the Durable Object may be wedged. Surface the world ID + dashboard URL; operator can force-release via the CF dashboard.
- **Container exit code non-zero (Docker mode)** — the world's container hit a destroy hook that failed. The world is still removed from the registry; the error is informational. Surface the exit code so operator can investigate.
- **R2 archive failed** — the world is destroyed but the snapshot may be incomplete. Surface the artifact path for manual cleanup.

## Anti-scope (what this skill is NOT for)

- **Pausing a world without destroying it** — destroy is permanent. There is no "stop" verb; the closest is letting a world idle.
- **Cleaning up host-cp state across all worlds** — run `olam clean` for that.
- **Removing the Olam install entirely** — `npm uninstall -g @pleri/olam-cli` plus removing `~/.olam/`.
- **Crystallizing thoughts before destroy** — see `olam-crystallize` (must run before destroy if you want to keep the thought graph).

## See also

- `olam-list` — find worlds eligible for destruction.
- `olam-status` — inspect before destroying.
- `olam-create` — start a new world (after this one is gone).
