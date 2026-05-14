# Olam plugin — MANIFEST

This file is the source-of-truth for the plugin's skill inventory, tier classification, and audit-script exempt list. The CI drift gate (`scripts/audit-skill-coverage.mjs`, landed in Phase E) reads this file to determine coverage.

## Skill inventory

| Skill | Tier | References (MCP tool / CLI command) | Notes |
|---|---|---|---|
| `/olam:connect` | thin | `mcp__olam__olam_connect` | Admin-hosted MCP wiring |
| `/olam:create` | thin | `mcp__olam__olam_create`, `mcp__olam__olam_list` | New world (docker / cloudflare) |
| `/olam:destroy` | thin | `mcp__olam__olam_destroy` | Tear down world |
| `/olam:dispatch` | thin | `mcp__olam__olam_dispatch` | Task to running world |
| `/olam:enter` | thin | `mcp__olam__olam_enter` | Interactive shell into world |
| `/olam:list` | thin | `mcp__olam__olam_list` | List worlds |
| `/olam:status` | thin | `mcp__olam__olam_status` | Inspect a single world |
| `/olam:ui-shoot` | thin | `mcp__olam__olam_capture_view` | Screenshot helper |
| `/olam:plan` | thick | `Read`, `Write`, `Edit`, `Glob`, `Grep`, `Bash` | Implementation spec author (port of /atl:plan) |
| `/olam:commit-push-pr` | thick | `Read`, `Edit`, `Bash`, `Grep`, `Glob` | Diff → conventional commits → PR (port of /atl:commit-push-pr) |
| `/olam:review` | thick | `Read`, `Bash`, `Grep`, `Glob`, `Task` | Standard + deep multi-agent review (port of /atl:review) |
| `/olam:handoff-session` | thick | `Read`, `Bash`, `Glob` | WIP commit + gist + draft PR (port of /atl:handoff-session) |
| `/olam:watch-pr` | thick | `Read`, `Edit`, `Bash`, `Grep`, `Glob` | Continuous PR watcher (port of /atl:watch-pr) |

## Tier definitions

- **thick** — workflow-shaped; orchestrates multiple MCP tools / CLI commands; opinionated decision tree. Examples (Phase C): `/olam:bootstrap`, `/olam:pr-review-flow`, `/olam:troubleshoot`.
- **thin** — one-per-significant-tool; reference + canonical example; gated on phase-b operator-stall evidence + phase-c routing-eval score.

## Audit-script exempt list

These MCP tools / CLI commands are deliberately NOT covered by a dedicated skill — they are infrastructure / installer surface, not operator-facing workflow.

- `olam_auth_up` — internal credential bring-up
- `olam_auth_complete` — internal OAuth callback handler
- `olam_kg_install_hook` — internal hook installer
- `olam_kg_uninstall_hook` — internal hook remover
- `olam_control_plane` — internal control-plane plumbing

(Additions require explicit rationale; the drift gate fails if uncovered tools are not on this list.)

## Bypass mechanism

Commit messages containing `[skip-skill-audit]` suppress the advisory comment AND auto-file a follow-up issue with a 30-day deadline (Phase E.E3). Use only for P0 emergency fixes; the auto-filed issue forces visibility.

## Canonical source

This plugin lives in `pleri/olam-cli` (NOT `pleri/olam`). Operators install via the shuk marketplace: `claude plugin marketplace add pleri/shuk && claude plugin install olam@shuk`. See `README.md` for the install matrix.
