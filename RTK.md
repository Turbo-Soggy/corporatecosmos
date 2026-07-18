# Runtime Toolkit

## graphify First
- Treat `graphify-out/graph.json` as the project map for Codex and Claude.
- Start codebase questions with `graphify query "<question>"`.
- Use `graphify explain "<node-or-concept>"` when one concept needs focused context.
- Use `graphify path "<source>" "<target>"` when the task is about relationships or data flow.
- Fall back to `rg` and direct file reads only after graphify scopes the area to inspect.

## Keeping The Map Current
- Run `graphify update .` after changing source files, agent instructions, or project docs.
- The update path is AST-only for code and does not require API tokens.
- If `graphify-out/graph.json` is missing or stale beyond recovery, rebuild from the repo root with `graphify .`.

## Local Checks
- Verify graphify is available with `graphify --help`.
- Verify this repository is queryable with:

```powershell
graphify query "How is this project structured?"
```
