# Phase A — atl:* parity ports — retrospective audit

**Plan:** [`docs/plans/olam-atl-skill-parity/phase-a-tasks.md`](https://github.com/pleri/olam/blob/main/docs/plans/olam-atl-skill-parity/phase-a-tasks.md) (pleri/olam main)
**Branch:** `feat/olam-atl-skill-parity-phase-a`
**Date:** 2026-05-14

## Goal

Port the 5 adb-generic `/atl:*` skills (`atl:plan`, `atl:commit-push-pr`, `atl:review`, `atl:handoff-session`, `atl:watch-pr`) to `/olam:*` siblings as `tier: thick` workflow skills inside `pleri/olam-cli/plugin/`. No policy dependency; no shared source.

## What landed

| Task | Skill | LOC | Anti-scope | See-also | Scrub | Verdict |
|---|---|---|---|---|---|---|
| A1 | `/olam:plan` | 211 | yes | `/atl:plan` | OK | ✓ |
| A2 | `/olam:commit-push-pr` | 230 | yes | `/atl:commit-push-pr` | OK | ✓ |
| A3 | `/olam:review` | 199 | yes | `/atl:review` | OK | ✓ |
| A4 | `/olam:handoff-session` | 205 | yes | `/atl:handoff-session` | OK | ✓ |
| A5 | `/olam:watch-pr` | 212 | yes | `/atl:watch-pr` | OK | ✓ |
| A6 | MANIFEST + size | 1 file ±13 rows | n/a | n/a | OK | ✓ |
| A7 | This doc | n/a | n/a | n/a | n/a | ✓ |

Total new SKILL.md content: 1057 lines across 5 files. All ≤250 LOC per acceptance.

## Verifications

### Acceptance (per phase-a-tasks.md)

- ✓ Each SKILL.md exists with `name: olam-<x>` frontmatter and ≥150-char description containing "Use when..." trigger phrases.
- ✓ Each body has Workflow + Failure handling + Anti-scope + See also sections.
- ✓ Each is ≤250 lines.
- ✓ `claude plugin validate plugin/` passes (manual; no validator regressions vs main).
- ✓ `scrub-check.mjs` exits 0 on each `plugin/skills/<name>/` target.
- ✓ Full `plugin/` scrub-check with `--allowlist plugin/scripts/scrub-allowlist.md` reports 10 matches, **0 unaddressed** (all self-referential tooling already allowlisted).

### Install-size budget (A6)

Compared via `git ls-tree -r <ref> plugin/skills/ | xargs -I{} git cat-file -p <ref>:{} | wc -c`:

- Baseline (`main`): 27857 bytes
- HEAD (this branch): 69930 bytes
- **Delta: +42073 bytes (+41 KB)** — within the ≤+50 KB acceptance budget.

### Audit-item coverage (from phase-a-tasks.md `## Audit item coverage`)

| Audit row | How addressed |
|---|---|
| **T2** Atlas-specificity misclassification | All 5 SKILL.md files scoped to generic stack patterns; Atlas-specific patterns (Solid Queue, Panko, archived_at, ADB workspace detection, atl:engineering-{backend,frontend} refs) deliberately omitted. Scrub-check exit 0. |
| **T3** Operator confusion `/atl:` vs `/olam:` | Every skill carries an explicit Anti-scope bullet pointing at the `/atl:*` sibling, and a See-also link with the upstream URL. Operators discovering `/olam:plan` see "this is the olam-native sibling; for ADB-flavoured work use /atl:plan." |
| **T4** 5 direct ports + `/atl:*` version drift | Copy-on-port (not import / not shared file). Each `/olam:*` skill is now independently versioned. The See-also link in each file makes the relationship discoverable, so future drift between siblings can be reviewed by inspecting both. |
| **T6** Atlas-internal refs leak via SKILL.md | Scrub-check pre-merge on each skill (`plugin/skills/<name>/`) and on the full plugin tree. Zero unaddressed matches in any SKILL.md. |
| **P1** Plugin install size | A6 measured delta = +41 KB ≤ +50 KB budget. |
| **C1** Routing ambiguity `/atl:` vs `/olam:` | Anti-scope bullets in each skill + the See-also URL cross-link give Claude's router enough signal to disambiguate. (Adoption signal will land in Phase D.D1 routing-eval extension.) |

### What was deliberately NOT done

- **No `/olam:rails-standards` or `/olam:frontend-standards` references that resolve** — those skills don't exist yet (Phase C). `/olam:plan` and `/olam:review` reference them as forward-links with explicit "when they ship" hedging.
- **No `/olam:pickup-session`** — referenced from `/olam:handoff-session` as TODO; the receiver-side counterpart isn't part of Phase A scope.
- **No project-policy hooks** — Phase A is intentionally policy-free (T2 mitigation). Policies arrive in Phase B (`.olam/policies/*.md applies_to:` schema).
- **No `/olam:isor`-style chat-post-hook** — Atlas-specific, out of scope. The session-context appendix in `/olam:commit-push-pr` is portable; the ISOR post-step is not.
- **No baseline-PNG regen for routing-eval** — that's a Phase D.D1 task.

## Assumptions log

(Phase A had no load-bearing assumption forks; no rows added to the tracker's Assumptions log.)

## Follow-ups (out of scope for Phase A)

| Item | Phase | Notes |
|---|---|---|
| `applies_to: string[]` schema extension on `.olam/policies/*.md` | B.B1 | Substrate for org-specific behaviour layered onto skills. |
| `getPoliciesForSkill(skillId)` loader helper | B.B2 | Consumed by Phase C skills. |
| `/olam:rails-standards` + `/olam:frontend-standards` | C.C1 + C.C2 | Conditional-flavour skills built on B substrate. |
| Routing-eval extension (`prompts.json`) for the 5 new + 2 Phase C skills | D.D1 | Cross-plan dependency on olam-skill-suite-publish Phase B.B2. |
| Week-2 + week-4 falsifiable-signal review | D.D3 | Decides Phase E activation. |

## Verdict

Phase A goal achieved: 5 thick `/olam:*` skills shipped, parity with the adb-generic subset of `/atl:*` reached, no Atlas-internal refs leaked, install-size budget respected. Ready for review + merge.
