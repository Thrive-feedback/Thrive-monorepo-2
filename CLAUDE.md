# CLAUDE.md

See the [Agents Guide](AGENTS.md) for how to work here — the repo map, the commands, the
hard rules, and how to build your read set. Read it in full before your first edit.

See [`PROJECT.md`](PROJECT.md) for what this repository *is* — its kind and stage, which
parts of the stack exist versus are only planned, which code is example code, and which
decisions are still open. It is the only file that states those facts, so never assume
them from anywhere else.

If `CLAUDE.local.md` exists in the project root, read it too — it contains local overrides
and personal workflow conventions that are not checked into the repo.

Before writing code, build your read set from
[`docs/conventions/index.html`](docs/conventions/index.html): every **P0**, the **P1**
entries of the areas you are touching, and any entry whose **Open when** trigger or
`data-paths` globs match your task. Check each entry's `data-status`: while it is `todo`
the document does not exist and the index entry is the binding text — name any entry you
had to interpret.

Before authoring a convention document, read `GEN_12` in full — it is the authoring
contract, and its worked example holds the exact prompt to use, so documents come out
consistent regardless of which model wrote them.

---

## Claude Code specifics

Everything else lives in `AGENTS.md`. These are the parts that only apply here:

- **Use plan mode** for anything beyond a single obvious edit. State the convention ids you
  are working under, the files you will touch, anything from the *planned* column of
  `PROJECT.md` that the task would need, and what you are explicitly not doing. These
  conventions are inherited by every project built from this one, so a wrong pattern is
  copied rather than contained — the plan is worth more than the speed.
- **Prefer the file tools** (Read, Edit, Write, Grep, Glob) over shell equivalents. Bash is
  for Bun and Turbo.
- **Never run `git commit` or `git push` unless asked.** Branch first if you are on `main`.
- **Subagents only when asked for one by name.** Tasks here are small and convention-bound;
  a cold agent re-derives context you already have and tends to miss the conventions index.
- **Verify with real output** — `bun run lint`, `bun run test`, `bun run build` for whatever
  your change touched. Never report success from inspection alone.
- **Preview pane caveat:** local files render as static snapshots and will not fetch
  `docs/conventions/assets/doc.css`. That is the pane, not the file.
