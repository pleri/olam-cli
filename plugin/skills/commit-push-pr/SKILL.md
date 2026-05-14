---
name: olam-commit-push-pr
description: Commit changes, push the branch, and open a PR using the repo's template. Use when the user says "ship this", "open a PR", "commit and push", "make a PR for this", or when work is complete and ready for review. Analyses the diff, generates conventional commit messages (multi-commit detection), and uses the repo's `.github/PULL_REQUEST_TEMPLATE.md`.
argument-hint: "[optional PR title hint]"
user-invocable: true
allowed-tools:
  - Read
  - Edit
  - Bash
  - Grep
  - Glob
---

# Commit & PR

End-to-end "ship the work I just did" workflow: diff inspection → branch hygiene → conventional commit(s) → push → open PR with the repo's own template. Org-specific PR-body conventions come from project-local policies; this skill stays generic.

## Workflow

1. **Anchor to repo root.**
   ```bash
   ROOT=$(git rev-parse --show-toplevel)
   REPO=$(git remote get-url origin | sed 's|.*github.com[:/]||;s|\.git$||')
   ```
   All paths resolve from `$ROOT`. In worktrees the root is the worktree directory.

2. `git status` + `git diff HEAD` — understand current state.

3. **Branch** — if on main/master, pull latest and create a feature branch (see Branch Naming). If on a feature branch already, ask: "Continue on this branch or start fresh from main?" If starting fresh: stash, checkout main, pull, create new branch, `git stash pop`.

4. **Analyse changes** — detect whether a multi-commit split is appropriate (see Multi-Commit Detection).

5. **Stage selectively** — `git add <specific files>` per commit. Never `git add .` or `git add -A` (risks `.env` / secrets / build artefacts).

6. **Generate conventional commit message(s).**

7. **Rebase** — `git fetch origin && git rebase origin/main` (substitute `master` for legacy repos). On conflict, stop and ask the user.

8. **Push with `-u`** — `git push -u origin <branch>`.

9. **Open PR** — read `$ROOT/.github/PULL_REQUEST_TEMPLATE.md`, fill it, then `gh pr create --repo "$REPO" --title "<type>: <description>" --body "$(cat <<'EOF' ... EOF)"`.

10. **Verify the returned URL** points to the correct repo (catches `gh` auto-detection picking the wrong remote).

11. Return the PR URL.

---

## Guardrails

### ALWAYS
- Run `git status` first.
- Review the diff before committing.
- Use the repo's `.github/PULL_REQUEST_TEMPLATE.md` verbatim — fill each section, do not reformat.
- Use HEREDOC for multi-line commit messages.
- When editing an existing PR, pass the PR number explicitly.
- Pass `--repo owner/repo` on every `gh` invocation — never rely on auto-detection.
- Return the PR URL when done.

### NEVER
- Commit directly to main/master — always branch first.
- Add ticket numbers to commit subjects (e.g. `[TICKET-1234]`) — branch name carries the link.
- Add scopes to commit type (e.g. `feat(auth):`) — files-changed already provide context.
- Push if rebase produced conflicts — stop and ask.
- Invent a PR body shape — always use the repo's template.
- Commit secrets, `.env` files, credentials, or build artefacts.
- Skip the explicit `--repo` arg.

---

## Commit Message Format

```
<type>: <short description>

<body>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

**Rules:**
- Subject ≤72 chars, imperative mood ("add", not "added"), no trailing period.
- Body explains *what* and *why*, not *how*.

### Type detection heuristics

| File pattern | Type |
|---|---|
| `spec/`, `test/`, `__tests__/` | `test` |
| `docs/`, `*.md` (non-code) | `docs` |
| `Gemfile`, `package.json`, `*.lock` | `build` |
| `.github/workflows/`, `.circleci/` | `ci` |
| Whitespace / formatting only | `style` |
| Performance keywords (cache, optimise, N+1) | `perf` |

---

## Multi-Commit Detection

Default to fewer commits. Only split when changes solve **different problems**.

### Split when

- **Different layers** — service/business-logic fix vs API/controller fix; backend vs frontend; model vs migration.
- **Fix vs Prevention** — bug fix (handles existing bad data) AND validation/guard (prevents recurrence) are separate commits.
- **Independence test** — could commit A work without commit B? Yes → split.
- **Ticket hints** — multiple bullet points in the ticket → likely separate commits.

### Keep together

- Feature touching multiple files for the same purpose.
- Related test + implementation changes.
- Changes that would break if committed separately.

### Ordering

Commit dependencies first: migration → model → service → controller → test.

### Example

```bash
git add app/services/calculator.rb spec/services/calculator_spec.rb
git commit -m "fix: only use winning stock range in calculation"

git add app/mutations/create_stock_range.rb
git commit -m "fix: prevent duplicate stock ranges from being created"
```

---

## PR Creation

1. Read `$ROOT/.github/PULL_REQUEST_TEMPLATE.md`. If absent, use:
   ```markdown
   ## Summary
   [What changed and why]

   ## Changes
   - [Change 1]

   ## Testing
   [How to verify]
   ```
2. Fill each section in plain language (not jargon).
3. Append session context (see below).
4. `gh pr create --repo "$REPO" --title "<type>: <description>" --body "$(cat <<'EOF' ... EOF)"`.

### Draft PRs

Use `--draft` when the user requests, when WIP, or when tests are failing.

---

## Branch Naming

1. If the work has an associated ticket and the ticket system exposes a `gitBranchName` (Linear does), use it — auto-links PRs and syncs status.
2. Otherwise: `<type>/<short-description>` (e.g. `feat/add-logout-button`).
3. Fallback for handoff/exploratory work: `<member>/<short-description>`.

---

## Session Context (collapsible appendix)

After filling the PR template, append a `<details>` block. This helps reviewers understand the *why* — not just the diff.

1. Check `~/.claude/sessions/<session-id>/summary.md` — if present, read it.
2. Otherwise extract from the current session: goal, key decisions, failed approaches.
3. Check `.plans/` for a matching plan (match by ticket key from branch name, else most-recent).
4. If the CWD is inside an olam world (look for `~/.olam/worlds/<world-id>/` ancestor), capture world id + repos + branch via `olam status`.
5. Append to the PR body **after** all template sections:

```markdown
<details>
<summary>Session context</summary>

**Plan** (if `.plans/` has a match):
<details>
<summary>Implementation plan</summary>

**Scope:** ...
**Out of scope:** ...
**Deviations:** ...

</details>

**Decisions:** key choices + reasoning.
**Failed approaches:** what was tried and didn't work.

**Environment** (if olam world):
```
olam create <world-name>
olam dispatch <world-name> "<task>"
```

</details>
```

**Rules:**
- Append after the repo's PR template — never replace or reformat the template.
- 3–5 bullets max per section.
- Omit sections that don't apply.
- No raw transcripts or logs — curated reasoning only.

---

## Failure handling

- **Detached HEAD** — refuse to commit; ask the user to check out a branch first.
- **Uncommitted secrets detected** (`.env`, `*.key`, `*credentials*`) — refuse to stage; surface the file path and ask for explicit confirmation.
- **Rebase conflict** — stop, surface the conflicting files, ask the user to resolve.
- **`gh` not authenticated** — surface `gh auth status` and tell the user to run `gh auth login`.
- **No PR template found** — fall back to the minimal default; log a note.
- **Multiple GitHub remotes** — pick `origin`; if `origin` doesn't exist, ask which remote to push to.

---

## Anti-scope (what this skill is NOT for)

- **First-time committing without a plan** — see `/olam:plan` to create the spec first.
- **Force-pushing or rewriting published history** — not automated; that's an explicit operator decision.
- **Watching the PR after creation** — see `/olam:watch-pr`.
- **Reviewing the diff for correctness** — see `/olam:review`.
- **Posting status to Slack / Discord / etc.** — out of scope; project-local policies own that.

## See also

- `/atl:commit-push-pr` — ADB-flavoured upstream sibling (includes Linear `gitBranchName` autopull + org-specific Slack-post hook). This skill is the olam-native equivalent.
- `/olam:plan` — author the spec before shipping.
- `/olam:review` — review the diff before opening the PR.
- `/olam:watch-pr` — keep the PR green after opening.
