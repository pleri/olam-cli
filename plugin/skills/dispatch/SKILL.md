---
name: olam-dispatch
description: Dispatch a task to a running Olam world. Use when the user says "dispatch", "send task", "run in world", or wants an agent to work inside a world.
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

2. If no world ID provided, call `olam_list` to show available worlds.

3. If no prompt provided, ask the user what task to dispatch.

4. Call `olam_dispatch` with:
   - `worldId`: the world ID
   - `prompt`: the task description

5. Present results showing:
   - Session ID
   - Cost
   - Number of turns
   - Result summary
   - Duration

## Cloudflare mode

For CF-hosted worlds, dispatch requires in-container auth to be
completed first (OAuth Claude or device-code OpenAI, depending on
agent). If the caller hits a 401 from the container's `/dispatch`,
instruct them to open `$OLAM_WORKER_URL/sandbox/<id>/` and complete
auth, then retry. The `task` field on `olam_create` triggers
auto-dispatch after auth completes, avoiding this roundtrip.
See `olam/docs/CF_WORLDS_SPEC.md` §4.3 + §5.
