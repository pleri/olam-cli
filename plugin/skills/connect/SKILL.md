---
name: olam-connect
description: Connect Claude Code to a remote admin-hosted Olam deployment via the MCP `http` transport (Worker URL + CF Access SSO). Use when the user has a Worker URL from an admin OR says "connect Claude to olam", "add olam MCP via URL", "set up admin-hosted olam", "wire up olam mcp endpoint". NOT for the standard shuk-marketplace install (that auto-registers a local stdio MCP via `.mcp.json`); NOT for shelling into a running world's container (see `olam-enter`).
user-invocable: true
allowed-tools:
  - Bash
---

# Connect to Olam (admin-hosted MCP)

Admin-hosted model: a single Worker URL + CF Access SSO replaces the
local clone + `.env.local` dance. Run one command and you're done.

This is one of two MCP install paths:

- **shuk-marketplace path** (most operators) — `claude plugin install olam@shuk` auto-registers a local stdio MCP via the plugin's `.mcp.json`. No URL, no admin. If you arrived via shuk, you do not need this skill.
- **admin-hosted path** (this skill) — your team's admin runs an Olam Worker behind Cloudflare Access; you wire your Claude Code to it via `--transport http`.

## Primary path — humans (CF Access SSO)

```sh
claude mcp add --transport http olam https://<olam-worker-url>/mcp
```

The first tool call opens a browser to Cloudflare Access; you SSO with
your workspace email; Claude Code stores the refresh token in the OS
keychain. Every subsequent call is silent.

Confirm the MCP is reachable:

```sh
claude mcp list
```

You should see `olam` listed with `Transport: http`. Then try:

```
olam_status <world-id>      # if you already know a world
# or
olam_create task="your first seed of thought"
```

## CI / service-token path

For GitHub Actions, cron jobs, or any non-interactive caller, the
admin mints a single CF Access Service Token once and hands the
client-id + client-secret pair to the CI platform's secret store.

```sh
claude mcp add --transport http olam https://<olam-worker-url>/mcp \
  --header "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  --header "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  --header "X-Olam-Impersonate-Email: ci-bot@yourorg.com"
```

`X-Olam-Impersonate-Email` only works when the caller's
`CF-Access-Client-Id` matches an allow-listed service-token ID —
that list lives in the Worker secret `OLAM_CI_ALLOWED_EMAILS`. JWT
(SSO) sessions ignore the impersonation header entirely.

## Ask your admin for

- `<olam-worker-url>` — something like `https://olam.<your-org>.workers.dev/mcp`.
- For CI: the service-token pair, pre-allow-listed for the identity you want to run as.

## Troubleshooting

- `claude mcp list` doesn't show olam → re-run the `claude mcp add`
  command; the URL must end in `/mcp`.
- Tool calls return `401 Unauthorized` → SSO session expired. Run any
  MCP tool; Claude will re-prompt for SSO in the browser.
- Tool calls return `403` when impersonating → the email you requested
  isn't in `OLAM_CI_ALLOWED_EMAILS`. Ask the admin to add it.

## Anti-scope (what this skill is NOT for)

- **Standard shuk-marketplace install** — that path auto-registers a local stdio MCP via the plugin's `.mcp.json`. Use it instead unless your admin specifically requires the http-transport path.
- **Shelling into a running world's container** — see `olam-enter`.
- **Creating worlds** — see `olam-create` (requires the MCP to be connected first; if you are using this skill, do that step before olam-create).
- **Local Docker setup** — run `olam setup` for the per-machine bootstrap.

## See also

- `olam-create` — provision a world (once the MCP is connected).
- `olam-list` — show running worlds.
- `olam-enter` — shell into a world's container.
