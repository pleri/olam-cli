# `@pleri/olam-cli`

CLI for **Olam** — the agentic-thinking platform. Spawn isolated development worlds, dispatch tasks to coding agents inside them, capture thought graphs they produce, ship PRs from inside worlds, and orchestrate parallel sub-tasks ("lanes") under one world.

This is the *published artifact* repository. **Source lives in [`pleri/olam`](https://github.com/pleri/olam).** Filing issues against this repo is fine for install/distribution problems; functionality issues belong in the source repo.

## Install

### Claude Code operators — via shuk marketplace (recommended)

```sh
claude plugin marketplace add idl3/shuk
claude plugin install olam@shuk
```

Restart Claude Code. The MCP server boots on first `/olam:*` slash command. See [`plugin/README.md`](plugin/README.md) for plugin install paths (`shuk`, `olam mcp install`, upgrade, offline git-clone fallback) + the dual-mode `.mcp.json` rationale.

### CLI-only — via curl installer

```sh
curl -fsSL https://olam.bar.dev/install | sh
```

The installer:

1. Detects your `npm` prefix and verifies it's writable (offers a user-local fallback if not)
2. Authenticates `npm` against GitHub Packages using your `gh` CLI token (refreshes scope if missing `read:packages`)
3. Runs `npm install -g @pleri/olam-cli@stable`
4. Prompts you to run `olam setup` to finish per-machine bootstrap

### CLI-only — manual

```sh
# 1. Authenticate npm against GitHub Packages
npm login --scope=@pleri --registry=https://npm.pkg.github.com

# 2. Install
npm install -g @pleri/olam-cli@stable

# 3. Bootstrap
olam setup
```

You'll need a GitHub PAT with `read:packages` scope (and access to the `pleri` org).

## Command surface

Olam organizes capability into a small number of command groups. Every group has `--help`.

### World lifecycle

```sh
olam create my-task --task "implement feature X"   # spawn a new isolated world
olam list                                          # show running worlds
olam status [<world-id>]                           # machine status or per-world details
olam enter <world-id>                              # open a terminal inside a world
olam destroy <world-id>                            # tear down a world and clean up
olam clean                                         # reclaim stale worlds + orphan resources
olam observe <world-id>                            # stream the agent's reasoning (live)
```

### Dispatch & thought capture

```sh
olam dispatch <world-id> "next prompt"             # send a follow-up prompt to a running world
olam crystallize <world-id>                        # save the world's thought graph to the Pleri Plane
```

### Lanes — parallel sub-tasks under one world

```sh
olam lanes list <world-id>
olam lanes create <world-id> <lane-name>
olam lanes dispatch <world-id> <lane-name> "prompt"
olam lanes destroy <world-id> <lane-name>
olam lanes merge <world-id> <lane-name>            # merge a lane's branch back into the world
```

### PR workflow — file + decide from inside the world

```sh
olam pr list <world-id>                            # PR-gate requests from the world's agent
olam pr show <world-id> <pr-id>
olam pr track <pr-id>                              # follow status of a PR you've filed
olam pr approve <pr-id>
olam pr reject <pr-id> --reason "..."
```

### Workspaces & repos — multi-project orchestration

```sh
olam workspace list
olam workspace add <name> --path <dir>
olam workspace show <name>
olam workspace remove <name>

olam repos list                                    # repos visible in the active workspace
olam repos add <git-url>
olam repos remove <name>
olam repos update                                  # pull all
```

### Knowledge graph — per-world symbol index

```sh
olam kg build [<world-id>]                         # build the graphify-backed graph
olam kg status [<world-id>]                        # build progress + freshness
olam kg watch [<world-id>]                         # re-build on file change
olam kg classify <world-id> --rules <file>         # apply classification rules
olam kg doctor [<world-id>]                        # diagnose graph health
```

Agents inside worlds query the graph via the registered MCP server; prefer it over raw `grep` for symbol-shaped questions (see `docs/decisions/014-kg-first-search.md` in the source repo).

### Runbooks — canonical procedures replayable in worlds

```sh
olam runbooks list
olam runbooks show <name>
olam runbooks add <name> --file <markdown>
olam runbooks apply <name> <world-id>
olam runbooks remove <name>
```

### Auth — credential vault for Claude / GitHub / npm

```sh
olam auth up                                       # bring the auth-service vault up
olam auth down                                     # take it down
olam auth status
olam auth login <provider>                         # claude, github, npm
olam auth logout <provider>
olam auth refresh <provider>
olam auth list
olam auth disable <id>
olam auth enable <id>
olam auth remove <id>
```

The vault observes 429 responses and reports them so credentials auto-rotate when one is cooled down. See `docs/architecture/credential-hotswap.md` in the source repo.

### MCP integration

```sh
olam mcp serve                                     # boot the MCP server (stdio); used by .mcp.json
olam mcp install                                   # register MCP server in ~/.claude.json (optimization
                                                   # for operators with the CLI globally; bypasses npx)
```

### Setup & maintenance

```sh
olam setup                                         # one-time per-machine bootstrap
olam init                                          # write .olam/config.yaml in current repo
olam bootstrap                                     # bootstrap a fresh host (CI / new machine)
olam doctor                                        # full env health check
olam diagnose <world-id>                           # deep per-world diagnostic
olam update                                        # self-upgrade (wraps npm install -g @pleri/olam-cli@<channel>)
olam upgrade                                       # upgrade individual worlds to a new devbox image
olam refresh                                       # refresh credentials, manifests, caches
```

### Operational

```sh
olam logs [<world-id>]                             # tail world / host-cp logs
olam ps                                            # list running olam processes
olam keys                                          # show registered SSH / signing keys
olam stop                                          # stop the host control plane
olam config                                        # view / edit ~/.olam/config.yaml
```

Run `olam <group> --help` for the full surface of any group, or `olam --help` for the top-level menu.

## Channels

| Channel | When to pick it |
|---|---|
| `stable` *(default)* | Auto-published on every green merge to `main`. Bleeding-edge but smoke-tested. |
| `nightly` | 24-hour soak after `stable`. Re-smoked at promote-time. |
| `weekly` | Mon 00:00 UTC promote of stable. 7-day soak. The conservative pick. |
| `team-a-stable`, `team-b-stable` | Maintainer-managed per-team pins. Manual promotion only. |

Switch via `olam update --channel=<name>` or set `~/.olam/config.yaml`'s `channel` field.

## Pinning to a specific version

```sh
olam update --to=0.1.4                             # pin
olam update --rollback                             # back to last-installed
olam update --check                                # show current vs. latest, don't install
```

## What gets installed

- `olam` CLI binary on `$PATH`
- Host CP Docker stack at `$(npm root -g)/@pleri/olam-cli/host-cp/`
- MCP server at `$(npm root -g)/@pleri/olam-cli/dist/mcp-server.js` — registered in `~/.claude.json` so `/olam:*` slash commands work in Claude Code
- Skill symlinks at `~/.claude/skills/olam-*/`
- Operator state under `~/.olam/`

`olam update` keeps all of this in sync.

## Claude Code plugin

The `plugin/` directory in this repo is the canonical published source of the olam plugin for Claude Code:

- `plugin/.claude-plugin/plugin.json` — manifest
- `plugin/.mcp.json` — MCP server registration (npx canonical form)
- `plugin/skills/<name>/SKILL.md` — slash skills (`/olam:create`, `/olam:list`, etc.)
- `plugin/MANIFEST.md` — skill inventory + tier classification + audit exempt list
- `plugin/scripts/scrub-check.mjs` — build-time scrubber for internal refs
- `plugin/README.md` — operator-facing install matrix + supply-chain notes

Operators install via the shuk marketplace path above. The plugin is versioned independently of the CLI itself.

## License

MIT — see [`pleri/olam`](https://github.com/pleri/olam) for full source and license.
