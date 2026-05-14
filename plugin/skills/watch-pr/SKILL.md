---
name: olam-watch-pr
description: Watch a GitHub PR after creation — continuously poll CI checks, workflow runs, new review comments, and mergeability state until the PR is ready to merge (or merged/closed). Use when the user says "watch this PR", "watch my PR", "monitor PR #N", or "keep an eye on the PR". Diagnoses CI failures, retries likely flaky failures up to 3 times, auto-fixes branch-related issues when appropriate, and stops only when user help is required (CI infra issues, exhausted retries, ambiguous blockers).
argument-hint: "[PR number, PR URL, or empty to infer from current branch]"
user-invocable: true
allowed-tools:
  - Read
  - Edit
  - Bash
  - Grep
  - Glob
---

# PR watcher

Pure `gh` CLI delegation. No project-specific coupling. The watcher script (`~/.claude/scripts/watch-pr/gh_pr_watch.py`) is the long-running operator; this skill orchestrates the loop.

## Objective

Watch a PR persistently until one terminal outcome:

- The PR is merged or closed.
- CI green, no unaddressed review comments, required approval present, no merge conflicts.
- A blocker requires user help (CI infra issues, repeated flaky failures after the retry budget, permission problems, ambiguity that cannot be resolved safely).

Do NOT stop merely because a single snapshot returns `idle` while checks are still pending.

## Inputs

- No argument → infer the PR from the current branch (`--pr auto`).
- PR number.
- PR URL.

## Core workflow

1. When the user asks to "monitor" / "watch" a PR, start with continuous mode (`--watch`) unless an intentional one-shot snapshot is needed.
2. Run the watcher script to snapshot PR / CI / review state (or consume each streamed snapshot from `--watch`).
3. Inspect the `actions` list in the JSON response.
4. If `diagnose_ci_failure` is present, inspect failed-run logs and classify.
5. If the failure is branch-related, patch the code locally, commit, and push.
6. If `process_review_comment` is present, inspect surfaced items and decide whether to address.
7. If a review item is actionable AND correct, patch the code, commit, push.
8. If `address_pending_reviews` is present, the snapshot includes `unreplied_comments`. Read each one, change code if needed, reply to each. Push after addressing all.
9. If the failure is likely flaky and `retry_failed_checks` is present, rerun failed jobs with `--retry-failed-now`.
10. If BOTH actionable review feedback AND `retry_failed_checks` are present, prioritise review feedback first — a new commit re-triggers CI on a fresh SHA.
11. On every loop, verify mergeability / merge-conflict state via `gh pr view` in addition to CI and review state.
12. After any push or rerun, return to step 1 and continue polling on the updated SHA.
13. If `--watch` was paused to patch / commit / push, relaunch `--watch` yourself in the same turn after the push.
14. Repeat until the PR is green + review-clean + mergeable, OR `stop_pr_closed` appears, OR a user-help-required blocker is reached.
15. Maintain terminal / session ownership while watching is active. Don't leave a detached `--watch` process running and then end the turn as if monitoring were complete.

## Commands

The watcher script lives at `~/.claude/scripts/watch-pr/gh_pr_watch.py`. Requires `gh` CLI installed + authenticated.

### One-shot snapshot

```bash
python3 ~/.claude/scripts/watch-pr/gh_pr_watch.py --pr auto --once
```

### Continuous watch (JSONL stream)

```bash
python3 ~/.claude/scripts/watch-pr/gh_pr_watch.py --pr auto --watch
```

### Trigger flaky retry cycle (only when the watcher indicates)

```bash
python3 ~/.claude/scripts/watch-pr/gh_pr_watch.py --pr auto --retry-failed-now
```

### Explicit PR target

```bash
python3 ~/.claude/scripts/watch-pr/gh_pr_watch.py --pr <number-or-url> --once
```

## CI failure classification

Use `gh` to inspect failed runs before deciding to rerun:

- `gh run view <run-id> --json jobs,name,workflowName,conclusion,status,url,headSha`
- `gh run view <run-id> --log-failed`

**Branch-related** — logs point to changed code (compile / test / lint / typecheck / snapshots / static analysis in touched areas).

**Flaky / unrelated** — logs show transient infra / external issues (timeouts, runner provisioning failures, registry / network outages, GitHub Actions infra errors).

If classification is ambiguous, perform one manual diagnosis attempt before choosing rerun.

## Review-comment handling

The watcher surfaces review items from PR issue comments, inline review comments, and review submissions. Both human reviewer feedback AND trusted review-bot feedback (e.g. claude[bot], codex-connector[bot]) are surfaced.

On a fresh watcher state file, existing pending review feedback may surface immediately (not only post-monitoring comments) — intentional, so already-open comments are not missed.

Every comment must be replied to. Judge whether to fix or push back:

**If valid and actionable**
1. Patch the code locally.
2. Commit: `claude: address PR review feedback (#<n>)`.
3. Push to the PR head branch.
4. Reply explaining what changed.
5. Resume watching immediately.

**If nitpicky / incorrect / not worth fixing**
1. Reply explaining why no change is needed ("acknowledged, not fixing because ...", "this is intentional because ...").
2. Do NOT make changes just to appease the reviewer.
3. Continue watching — the reply satisfies the "all comments addressed" check.

Reply to every comment; do NOT blindly accept every suggestion. Keep replies concise.

## Bot review limits

Bot review comments (claude[bot], cursor[bot], codex-connector[bot], etc.) are processed for a maximum of 3 rounds. Human comments are NEVER subject to this limit.

Rules:
- Round = one cycle of: bot comments surfaced → you address them → push.
- After 3 rounds of bot comments, stop processing bot comments and log "bot review budget exhausted (3/3 rounds)".
- Track rounds via the watcher's `--max-bot-review-rounds` flag.

## Git safety rules

- Work only on the PR head branch.
- Avoid destructive git commands.
- Do not switch branches unless necessary to recover context.
- Before editing, check for unrelated uncommitted changes — if present, STOP and ask the user.
- After each successful fix, commit and `git push`, then re-run the watcher.
- If you interrupted a live `--watch` session, restart `--watch` immediately after the push in the same turn.
- Do not run multiple concurrent `--watch` processes for the same PR / state file.
- A push is NOT a terminal outcome — continue the monitoring loop unless a strict stop condition is met.
- Track total pushes per session. After 5, stop and report — do not push again without explicit user instruction.

Commit message defaults:
- `claude: fix CI failure on PR #<n>`
- `claude: address PR review feedback (#<n>)`

## Polling cadence

Fixed 30-second polling interval. No backoff.

## Stop conditions (strict)

Stop ONLY when one of these holds:

- PR merged or closed.
- All comments replied to (`unreplied_comment_count == 0`) AND 5 minutes have passed since the last push. The quiet period lets bot reviewers post their comments.
- User intervention required and cannot safely proceed alone.
- Session has exceeded 2 hours of elapsed wall time.
- Total pushes in this session have reached 5.

Keep polling when:

- Less than 5 minutes since last push (quiet period not elapsed).
- Any unreplied comments exist.
- CI is still running or has failures being diagnosed.
- `actions` contains only `idle`.

## Session guardrails

| Guardrail | Limit | Behaviour |
|---|---|---|
| Bot review rounds | 3 | Stop processing bot comments; continue with humans. |
| Flaky retries per SHA | 3 | Stop and report persistent failure. |
| Total pushes | 5 | Stop and report; ask user to take over. |
| Session duration | 2 hours | Stop and report current state. |

Safety nets only — most PRs converge well within these limits.

## Output expectations

- Concise progress updates during monitoring; heartbeat updates only when nothing changes.
- Push confirmations, intermediate CI snapshots, and review-action updates are progress updates only — do not emit the final summary unless a strict stop condition is met.
- A review-fix commit + push is NOT a completion event — resume live monitoring immediately.

Final summary should include:

- Final PR SHA
- CI status summary
- Mergeability / conflict status
- Fixes pushed
- Flaky retry cycles used
- Remaining unresolved failures or review comments

---

## Failure handling

- **`gh` not authenticated** — surface `gh auth status`; ask the user to `gh auth login`.
- **Watcher script not installed** at `~/.claude/scripts/watch-pr/gh_pr_watch.py` — surface the path; tell the user the watcher script comes from a separate install step.
- **PR auto-detect fails** (no PR on current branch) — ask the user for the PR number / URL.
- **CI infrastructure outage** (GitHub Actions degraded) — STOP polling; report; let the user decide when to resume.
- **Repeated flaky failures (3 retries exhausted on the same SHA)** — STOP; surface the failure; ask the user to take over.
- **Push budget exhausted (5 pushes)** — STOP; report; ask user to take over.

---

## Anti-scope (what this skill is NOT for)

- **One-off PR status checks** — use `gh pr view <pr> --json state,statusCheckRollup` directly.
- **Creating PRs** — see `olam-commit-push-pr`.
- **Reviewing PR content** — see `olam-review`.
- **Handing off mid-flight work** — see `olam-handoff-session`.
- **Watching multiple PRs concurrently** — invoke once per PR; one watcher process per PR.

## See also

- [`/atl:watch-pr`](https://github.com/atlas-builders/atlas-toolbox/blob/main/shared/engineering/skills/watch-pr/SKILL.md) — ADB-flavoured sibling (identical core; both delegate to the same `gh_pr_watch.py` script).
- `olam-commit-push-pr` — open the PR before watching it.
- `olam-review` — manual review pass (alternative to watching for review-bot feedback).
