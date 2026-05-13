# scrub-allowlist

Documented exceptions to `scrub-denylist.json`. Entries here are matches that the
scrub-check tool surfaces but that are **deliberately benign** — usually because
the matching token is a legitimate technical name rather than a brand/secret leak.

Format: H3 entry per denylist regex; bulleted file paths underneath. Paths are
matched both relative to the working dir of the scrub-check invocation AND
relative to the `--target` directory.

---

## Self-referential tooling exemptions

The scrub tool itself necessarily contains the literal denylist tokens
(`scrub-denylist.json` enumerates them; `scrub-check.mjs` includes one in an
inline usage example). These files are scrub-check tooling, not skill content.
Operators who install the plugin do not encounter them at runtime.

A future cleanup may move `plugin/scripts/` outside `plugin/` (sibling to it)
so the scrub tooling is excluded from the published-plugin surface entirely;
until then, the self-references are allowlisted explicitly.

### Atlas Kitchen
- plugin/scripts/scrub-allowlist.md
- plugin/scripts/scrub-denylist.json
- scripts/scrub-allowlist.md
- scripts/scrub-denylist.json

### atlas-kitchen
- plugin/scripts/scrub-allowlist.md
- plugin/scripts/scrub-check.mjs
- plugin/scripts/scrub-denylist.json
- scripts/scrub-allowlist.md
- scripts/scrub-check.mjs
- scripts/scrub-denylist.json

### @atlaskitchen
- plugin/scripts/scrub-allowlist.md
- plugin/scripts/scrub-denylist.json
- scripts/scrub-allowlist.md
- scripts/scrub-denylist.json

### PLERI-INTERNAL-
- plugin/scripts/scrub-allowlist.md
- plugin/scripts/scrub-denylist.json
- scripts/scrub-allowlist.md
- scripts/scrub-denylist.json
