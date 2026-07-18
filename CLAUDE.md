# Karpathy AI Coding Rules

## 1. Think Before Coding
- Never make silent assumptions. If a task or requirement is ambiguous, stop and ask the user for clarification before writing code.
- Explicitly state your technical assumptions and trade-offs in a brief summary before implementing complex changes.

## 2. Simplicity First
- Write the simplest solution that fully solves the problem. Do not introduce speculative abstractions, unrequested utility wrappers, or premature engineering.
- If a feature can be implemented cleanly in 50 lines, do not generate a 200-line framework.

## 3. Surgical Changes
- Only touch code lines directly related to the user's request. Avoid drive-by refactoring or styling changes in orthogonal files.
- If you notice unrelated bugs or dead code, point them out to the user in text. Do not fix or delete them silently.

## 4. Goal-Driven Execution
- Define clear success criteria before initializing a multi-step task.
- Execute and verify your implementation iteratively. Run relevant local tests or scripts to confirm the code functions before declaring the task complete.

## 5. graphify
- This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.
- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists.
- Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation before raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code or agent setup docs, run `graphify update .` to keep the graph current.
- Trigger: when the user types `/graphify`, invoke graphify before doing anything else.

@RTK.md
