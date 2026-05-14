---
name: olam-dispatch
description: Dispatch a task prompt to a running Olam world's Claude Code agent. Use when the user says "dispatch", "send task to world", "tell world X to do Y", "run this prompt in world X", or wants the agent inside a specific world to pick up new work. Operates on already-running worlds; for creating a new world use `olam-create`.
argument-hint: "[world-id] [prompt]"
user-invocable: true
allowed-tools:
  - mcp__olam__olam_dispatch
  - mcp__olam__olam_list
  - mcp__olam__olam_status
---

# Dispatch to Olam World

Send a task prompt to a running world's Claude Code agent.

## Workflow

1. Parse arguments: first token is the world ID, rest is the prompt.

2. If no world ID provided, call `olam_list` to show available worlds and ask which to dispatch to.

3. If no prompt provided, ask the user what task to dispatch.

4. Call `olam_dispatch` with:
   - `worldId` — the world ID
   - `prompt` — the task description

5. Present results showing:
   - Session ID
   - Cost
   - Number of turns
   - Result summary
   - Duration

## Cloudflare mode

For CF-hosted worlds, dispatch requires in-container auth to have
completed first (OAuth Claude or device-code OpenAI, depending on
agent). If the caller hits a `401` from the container's `/dispatch`,
the operator must open `$OLAM_WORKER_URL/sandbox/<id>/` and complete
auth, then retry.

The `task` field on `olam_create` triggers auto-dispatch after auth
completes, which avoids this roundtrip on world creation. Reference:
[`docs/CF_WORLDS_SPEC.md` §4.3 + §5](https://github.com/pleri/olam/blob/main/docs/CF_WORLDS_SPEC.md).

## Failure handling

- **`401` from container `/dispatch` (CF mode)** — in-container auth incomplete. Tell the operator: open `$OLAM_WORKER_URL/sandbox/<id>/`, complete the OAuth flow, retry the dispatch.
- **`olam_dispatch` returns "world not running"** — call `olam_status` to confirm state. The world may have been destroyed or its container exited.
- **Dispatch returns instantly with no result** — the agent inside the world may not be hooked up. Verify via `olam_status` and the world's dashboard.
- **High `cost` value or turn count** — surface this to the operator so they can interrupt early via `olam_destroy` if the world is in a loop.

## Anti-scope (what this skill is NOT for)

- **Creating a new world** — see `olam-create`. Dispatch requires an existing running world.
- **Watching the agent's reasoning live** — see `olam-observe` (separate verb; dispatch returns when the agent finishes a turn, observe streams the trace).
- **Saving thoughts after a successful dispatch** — see `olam-crystallize`.
- **Re-running the same prompt** — dispatch is idempotency-less; the agent treats every call as a new task.

## See also

- `olam-create` — for new worlds.
- `olam-list` — find a world to dispatch to.
- `olam-status` — confirm a world is dispatch-ready.
- `olam-crystallize` — save the agent's thought graph after dispatch.
