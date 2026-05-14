---
name: olam-review
description: Review code changes against project standards. Works for local uncommitted changes or a GitHub PR. Use when the user says "review this", "check my diff", "review PR #N", or "is this ready to ship". Trigger phrases like "really", "are you sure", "double-check", or the explicit `--deep` flag escalate to multi-agent verification with consensus.
argument-hint: "[PR number, PR URL, or empty for local diff] [--deep]"
user-invocable: true
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
  - Task
---

# Review

Two modes:

- **Standard** — single-pass review against project standards.
- **Deep** — multi-agent verification with consensus; triggered by `--deep` or conversational cues ("really", "are you sure", "verify this", "double-check", "make sure").

Works for **local changes** (uncommitted diff) or a **PR** (existing comments are respected).

Org-specific conventions (Rails service patterns, frontend component idioms) come from the future `/olam:rails-standards` and `/olam:frontend-standards` skills. Until they ship, this skill applies general code-quality heuristics.

---

## Standard mode

### Approach

1. Detect context — PR number provided? Fetch via `gh pr view --json` + `gh pr diff`. Otherwise use `git diff HEAD`.
2. Gather context — diff, changed files, plan file in `.plans/` if it exists.
3. Load relevant standards (`/olam:rails-standards` / `/olam:frontend-standards` when present).
4. If PR: read existing comments and author replies first.
5. Review against standards and the guideposts below.
6. Report findings grouped by severity.
7. If PR: optionally reply to unaddressed comments.

### Output

**Local changes:**
- Findings grouped by severity.
- What looks good (one or two highlights).

**Pull requests:**
- Context: what problem is being solved.
- Assessment of existing comments (already-addressed / still-pending).
- New issues not already discussed.
- Verdict: **Approve** / **Request changes**.

---

## Deep mode (multi-agent verification)

Trigger: `--deep` flag, or conversational cues ("really", "are you sure", "verify this", "double-check", "make sure").

### Phase 1 — Gather context

Collect in parallel before spawning agents:

1. Read plan file if present (`.plans/<KEY>/PLAN.md`).
2. `git diff HEAD` + `git diff --name-only HEAD`.
3. Read all changed files in full.
4. `git log --oneline -5` for recent context.

### Phase 2 — Spawn verification agents (parallel)

Launch 5–6 specialised agents in a **single message**, each with the full context (plan summary + git diff). Two model tiers are used: a **reasoning model** for deeper analysis (logic / security / DB-perf) and a **mechanical model** for search / pattern / completeness tasks. The concrete model picks **MUST defer to the operator's project rules** (a project may pin all subagents to Opus; another may prefer Sonnet for the reasoning tier and Haiku for the mechanical tier). If the project has no preference, the reviewing agent picks reasonable defaults consistent with its own model.

| Agent | Tier | Focus | Key checks |
|---|---|---|---|
| Best Practices (reviewer) | mechanical | Code quality | Conventions, readability, naming, complexity, callback patterns |
| DB Performance (db-optimizer) | reasoning | Query efficiency | N+1, missing eager loading, missing indexes, complex queries |
| Completeness (verifier) | mechanical | Implementation gaps | Placeholders, incomplete error handling, edge cases, TODOs, missing tests |
| Pattern Consistency (Explore) | mechanical | Codebase alignment | Similar implementations elsewhere, deviations from existing patterns |
| Logic & Correctness (reviewer) | reasoning | Bugs | Logic flow, conditional coverage, return values, state mutations, typos |
| Security (qa-engineer) | reasoning | Safety | Input validation, authorisation, injection risks, mass assignment, race conditions |

Each agent MUST:

- Read actual code (never assume).
- Provide evidence with `file:line` references.
- Check existing patterns before suggesting changes.
- Rate confidence: high / medium / low.
- Rate severity: critical / high / medium / low.

### Phase 3 — Analyse results

Group findings by agreement level:

- **Consensus** (3+ agents agree) → high confidence; report as definitive.
- **Agreement** (2 agents agree) → medium confidence; report with caveat.
- **Single finding** (1 agent) → needs second-round verification.
- **Disagreement** (conflicting) → must resolve in follow-up round.

### Phase 4 — Resolve disagreements (if needed)

For disagreements or low-confidence findings, spawn follow-up agents with both sides of the argument. Ask them to search the codebase for evidence and provide a definitive answer.

Repeat until consensus. **Maximum 3 rounds** — prevents infinite loops.

### Phase 5 — Consensus report

```markdown
## Verification Results

### Consensus: REACHED | PARTIAL
**Agents:** [...]  |  **Rounds:** N

### Critical (Must Fix)
#### 1. {Title}
**Location:** `file:line` | **Found by:** [...] | **Confidence:** high
**Description:** {what's wrong}
**Fix:** {recommendation}

### High / Medium / Low Priority
(same shape, grouped)

### Verified Correct
- {Things confirmed correct}

### Summary
| Severity | Count |
|---|---|
| Critical | X |
| High | X |
| Medium | X |

**Assessment:** Good to merge | Needs fixes | Significant issues
```

### Phase 6 — Present and act

1. Display the consensus report.
2. Ask which issues to address (if any).
3. Wait for explicit approval before making changes.

---

## Shared guideposts (both modes)

**Scoping**
- Only review code that changed.
- Don't flag pre-existing issues.
- "Nice-to-have beyond the change's purpose" is out of scope.

**Reviewing a PR**
- Read ALL existing comments first.
- "Acknowledged" / "will leave as-is" → don't re-raise.
- "Will fix" → check if it's fixed.
- Respect author decisions; evaluate their reasoning fairly.

**Before flagging an issue**
- Is this actually in the changed code?
- Have I traced constants / modules to verify my understanding?
- Does the codebase do this elsewhere? (pattern consistency)
- Has this already been discussed?

**Severity rubric**
- **Critical** — security, data loss, crashes.
- **High** — bugs, wrong logic, N+1 queries.
- **Medium** — performance, incomplete handling.
- **Low** — style nits.

---

## Failure handling

- **PR not found** — `gh pr view` returns 404. Surface the error and ask the user to confirm the PR number / URL.
- **Merge conflicts on the PR branch** — note them in the verdict; do not attempt to auto-rebase from this skill (use `/olam:watch-pr` or the user's PR-resolution flow).
- **CI red on the PR** — surface the failure summary (`gh pr checks <pr>`); flag as gating in the verdict.
- **No diff to review** — tell the user (`git diff HEAD` empty AND no PR specified).
- **Standards skills not yet shipped** — fall back to the general guideposts; note "applied general heuristics; project-local standards not yet available" in the output.
- **Deep mode disagreement after 3 rounds** — present both sides + your judgement; do not loop further.

---

## When to skip

- Trivial changes (typos, comments-only edits, formatting-only).
- User explicitly says to skip.
- Code is already well-tested AND the diff is mechanical.

---

## Anti-scope (what this skill is NOT for)

- **Security-deep-dive** — when `/olam:security-review` ships, route there.
- **Architectural review** — see `architect` agent for system-design discussions.
- **First-time approach review** — see `/olam:plan` to produce a spec before code exists.
- **Watching a PR after review** — see `/olam:watch-pr`.
- **Committing or merging** — see `/olam:commit-push-pr`.

## See also

- [`/atl:review`](https://github.com/atlas-builders/atlas-toolbox/blob/d287ea14ac390e212e88368e61c382fc10c74124/shared/engineering/skills/review/SKILL.md) — ADB-flavoured sibling skill (atlas-specific standards refs).
- `/olam:plan` — pre-implementation specs.
- `/olam:commit-push-pr` — turn the reviewed work into a PR.
- `/olam:watch-pr` — keep the PR green after opening.
