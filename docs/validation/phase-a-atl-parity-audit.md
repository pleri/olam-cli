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

### Audit-item coverage

Source-of-truth table lives in [`phase-a-tasks.md` § Audit item coverage](https://github.com/pleri/olam/blob/main/docs/plans/olam-atl-skill-parity/phase-a-tasks.md#audit-item-coverage). Phase A maps T2 / T3 / T4 / T6 / P1 / C1 to the A1–A6 mitigations enumerated there; this audit doc does NOT restate the table to avoid drift between the two artefacts.

Mitigation evidence (one-liners against each row, since they ARE the verification trace):

- **T2** scrub-check exit 0 on all 5 skills + full plugin tree (0 unaddressed via allowlist); `\bAtlas\b` denylist entry added in Phase A.A8 CP3 follow-up to catch the bare-Atlas leak class.
- **T3** every skill carries Anti-scope + See-also cross-link to its `/atl:*` sibling (pinned to atlas-toolbox SHA `d287ea1`).
- **T4** copy-on-port verified; pinned See-also SHAs surface upstream-rename as 404. Drift-audit script proposed as Phase B.B5 follow-up.
- **T6** scrub-check verification (see T2).
- **P1** install-size delta = +41 KB / +50 KB budget = 82%.
- **C1** Anti-scope cross-links carry routing signal; adoption-side measurement lands in Phase D.D1 routing-eval extension.

### What was deliberately NOT done

- **No `/olam:rails-standards` or `/olam:frontend-standards` references that resolve** — those skills don't exist yet (Phase C). `/olam:plan` and `/olam:review` reference them as forward-links with explicit "when they ship" hedging.
- **No `/olam:pickup-session`** — referenced from `/olam:handoff-session` as TODO; the receiver-side counterpart isn't part of Phase A scope.
- **No project-policy hooks** — Phase A is intentionally policy-free (T2 mitigation). Policies arrive in Phase B (`.olam/policies/*.md applies_to:` schema).
- **No `/olam:isor`-style chat-post-hook** — Atlas-specific, out of scope. The session-context appendix in `/olam:commit-push-pr` is portable; the ISOR post-step is not.
- **No baseline-PNG regen for routing-eval** — that's a Phase D.D1 task.

## CP3 adversarial audit (2026-05-14)

Single-agent adversarial pass spawned per `/10x:pickup-execute-audit` CP3 contract (epic × clean-revert → Seams + Security + Simplicity lens set, B8). Outcome: **(b) Land with noted follow-ups** — 0 CRITICAL, 2 HIGH, 4 MEDIUM, 2 LOW.

Findings closed in the **A8 follow-up commit** on this same branch (before #4 merges):

| # | Lens | Severity | Finding | Fix landed |
|---|---|---|---|---|
| 1 | Seams | HIGH | Bare `Atlas` leak in commit-push-pr line 16 ("Atlas / Pleri" example outside Anti-scope) | Reworded prose; added `\bAtlas\b` to scrub-denylist with allowlist entries for the self-referential scrub-tooling files. Also reworded `plan/SKILL.md:205` (caught by the new rule). |
| 2 | Security | HIGH | Prompt-injection-shaped ticket-URL risk in `/olam:plan` — fetched ticket content flows into Write/Edit unguarded | Added explicit Global Rules clause: ticket URLs are UNTRUSTED INPUT; quote-and-summarise only; refuse instructions about non-`.plans/` writes or tool invocations. |
| 3 | Security | MEDIUM | `gh gist create` defaults to PUBLIC in handoff-session step 4 | Added `--secret` flag; added Failure-handling row for "public gist accidentally created → rotate + delete" path. |
| 4 | Security | MEDIUM | `git add -A` in handoff-session captures `.env` / credentials with no pre-stage filter | Added mandatory pre-stage secret scan (`.env / .key / .pem / .p12 / credentials / secrets / .aws/ / .ssh/`); refuses to proceed if any match surfaces. |
| 5 | Seams | MEDIUM | Naming-convention drift between `olam-foo` (dashed) and `/olam:foo` (slash-colon) in prose | Normalised all 25 prose refs across the 5 SKILL.md files to slash-colon form; added MANIFEST naming-conventions section codifying the rule. |
| 6 | Seams | MEDIUM | Copy-on-port drift discovery has no mechanism beyond "See also link" | Pinned all 5 See-also URLs to atlas-toolbox commit SHA `d287ea14ac390e212e88368e61c382fc10c74124` (rename-detect via 404). Full drift-audit script proposed as Phase B.B5 follow-up (tracked at plan level). |
| 7 | Simplicity | MEDIUM | `/olam:review` Deep mode hardcoded "sonnet" / "haiku" model picks conflict with operator project rules | Parameterised to `reasoning` / `mechanical` tiers; concrete model picks defer to operator project rules. |
| 8 | Simplicity | LOW | `/olam:plan` 8-stack detection table over-promises (only 2 templates exist) | Pruned to "Backend / Frontend / Other" routing matching actual template surface. |
| 9 | Simplicity | LOW | Audit-doc / tracker coverage-table dedup risk | Replaced doc's full table with cite-to-tracker + one-line mitigation evidence. Tracker remains source-of-truth. |

Deferred to future phases (tracker rows):
- Drift-detection automation (`npm run audit:atl-parity`) — **Phase B.B5 (proposed)**.

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
