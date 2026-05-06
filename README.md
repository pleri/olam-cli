# `@pleri/olam-cli`

CLI for **Olam** — the agentic-thinking platform. Spawn isolated development worlds, dispatch tasks to coding agents inside them, and capture the thought graphs they produce.

This is the *published artifact* repository. **Source lives in [`pleri/olam`](https://github.com/pleri/olam).** Filing issues against this repo is fine for install/distribution problems; functionality issues belong in the source repo.

## Install

```sh
curl -fsSL https://olam.bar.dev/install | sh
```

The installer:
1. Detects your `npm` prefix and verifies it's writable (offers a user-local fallback if not)
2. Authenticates `npm` against GitHub Packages using your `gh` CLI token (refreshes scope if missing `read:packages`)
3. Runs `npm install -g @pleri/olam-cli@stable`
4. Prompts you to run `olam setup` to finish the per-machine bootstrap

For the manual path (if you can't `curl | sh`):

```sh
# 1. Authenticate npm against GitHub Packages
npm login --scope=@pleri --registry=https://npm.pkg.github.com

# 2. Install
npm install -g @pleri/olam-cli@stable

# 3. Bootstrap
olam setup
```

You'll need a GitHub PAT with `read:packages` scope (and access to the `pleri` org).

## Usage

```sh
olam --version           # confirm install
olam setup               # one-time per-machine setup (skills, deps, telemetry opt-in)
olam init                # initialize Olam in the current repo (writes .olam/config.yaml)
olam world create my-task --task "implement feature X"
olam list                # show running worlds
olam dispatch <world-id> "next prompt"
olam status <world-id>
olam destroy <world-id>
olam update              # self-upgrade (wraps `npm install -g @pleri/olam-cli@<channel>`)
```

Run `olam --help` for the full surface.

## Channels

| Channel | When to pick it |
|---|---|
| `stable` *(default)* | Auto-published on every green merge to `main`. Bleeding-edge but smoke-tested. |
| `nightly` | 24-hour soak after `stable`. Re-smoked at promote-time. |
| `weekly` | Mon 00:00 UTC promote of stable. 7-day soak. The conservative pick. |
| `team-a-stable`, `team-b-stable` | Maintainer-managed per-team pins. Manual promotion only. |

Switch via `olam update --channel=<name>` or set `~/.olam/config.yaml.channel`.

## Pinning to a specific version

```sh
olam update --to=0.1.4              # pin
olam update --rollback              # back to last-installed
olam update --check                 # show current vs. latest, don't install
```

## What gets installed

- `olam` CLI binary on `$PATH`
- Host CP Docker stack at `$(npm root -g)/@pleri/olam-cli/host-cp/`
- MCP server at `$(npm root -g)/@pleri/olam-cli/dist/mcp-server.js` — registered in `~/.claude.json` so `/olam:*` slash commands work in Claude Code
- Skill symlinks at `~/.claude/skills/olam-*/`
- Operator state under `~/.olam/`

`olam update` keeps all of this in sync.

## License

MIT — see [`pleri/olam`](https://github.com/pleri/olam) for full source and license.
