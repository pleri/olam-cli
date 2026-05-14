# scrub-allowlist

Documented exceptions to `scrub-denylist.json`. Entries here are matches that
the scrub-check tool surfaces but that are **deliberately benign** — usually
because the matching token is a legitimate technical name rather than a
brand/secret leak.

## Format

- H3 entry per denylist regex (exact pattern string from the denylist).
- Bulleted file paths underneath, **relative to the `--target` directory**.
  CWD-relative paths are NOT supported (single canonical form avoids the
  duplicate-allowlist trap surfaced by Phase A CP3).

---

## Self-referential tooling exemptions

The scrub tool itself necessarily contains the literal denylist tokens
(`scrub-denylist.json` enumerates them; `scrub-check.mjs` includes one in an
inline usage example; `scrub-allowlist.md` contains them as H3 entries).
These files are scrub-check tooling, not skill content. Operators who install
the plugin do not encounter them at runtime.

A future cleanup may move `plugin/scripts/` outside `plugin/` (sibling to it)
so the scrub tooling is excluded from the published-plugin surface entirely;
until then, the self-references are allowlisted explicitly.

### Atlas Kitchen
- scripts/scrub-allowlist.md
- scripts/scrub-denylist.json

### atlas-kitchen
- scripts/scrub-allowlist.md
- scripts/scrub-check.mjs
- scripts/scrub-denylist.json

### @atlaskitchen
- scripts/scrub-allowlist.md
- scripts/scrub-denylist.json

### PLERI-INTERNAL-
- scripts/scrub-allowlist.md
- scripts/scrub-denylist.json

### \bAtlas\b
- scripts/scrub-allowlist.md
- scripts/scrub-denylist.json
