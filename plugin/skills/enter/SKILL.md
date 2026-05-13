---
name: olam-enter
description: Enter an Olam world's terminal. Use when the user says "enter world", "connect to world", "shell into world", or wants to interact directly with a world's environment.
argument-hint: "[world-id]"
user-invocable: true
allowed-tools:
  - mcp__olam__olam_enter
  - mcp__olam__olam_list
---

# Enter Olam World

Get the command to enter a world's interactive terminal.

## Workflow

1. Parse the argument as the world ID.

2. If no argument, call `olam_list` and ask which world to enter.

3. Call `olam_enter` with the world ID.

4. Present the docker exec command for the user to run.

5. Suggest the user run it with `! <command>` to execute it in the current session.

## Cloudflare mode

CF worlds do not expose a Docker-style shell. Open
`$OLAM_WORKER_URL/sandbox/<id>/` in a browser for the per-world
dashboard (terminal panel ships ttyd + Cloud exec tabs). For a
scripted shell, the Worker's `POST /exec` proxies a single command to
the sandbox (requires service-token auth) — see
`olam/docs/CF_WORLDS_SPEC.md`.
