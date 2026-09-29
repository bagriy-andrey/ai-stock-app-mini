# Architecture Reconciliation Audit - 2026-09-28

## Scope Reviewed

- `README.md`, `AGENTS.md`, and `ai-investment-assistant-project-plan.md`
- Product docs under `docs/product`
- Architecture docs under `docs/architecture`
- Feature specs under `docs/features`
- Phase plans under `docs/plans`
- Roadmap and decision log
- Prisma schema and migrations
- Current portfolio, watchlist, market-data, scheduler, and model-router implementation
- Existing tests

## Verified Implementation State

Already implemented:

- Next.js, React, TypeScript, Tailwind, Prisma, PostgreSQL foundation.
- OpenRouter client wrapper and simple logical model router with `cheap`, `standard`, and `strong` tiers.
- `AiUsageRecord` persistence shape, but no full usage logging pipeline for real agent calls yet.
- Lightweight interval scheduler abstraction.
- Real portfolio CRUD, platform/exchange records, platform-level holdings, cash balances, activity logs, manual buy/sell bookkeeping, and non-negative MVP constraints.
- Watchlist CRUD for stocks, ETFs, and crypto.
- Asset catalog, provider/provider-symbol uniqueness, provider metadata helper workflows.
- Manual latest-price snapshots through `MarketPrice` with provider provenance.
- Portfolio valuation, cash conversion, price freshness, and supporting tests.

Not implemented yet:

- TradingAgents or adapted multi-agent analysis runtime.
- `AgentRun`, `AnalysisReport`, or agent reasoning persistence.
- Scanners, scanner runs, scanner signals, candidate ranking, or material-change detection.
- Structured market event detection and event taxonomy storage.
- Impact graph or impact relationship storage.
- Forecast Engine, immutable predictions, scenarios, forecast outcomes, or evaluation records.
- Point-in-time input snapshot model beyond the current `MarketPrice` snapshot concept.
- Reports, alerts, Telegram delivery, report translations.
- Paper Trader virtual portfolio, orders, fills, NAV, or strategy evaluation.
- Market observations, historical cases, learned patterns, market learning, or agent learning cycles.
- Model performance, signal performance, or adaptive routing based on measured outcomes.

## What Already Matches the Finalized Architecture

- The real portfolio is advisory-only and does not connect to brokerage execution.
- Paper Trader is consistently described as isolated virtual trading.
- The app, not TradingAgents, owns portfolio, watchlist, persistence, scheduling, forecasts, evaluation, reports, paper trading, learning, and model cost tracking.
- OpenRouter is the primary LLM gateway behind logical model tiers.
- Documentation already emphasizes structured prediction persistence, point-in-time correctness, and outcome evaluation.
- Phase 0 and Phase 1 intentionally avoid overbuilding future tables and services.
- Market-data ingestion is scoped to the portfolio, watchlist, and configured discovery universe rather than broad market ingestion by default.

## Partial Matches

- `MarketPrice` snapshots preserve observed and ingestion timestamps, but there is not yet an immutable `input_snapshot_id` concept for analysis, forecasts, or backtests.
- The model router supports tiers and fallback-ready route resolution, but task profiles, provider/model/prompt metadata capture per important AI output, and quality/cost feedback are only documented.
- AI analysis docs preserve TradingAgents-inspired roles, but the larger funnel from scanners and event detection into deep analysis is not fully represented.
- Learning docs describe calibration and performance metrics, but they do not yet separate market learning from agent learning or define market observations, historical cases, learned patterns, and periodic learning cycles in enough detail.
- Reports docs cover user-facing reporting, but internal learning reports are not clearly separated.
- Paper Trader boundaries are correct, but the spec should more explicitly separate forecast quality, analysis quality, and portfolio decision quality.

## Contradictions and Outdated Assumptions

- `docs/architecture/scheduling.md` suggests frequent portfolio analysis and data refresh cadences such as 5-minute crypto prices, 10-15 minute news, and hourly portfolio analysis without first-class scanner gating. This conflicts with the finalized cost-aware funnel.
- `docs/roadmap.md` places manual AI deep analysis before scanners/events. That can still be a practical next implementation step, but the roadmap needs to distinguish implementation order from conceptual architecture and add event detection, forecast persistence, point-in-time evaluation, market observations, and learning cycles.
- `docs/architecture/application-flow-diagram.md` sends monitoring directly into AI Analysis Service and then Forecast Engine. It should show scanners, event detector, pattern engine, TradingAgents/deep analysis, forecast engine, portfolio advisor/Paper Trader, outcomes, evaluation, and learning.
- `docs/architecture/learning-engine.md` compresses learning into prediction evaluation and adaptive weights. It is missing durable market memory, market observations, learned patterns, agent lessons, periodic learning cycles, and "no meaningful relationship" outcomes.
- `docs/features/007-predictions.md` uses tactical horizons of 1d/7d/30d and long-term horizons of 3m/6m/12m/3y. The finalized vision prefers flexible horizons such as 1h, 1d, 3d, 7d, 30d, 90d, and 1y, enabled only where appropriate.
- Older docs sometimes imply forecasts are produced directly by AI analysis. The reconciled boundary is: TradingAgents explains what is happening and why; Forecast Engine owns structured price forecasts.

## Missing Concepts

- Event Detector and extensible market-event taxonomy.
- Market Intelligence Memory / Pattern Engine.
- `MarketObservation` or `HistoricalCase` records combining event, company context, sector context, regime, macro, sentiment, technicals, and future outcomes.
- Learned patterns with observation count, first/last seen, long-term vs recent evidence, confidence, significance, data version, and pattern version.
- Impact relationships / Impact Graph as hypotheses, not hardcoded truths.
- Explicit Portfolio Advisor boundary separate from Paper Trader.
- Separate evaluation domains: forecast quality, analysis quality, and paper portfolio decision quality.
- Periodic weekly, monthly, quarterly, and yearly learning cycles.
- Internal learning reports distinct from user-facing reports.
- Point-in-time snapshots for every important analysis/forecast and guardrails against future learned-pattern leakage.

## Duplicated or Overlapping Concepts

- `Opportunity Scanner`, `Automated Monitoring`, and `AI Analysis` overlap on "detect material changes" and "surface candidates." Reconciled boundary: scanners are cheap candidate detection; event detector structures news/external facts; TradingAgents performs expensive deep analysis only for selected candidates.
- `Predictions` and `AI Analysis` overlap on directional opinions. Reconciled boundary: analysis reports may mention scenarios informally, but only Forecast Engine creates immutable prediction records eligible for outcome evaluation.
- `Learning Engine` and `Outcome Evaluation` overlap on metrics. Reconciled boundary: outcome evaluation settles individual forecasts; learning aggregates evidence, cases, patterns, and agent/model lessons.
- `Reports and Alerts` and `Learning Engine` overlap on periodic reports. Reconciled boundary: user-facing reports inform the user; internal learning reports produce versioned evidence and lessons for future retrieval.

## Existing Work to Preserve

- Phase 0/1 Next.js monolith and Prisma schema.
- Average-cost real portfolio model with platform holdings and cash by platform/currency.
- Manual `MarketPrice` snapshots with provider provenance.
- `InvestmentIntent` as an early router for long-term vs tactical flows.
- OpenRouter model tier abstraction.
- Phase 2 plan to build an adapted TypeScript TradingAgents-inspired workflow before introducing a separate Python service.
- Provider abstraction strategy and conservative data-provider rollout.

## Concepts That Need Refactoring in Documentation

- Treat TradingAgents as Deep Analysis Engine, not as the full AI architecture.
- Add scanner/event/pattern memory responsibilities before deep analysis in the conceptual flow.
- Split Forecast Engine from TradingAgents and from Paper Trader.
- Split Portfolio Advisor from Paper Trader.
- Split market learning from agent learning.
- Split forecast evaluation, analysis evaluation, and paper decision evaluation.
- Reframe learning as durable structured records, metrics, cases, patterns, and retrieved lessons, not LLM self-modification.

## Features to Defer

- Real trade execution and brokerage connectivity.
- High-frequency trading and continuous LLM analysis for every asset.
- Model fine-tuning, reinforcement learning, and autonomous prompt/code rewriting.
- Advanced statistical pattern discovery before sufficient forecast/event history exists.
- Paid advanced crypto/on-chain/social providers until measured evaluation justifies cost.
- TimescaleDB, pgvector, separate Python/LangGraph service, BullMQ/Redis, or Celery/RQ until actual workload requires them.
- Broad market ingestion outside the user's portfolio, watchlist, and configured discovery universe.

## Suggested Next Implementation Milestone

The actual codebase is ready for Phase 2, but the next milestone should be narrowed:

1. Implement persisted manually triggered Deep Analysis runs for portfolio/watchlist assets using application-owned TypeScript agents inspired by TradingAgents.
2. Store immutable input snapshots for each run.
3. Link `AiUsageRecord` to analysis runs and record model/provider/prompt metadata.
4. Keep structured forecasts out of Phase 2 except as non-evaluable report text.

After that, implement lightweight scanners and event detection before automated broad deep analysis.
