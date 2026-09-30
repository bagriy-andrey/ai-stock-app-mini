# AI Investment Assistant - Agent Context

## Project

This repository is for a personal AI Investment Assistant: a small web application for long-term portfolio monitoring, watchlist analysis, opportunity discovery, structured forecasts, reports, paper trading, and measured learning from past predictions.

## Product Principles

- Long-term diversified investing is the primary strategy.
- Tactical/speculative opportunities are secondary and should be clearly separated from long-term investment decisions.
- The real portfolio is advisory-only. The application may analyze, warn, and recommend, but must not execute real trades.
- AI Paper Trader is isolated from the real portfolio and may only trade virtual/mock assets.
- Optimize for measurable predictions, reproducibility, structured outputs, transparent uncertainty, cost awareness, and historical evaluation.

## Architecture Principles

- Use or adapt TauricResearch/TradingAgents as a reference or underlying multi-agent analysis framework.
- The application should own portfolio, watchlist, discovery universe, scheduling, prediction storage, outcome evaluation, alerts, paper trading, learning metrics, and model cost tracking.
- Use OpenRouter through a model-routing abstraction. Agents should request logical model tiers such as `cheap`, `standard`, and `strong`.
- Persist structured predictions and later evaluate them against actual outcomes.
- Preserve point-in-time correctness for forecasting, evaluation, and any backtesting.
- Keep the architecture modular, but avoid over-engineering early MVP phases.

## Development Workflow

Use staged work:

1. Spec
2. Implementation plan
3. Implement
4. Review

Before implementing a feature, read the relevant files under `/docs`, especially the feature spec, architecture docs, roadmap, and decisions log. Update documentation when architectural decisions change. Update this file only when a durable project-wide instruction changes.

## Development Insight Agent

After every development chat that changes code, architecture, UI behavior, test strategy, or repo conventions, update the agent learning memory. Do not let memory only grow: compress repeated insights into durable rules and remove or archive the older raw entries.

Use this lifecycle:

1. Record a new, reusable observation as a short candidate in `docs/development-insights.md`.
2. Record recurring mistake patterns in `docs/agent-learning/mistakes.md`.
3. When a lesson repeats 2-3 times, promote it into `docs/agent-learning/rules.md` or into this file if it is a project-wide instruction.
4. After promotion, delete the older raw insight entries from `docs/development-insights.md`, or move them to an archive only if the original detail is still valuable.

Record only insights that will make future work faster, such as:

- which component, helper, route, repository, or Prisma model was used for a workflow
- established UI behavior for similar screens, tables, cards, dialogs, and settings pages
- backend patterns for server actions, repositories, model routing, persistence, validation, and migrations
- testing or build findings that prevent repeated mistakes
- integration caveats, sandbox/runtime constraints, and local development gotchas
- relationships between features, docs, and architecture decisions

Do not add generic diary entries. Prefer stable, actionable notes with file references. If the chat produced no reusable learning, add nothing.

For repeated agent mistakes, use `docs/agent-learning/mistakes.md` instead of `docs/development-insights.md`. Record only recurring patterns that should change future behavior, such as forgetting an existing repository abstraction, duplicating an API client, changing a public interface without migration, or testing implementation details.

## UI Tooltip Rule

Use `components/ui/tooltip.tsx` for every new tooltip. Do not use native browser `title` attributes for user-facing tooltips. Native `title` may be used only where the text is not a tooltip interaction, such as document metadata or third-party-required attributes.
