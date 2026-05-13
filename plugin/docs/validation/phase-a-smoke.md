# Phase A smoke test — olam plugin scaffold

**Capture date:** 2026-05-13T15:32:12Z (UTC)
**Plugin tree:** `pleri/olam-cli/plugin/` @ `feat/olam-skills-phase-a` (commits A1..A6: 544e238, 4b6607d, 94894ff, 344fcc5, f7bb405, 99ca19b)
**Test host:** macOS Darwin 24.6.0 · Claude Code 2.1.89 · Node 22+
**Result:** PARTIAL — auto-verifiable checks PASS; new-session hand-off pending operator.

## 1. Auto-verifiable checks (PASS)

These ran inside the Phase A pickup-execute-audit session and gate the chain forward.

### 1a. Plugin manifest validates

```
$ claude plugin validate /Users/ernie/Projects/ein-sof/olam-cli/plugin
Validating plugin manifest: /Users/ernie/Projects/ein-sof/olam-cli/plugin/.claude-plugin/plugin.json
✔ Validation passed
```

Exit code: 0.

### 1b. plugin.json predicates

```
$ jq -e '.version == "0.3.0" and .author.name == "Ernie Sim"' plugin/.claude-plugin/plugin.json
true
```

Exit code: 0.

### 1c. `.mcp.json` predicates

```
$ jq -e '.mcpServers.olam.command == "npx"' plugin/.mcp.json
true
```

Exit code: 0.

Boot command verified by inspection: `npx -y @pleri/olam-cli mcp serve`.

### 1d. Skill count + frontmatter

```
$ ls plugin/skills/*/SKILL.md | wc -l
8

$ for f in plugin/skills/*/SKILL.md; do head -3 "$f" | grep -q '^name:' || echo "MISSING: $f"; done
(no output — all 8 have name: frontmatter)
```

Exit code: 0.

### 1e. Scrub-check on full plugin tree

```
$ node plugin/scripts/scrub-check.mjs --denylist plugin/scripts/scrub-denylist.json --target plugin/ --allowlist plugin/scripts/scrub-allowlist.md
scrub-check: 9 matches (0 unaddressed) in plugin
  [allowed] plugin/scripts/scrub-allowlist.md:24 — /Atlas Kitchen/ ...
  [allowed] plugin/scripts/scrub-allowlist.md:30 — /atlas-kitchen/ ...
  [allowed] plugin/scripts/scrub-allowlist.md:38 — /@atlaskitchen/ ...
  [allowed] plugin/scripts/scrub-allowlist.md:44 — /PLERI-INTERNAL-/ ...
  [allowed] plugin/scripts/scrub-check.mjs:16 — /atlas-kitchen/ ...
  [allowed] plugin/scripts/scrub-denylist.json:6 — /Atlas Kitchen/ ...
  [allowed] plugin/scripts/scrub-denylist.json:11 — /atlas-kitchen/ ...
  [allowed] plugin/scripts/scrub-denylist.json:26 — /@atlaskitchen/ ...
  [allowed] plugin/scripts/scrub-denylist.json:36 — /PLERI-INTERNAL-/ ...
```

Exit code: 0. All 9 matches are self-referential tooling (the scrub denylist and allowlist necessarily contain the literal forbidden tokens); each is documented in `scripts/scrub-allowlist.md`.

### 1f. README install-path coverage

```
$ grep -E 'shuk-marketplace|olam mcp install|offline|git clone' plugin/README.md | wc -l
5
```

Exit code: 0. Requirement is ≥4.

## 2. New-session hand-off (operator runbook)

A7's full acceptance requires a fresh Claude Code session to validate that the
plugin loads cleanly and that `/olam:list` reaches the MCP server via the npx
fallback. This cannot be executed from within the current Claude Code session
(installing a plugin into the running session would change its state mid-test).

Operator runbook:

1. **Pick a host without `@pleri/olam-cli` globally installed** — `which olam`
   should print nothing, or use `nvm use system` in a shell that has no
   global node modules.

2. **Open a fresh Claude Code session** (new terminal, fresh `cwd`):

   ```sh
   cd ~/scratch
   claude
   ```

3. **Install the plugin from local path**:

   ```
   /plugin install /Users/ernie/Projects/ein-sof/olam-cli/plugin
   ```

   Expected: success message; Claude Code prompts to restart or auto-reloads.

4. **After reload, invoke `/olam:list`**:

   Expected: non-empty world list (or an empty-but-structured response if no
   worlds exist on this host). The MCP server should have booted via
   `npx -y @pleri/olam-cli mcp serve` (visible in `claude --debug` output).

5. **Capture screenshots** of the install confirmation + `/olam:list` output;
   commit them as `phase-a-smoke-screens/01-install.png`,
   `phase-a-smoke-screens/02-olam-list.png` next to this file.

6. **Edit this file**: change the top-line `**Result:**` to `PASS` and append
   timestamps below.

## 3. Known gaps from Phase A

- `claude plugin install --dry-run` flag does not exist on Claude Code 2.1.89.
  `claude plugin validate <path>` is the available local-manifest checker; it
  was used in place of `--dry-run` throughout Phase A. The plan's acceptance
  language for A1 (and A2's smoke language) should be updated in a follow-up
  to reference `validate` instead.

- The `claude plugin install <local-path>` path used by the operator runbook
  (step 3) requires verification on Claude Code 2.1.89 — the CLI's help text
  describes it as marketplace-resolved (`plugin@marketplace`). The README's
  offline-fallback section assumes local-path install works; if it does not,
  the offline path needs to switch to either
  `claude plugin marketplace add file://<local>` first OR
  `npm install -g .` of the cloned repo so the MCP server can boot directly.

- `scripts/` lives inside `plugin/` per the planner's stated path, meaning the
  scrub tooling ships with the published plugin. A future cleanup may move
  `scripts/` to be a sibling of `plugin/` so build-time tools do not bloat
  the published surface. Tracked as an assumption in
  `docs/plans/olam-skill-suite-publish/phase-a-tasks.md ## Assumptions log`.

## 4. Sign-off

When the operator runbook (§2) completes with PASS, update §0 result and add
a `Sign-off: <operator> <date>` line below. Until then, the Phase A PR can
ship with this PARTIAL result — the auto-verifiable checks gate the cutover
in `/10x:commit-plan` Phase F via the throwaway-account smoke (F5), which is
the load-bearing equivalent of this step.

Sign-off:
