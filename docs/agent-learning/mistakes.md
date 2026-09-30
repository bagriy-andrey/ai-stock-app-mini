# Agent Mistakes

This file is for recurring agent mistakes that should change future behavior. Record only lessons that have appeared more than once or are likely enough to repeat that documenting them prevents real rework.

Do not use this as a diary, blame log, or list of one-off defects. Keep entries concise, actionable, and tied to repository patterns. When a mistake repeats 2-3 times, promote the lesson into `docs/agent-learning/rules.md` or `AGENTS.md`, then remove the raw mistake entries unless their detail is still needed.

## Entry Format

```md
## Short Mistake Pattern

- Symptom: what went wrong repeatedly.
- Lesson: what future agents should do instead.
- Guardrail: where to check before editing or reviewing.
- Files: `path/to/file.ts`, `path/to/other-file.ts`.
```

## Candidate Patterns

Use this file for repeated issues such as:

- Forgetting to use an existing repository abstraction.
- Duplicating an API client instead of extending the existing provider layer.
- Changing a public interface without a migration or compatibility path.
- Writing tests against implementation details instead of behavior.
