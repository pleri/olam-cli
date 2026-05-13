# olam plugin for Claude Code

Operator-facing plugin for [Olam](https://github.com/pleri/olam) — the agentic-thinking platform that spawns isolated development worlds, dispatches tasks to coding agents inside them, and captures the thought graphs they produce.

This directory is the **canonical published plugin source**. The plugin lives here in `pleri/olam-cli` (NOT `pleri/olam`, which is the source code repo). Distribution is via the `shuk` plugin marketplace.

## Prerequisites

- **Node 22+** — required for the bundled `olam mcp serve` subprocess (the `.mcp.json` boots it via `npx -y @pleri/olam-cli mcp serve`).
- **Docker** — Olam worlds run inside containers; the daemon must be reachable.
- **gh CLI authenticated** — `gh auth status` should report a logged-in user with `read:packages` scope. Required for the `@pleri/olam-cli` npm package, which is published to GitHub Packages (not the public npmjs.org registry).
- **`.npmrc` configured for the `@pleri` scope** — the `npx -y @pleri/olam-cli` boot path in `.mcp.json` resolves via the operator's `~/.npmrc`. The bundled installer (`curl -fsSL https://olam.bar.dev/install | sh`) writes this for you; if you bypass the installer, add the following lines to `~/.npmrc`:

  ```ini
  @pleri:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
  ```

  Without this, the MCP server fails to boot with a generic 404 from `npx`.

## Install paths

There are four supported install paths, ordered from most-to-least common.

### 1. shuk-marketplace (primary path)

```sh
claude plugin marketplace add idl3/shuk
claude plugin install olam@shuk
```

Restart Claude Code. The MCP server starts on first `/olam:*` slash command via the `.mcp.json` boot (`npx -y @pleri/olam-cli mcp serve`).

Inspect the install cache at `~/.claude/plugins/cache/shuk/olam/<version>/`.

### 2. `olam mcp install` (CLI-pre-installed operators)

If you already installed `@pleri/olam-cli` globally (`npm install -g @pleri/olam-cli`), you can register the MCP server against the local binary instead of going through `npx` every boot:

```sh
olam mcp install
```

This writes to `~/.claude.json` (`mcpServers.olam.command = "olam"`, `args = ["mcp", "serve"]`), shaving the `npx -y` resolution off every cold start. The plugin still works without this step — `npx -y` is the fallback.

### 3. Upgrade flow

```sh
claude plugin marketplace update
claude plugin update olam
```

Or for CLI-managed installs: `olam update`.

### 4. Offline / corp-firewall fallback

When the `npx -y @pleri/olam-cli` install can't reach GitHub Packages (corp firewall, air-gapped environment, etc.):

```sh
git clone https://github.com/pleri/olam-cli ~/src/olam-cli
claude plugin install ~/src/olam-cli/plugin
```

The plugin still tries `npx -y @pleri/olam-cli mcp serve` at runtime — to bypass that too, install the CLI globally from the cloned source (`cd ~/src/olam-cli && npm install -g .`) before invoking any `/olam:*` slash command.

## Dual-mode `.mcp.json` rationale

The shipped `.mcp.json` uses `npx -y @pleri/olam-cli mcp serve` as the canonical form:

- **Pro**: works without a globally-installed `olam` binary; fresh operators can use the plugin immediately after `claude plugin install`.
- **Con**: every cold start does an `npx` resolution (~300ms-2s wall-clock depending on cache state). Each resolution also re-fetches the latest published version of `@pleri/olam-cli` unless your npm cache is warm — there is no version pin in the shipped `.mcp.json` yet (tracked as a follow-up; once a stable 0.x line exists on the canonical registry, the canonical form should become `npx -y @pleri/olam-cli@^0.3 mcp serve`).

The `olam mcp install` command (path #2 above) optimizes for operators who already have the CLI globally — it rewrites the MCP server entry to a direct `olam mcp serve` invocation, eliminating the `npx` step entirely AND pinning the runtime to the installed version.

Both modes share the same MCP tool surface; the slash commands work identically.

### Supply-chain considerations

The `@pleri/olam-cli` npm package is published to GitHub Packages, not npmjs.org. The `npx -y` form depends on your `~/.npmrc` mapping the `@pleri` scope to `https://npm.pkg.github.com` (see Prerequisites). Without that mapping, `npx` 404s against npmjs.org and the MCP server fails silently from the operator's perspective.

If you encounter this failure mode, the diagnostic surface is `claude --debug` (look for `MCP server unavailable` or `npx exited non-zero`). Path #2 (`olam mcp install`) is the operator workaround — it bypasses `npx` entirely by writing a direct `olam mcp serve` command into the MCP server entry.

## Layout

```
plugin/
├── .claude-plugin/plugin.json    # manifest (name, version, author)
├── .mcp.json                     # MCP server registration (npx canonical form)
├── MANIFEST.md                   # skill inventory + tier classification + audit exempts
├── README.md                     # this file
├── scripts/
│   ├── scrub-check.mjs           # build-time scrubber for internal refs
│   ├── scrub-denylist.json       # denylist patterns
│   └── scrub-allowlist.md        # documented benign matches
└── skills/                       # individual skill markdown
    ├── connect/SKILL.md
    ├── create/SKILL.md
    ├── destroy/SKILL.md
    ├── dispatch/SKILL.md
    ├── enter/SKILL.md
    ├── list/SKILL.md
    ├── status/SKILL.md
    └── ui-shoot/SKILL.md
```

## Where to file issues

- **Install / distribution / plugin-loader problems** → `pleri/olam-cli` issues.
- **Olam functionality / world behaviour / MCP tool bugs** → `pleri/olam` issues.

## License

MIT — see `pleri/olam` for full source and license.
