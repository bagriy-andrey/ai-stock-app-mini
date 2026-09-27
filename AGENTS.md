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
