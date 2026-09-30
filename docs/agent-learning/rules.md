# Agent Learning Rules

This file contains compressed, durable rules produced from repeated development insights and recurring agent mistakes. Keep it short enough to read before work.

## Memory Lifecycle

- New useful observation starts as a concise candidate in `docs/development-insights.md`.
- Repeated mistake patterns start in `docs/agent-learning/mistakes.md`.
- When the same lesson appears 2-3 times, promote it into a permanent rule here or into `AGENTS.md` if it is project-wide agent behavior.
- After promotion, remove the older raw insight entries from `docs/development-insights.md` or move them to an archive only when their original detail is still useful.
- Do not let memory only grow. Prefer compressed rules over long historical logs.

## Permanent Rules

### Use Shared UI Tooltip Component

- Rule: Use `components/ui/tooltip.tsx` for user-facing tooltips. Do not add native browser `title` tooltips for interactive UI.
- Origin: Repeated analysis UI fixes around clipped and inconsistent tooltips.
- Files: `components/ui/tooltip.tsx`, `AGENTS.md`.
