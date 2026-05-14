# Skill audit — 2026-05-14

**Scope**: all 8 plugin skills at `plugin/skills/<name>/SKILL.md` — `connect`, `create`, `destroy`, `dispatch`, `enter`, `list`, `status`, `ui-shoot`.

**Goal**: assess compliance (loader contract), effectiveness (routing accuracy), and adherence to documented Claude Code best practice. Apply enhancements in the same commit; this doc records the findings + the rubric used.

**Source for best practice**: [official Claude Code skills docs](https://code.claude.com/docs/en/skills.md), fetched 2026-05-14, surfaced via the `claude-code-guide` agent.

## Rubric

For each skill, scored against ten criteria:

| # | Criterion | Why |
|---|---|---|
| 1 | **Description length** | Combined `description + when_to_use` has a documented 1,536-char cap; under 200 chars is sparse routing signal. |
| 2 | **"Use when..." trigger language** | Strongly recommended pattern that improves auto-invocation accuracy. |
| 3 | **Trigger-phrase variety** | ≥3 representative operator phrases reduces miss rate. |
| 4 | **Sibling-overlap** | Two skills sharing the same trigger phrases create routing ambiguity. |
| 5 | **Body length** | <500 lines recommended; large bodies eat budget on every activation. |
| 6 | **Workflow section** | Explicit numbered steps for the model to follow. |
| 7 | **Failure handling** | Named error modes + recovery steps; critical for non-trivial workflows. |
| 8 | **Cross-skill references** | Markdown links to sibling skills for hand-offs. |
| 9 | **Anti-scope ("NOT for X")** | Explicit negative examples reduce false-positive routing. |
| 10 | **Internal-ref hygiene** | No leaks of internal git history, plan IDs, or private-doc paths without public-URL form. |

## Findings — pre-audit state

### olam-connect

- **Description (130 chars)** — too sparse; no `Use when...` trigger language; no anti-scope to disambiguate from `olam-enter` ("connect to world" overlap).
- **Trigger overlap** — both `olam-connect` and `olam-enter` carry "connect" semantics. The connect skill is about MCP transport setup; the enter skill is about shell access. Routing ambiguity.
- **Body** — covers two install paths (CF SSO + service token) cleanly, with troubleshooting; no anti-scope.

### olam-create

- **Internal git history leaked** — "Worker auth migrated to Pylon-validated scoped tokens in PR #31; the legacy `OLAM_AUTH_TOKEN` static bearer was removed in `mcp-pylon-outbound-auth Phase A`". Operators don't need this. Worse: it dates fast — the next migration makes this misleading.
- **Dead reference** — `/olam:cf-login` named twice; no such skill exists in `plugin/skills/`.
- **Internal doc reference** — `olam/docs/CF_WORLDS_SPEC.md` (private source repo).
- **No anti-scope**.

### olam-destroy

- **No failure handling section** — destroy is a high-risk verb (irreversible); operators need explicit recovery paths for stale registry, hung DO, partial R2 archive, etc.
- **No anti-scope**.
- **No crystallize reminder** — destroy is permanent for in-memory trace state; the existing copy mentioned it but as a generic afterthought.
- **Internal doc reference** — `olam/docs/CF_WORLDS_SPEC.md`.

### olam-dispatch

- **No failure handling section** — the CF-mode 401-roundtrip is the single most common failure mode; lives only as a paragraph inside "Cloudflare mode" rather than a structured fail-handler block.
- **No anti-scope**.
- **Internal doc reference**.

### olam-enter

- **Trigger overlap with olam-connect** — "connect to world" in this skill collides with `olam-connect`'s domain. Major routing-ambiguity source.
- **No anti-scope** — operators conflating MCP setup with shell access have no in-skill signal that they may be in the wrong place.
- **No failure handling**.
- **Internal doc reference**.

### olam-list

- **Light body** — ~25 lines; no filter guidance, no empty-state nuance beyond a single sentence.
- **No anti-scope** — operators asking "show me everything" may be routed here when they actually want `olam-status` (single-world depth).
- **No failure handling**.
- **Internal doc reference**.

### olam-status

- **Trigger-phrase coverage thin** — 2 phrases ("world status", "check world"); could carry more.
- **No failure handling** — stale-status / `null`-cost / heartbeat-gap are real and frequent edge cases.
- **No anti-scope**.
- **Internal doc reference**.

### olam-ui-shoot

- **Exemplary** — comprehensive workflow, failure handling, anti-scope, cross-references. Use as a template for the other 7.
- **Only finding**: internal doc reference (`docs/architecture/04-authority-boundary.md`).

## Enhancements applied (this commit)

Single commit, eight files. Per-skill changes:

| Skill | Description tightened | Anti-scope added | Failure handling added | Cross-skill `See also` added | Internal doc ref → public URL | Other |
|---|---|---|---|---|---|---|
| connect | ✓ (clarified shuk-vs-http path) | ✓ | n/a (already has troubleshooting) | ✓ | n/a | — |
| create | ✓ | ✓ | ✓ (expanded) | ✓ | ✓ | Removed dead `/olam:cf-login` reference + internal git/plan refs |
| destroy | ✓ | ✓ | ✓ (new section) | ✓ | ✓ | Added crystallize-before-destroy reminder as a workflow step |
| dispatch | ✓ | ✓ | ✓ (new section) | ✓ | ✓ | — |
| enter | ✓ (dropped "connect to world" trigger) | ✓ | ✓ (new section) | ✓ | ✓ | Anti-scope explicitly points to `olam-connect` for MCP setup |
| list | ✓ | ✓ | ✓ (new section) | ✓ | ✓ | Added hand-off to `olam-status` for single-world drill-down |
| status | ✓ (more trigger phrases) | ✓ | ✓ (new section) | ✓ | ✓ | — |
| ui-shoot | n/a (already exemplary) | n/a (already present) | n/a (already present) | n/a (already present) | ✓ | — |

## Internal-ref → public-URL replacement

All occurrences of `olam/docs/CF_WORLDS_SPEC.md` (5 skills) and `docs/architecture/04-authority-boundary.md` (1 skill) replaced with public-URL form (`https://github.com/pleri/olam/blob/main/docs/<path>`). Operators with repo access can click through; operators without it see a clear pointer to the spec they would need to request.

This is the honest stance — we're a published artifact pointing at a source repo; we shouldn't hide the source paths nor pretend they don't exist.

## Compliance verification

Post-enhancement:

- `claude plugin validate plugin/` → ✓
- `node plugin/scripts/scrub-check.mjs --denylist plugin/scripts/scrub-denylist.json --target plugin/ --allowlist plugin/scripts/scrub-allowlist.md` → exit 0 (10 matches, 0 unaddressed; all matches are self-referential scrub tooling)
- All 8 skills have valid `name:` frontmatter (head -3 grep passes)
- `claude plugin install <plugin> --dry-run` not available on Claude Code 2.1.89; `validate` is the available checker

## Open follow-ups (not in this commit)

1. **Routing eval** — Phase B's `tests/skill-routing-eval/prompts.json` baseline still expects graded Config 1 / Config 2 / Config 3 scores. Re-grading against the enhanced skills is the right next step; needs a non-author grader against a fresh Claude Code session with the plugin installed.
2. **`/olam:cf-login` skill** — referenced previously but never implemented. If the workflow exists (config wizard for the `.env.local` CF block), it deserves its own skill. If it doesn't, the references are cleanly gone now and the gap closes.
3. **`olam-connect` shuk-vs-http path bifurcation** — the published path (shuk-marketplace) and the admin-hosted path (http-transport) are now both documented in the connect skill's anti-scope. Worth considering whether they should be separate skills entirely, with `olam-connect` becoming `olam-connect-http` and a new `olam-connect-shuk` covering the local-stdio path. Defer until routing-eval data shows whether operators conflate the two.
4. **Body bloat watch** — connect (90 lines), create (~95), ui-shoot (115) are near the recommended 500-line ceiling but well under. If thick skills land in Phase C and grow further, split detail to `examples.md` or `reference.md` per the docs.

## Methodology notes

- Best-practice research was sourced from `claude-code-guide` against the official Claude Code skills docs; gaps in the docs (e.g., no formal lint tool for SKILL.md content, no documented length cap for `description` alone) were called out by the agent rather than invented.
- Each skill was assessed against the rubric individually; the audit grade was structured (table form above) rather than narrative.
- Enhancements were applied surgically — preserving existing copy where it worked, adding sections where missing — rather than wholesale rewrites. This minimizes routing-behavior delta on already-good skills (ui-shoot) and concentrates the change on the ones with real gaps.
