---
name: olam-connect
description: Connect Claude Code to an admin-hosted Olam deployment. One-line onboarding — no repo clone, no service-token dance.
user-invocable: true
allowed-tools:
  - Bash
---

# Connect to Olam

Admin-hosted model: a single Worker URL + CF Access SSO replaces the
old clone + `.env.local` dance. Run one command and you're done.

## Primary path — humans (CF Access SSO)

```sh
claude mcp add --transport http olam https://<olam-worker-url>/mcp
```

The first tool call opens a browser to Cloudflare Access, you SSO with
your workspace email, and Claude Code stores the refresh token in the
OS keychain. Every subsequent call is silent.

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

- `<olam-worker-url>` — something like `https://olam.<your-org>.workers.dev/mcp`
- For CI: the service-token pair, pre-allow-listed for the identity
  you want to run as.

## Troubleshooting

- `claude mcp list` doesn't show olam → re-run the `claude mcp add`
  command; the URL must end in `/mcp`.
- Tool calls return `401 Unauthorized` → SSO session expired. Run any
  MCP tool; Claude will re-prompt for SSO in the browser.
- Tool calls return `403` when impersonating → the email you requested
  isn't in `OLAM_CI_ALLOWED_EMAILS`. Ask the admin to add it.
