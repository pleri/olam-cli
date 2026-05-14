---
name: olam-enter
description: Open an interactive shell inside a running Olam world's container (Docker mode) or surface the per-world dashboard URL (Cloudflare mode). Use when the user says "shell into world", "enter the world's container", "give me a terminal in world X", "I want to debug inside the world", or wants to inspect a world's filesystem directly. NOT for connecting Claude Code to the Olam MCP server (see `olam-connect`); NOT for sending a task to the agent (see `olam-dispatch`).
argument-hint: "[world-id]"
user-invocable: true
allowed-tools:
  - mcp__olam__olam_enter
  - mcp__olam__olam_list
---

# Enter Olam World

Get the command to enter a world's interactive terminal (Docker mode), or surface the dashboard for shell-equivalent access (Cloudflare mode).

## Workflow

1. Parse the argument as the world ID.

2. If no argument, call `olam_list` and ask which world to enter.

3. Call `olam_enter` with the world ID.

4. Present the `docker exec` command (Docker mode) for the user to run.

5. Suggest the user run it with `! <command>` to execute it in the current Claude Code session.

## Cloudflare mode

CF worlds do not expose a Docker-style shell. Instead:

- Open `$OLAM_WORKER_URL/sandbox/<id>/` in a browser for the per-world dashboard. The terminal panel ships ttyd + a Cloud-exec tab.
- For a scripted one-shot command, the Worker's `POST /exec` proxies to the sandbox (requires service-token auth).

Reference:
[`docs/CF_WORLDS_SPEC.md`](https://github.com/pleri/olam/blob/main/docs/CF_WORLDS_SPEC.md).

## Failure handling

- **`olam_enter` returns "world not running"** — call `olam_status`; the container may have exited. For Docker mode, `docker ps` will confirm.
- **`docker exec` exits 1 with "no such container"** — the world ID is stale. Call `olam_list` to refresh.
- **CF dashboard returns 404** — the Durable Object has been released (world destroyed). The dashboard is gone.
- **Permission denied on `/exec` (CF service-token path)** — the CF Access service token is wrong or missing the `X-Olam-Impersonate-Email` allow-list entry.

## Anti-scope (what this skill is NOT for)

- **Connecting Claude Code to the Olam MCP server** — see `olam-connect`. That wires up the *MCP* transport, not a container shell.
- **Sending a task to the world's agent** — see `olam-dispatch`. Enter gives you a *human* shell; dispatch gives an *agent* a task.
- **Watching the agent's reasoning** — see `olam-observe`.
- **Creating a new world** — see `olam-create`.

## See also

- `olam-list` — find an entered-able world.
- `olam-status` — confirm the world is healthy first.
- `olam-dispatch` — for non-interactive agent tasks (what most workflows want).
