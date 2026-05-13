# scrub-allowlist

Documented exceptions to `scrub-denylist.json`. Entries here are matches that the
scrub-check tool surfaces but that are **deliberately benign** — usually because
the matching token is a legitimate technical name rather than a brand/secret leak.

Format: H3 entry per denylist regex; bulleted file paths underneath. Paths are
relative to either the working dir of the scrub-check invocation OR the target
directory.

---

(No entries — the pleri/olam plugin/ tree was confirmed clean against the
deny-list after A4 fixed `plugin/.claude-plugin/plugin.json` to use author
"Ernie Sim". If a future scrub-check surfaces a benign match, document it here
before re-running the gate.)
