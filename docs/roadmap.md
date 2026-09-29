# Roadmap

This roadmap reflects the verified implementation state as of 2026-09-28 and the reconciled target architecture. Implementation phases do not have to match the conceptual architecture one-to-one, but responsibility boundaries must remain clear.

## Current Status

Completed:

- Phase 0 foundation.
- Phase 1 real portfolio, cash, platform/exchange holdings, watchlist, manual latest-price snapshots, price freshness, MVP FX conversion, and stabilization checks.
- Phase 2 Deep Analysis MVP: manual portfolio/watchlist AI analysis trigger, code-defined TypeScript agent flow, persisted runs/reports/reasoning summaries, immutable run snapshots, model usage linkage, and history/detail UI.

Not yet implemented:

- Scanners and event detection.
- Forecast Engine and immutable predictions.
- Outcome evaluation.
- Paper Trader.
- Market Intelligence Memory, learned patterns, and learning cycles.
- Reports, alerts, Telegram delivery, and report translations.

## Phase 0 - Foundation

Status: complete.

Scope: repository structure, frontend skeleton, API skeleton, Prisma/PostgreSQL setup, environment configuration, OpenRouter client, model-router abstraction, scheduler foundation, logging, tests, and local development workflow.

## Phase 1 - Portfolio and Watchlist

Status: complete.

Scope: real advisory-only portfolio workflows, platform/exchange records, cash balances, manual buy/sell bookkeeping, platform-level holdings, watchlist CRUD, asset catalog, manual latest-price snapshots, portfolio valuation, P&L, allocation, price freshness, and supported-currency FX conversion.

## Phase 2 - Deep Analysis MVP

Status: complete.

Objective: implement manually triggered Deep Analysis for selected portfolio/watchlist assets.

Scope:

- TradingAgents-inspired TypeScript agent orchestration inside the existing Next.js app.
- Analyst roles, bull/bear debate, Research Manager, Risk Analyst, and Portfolio Manager.
- Asset intent routing for `LONG_TERM` and `TACTICAL`.
- Immutable input snapshots for every analysis run.
- Persisted `AgentRun`, `AnalysisReport`, and agent reasoning summaries.
- `AiUsageRecord` linkage to analysis runs with provider, model, tier, prompt/template version, token/cost/latency metadata where available.
- Report history/detail UI.

Non-goals:

- Automated monitoring.
- Structured Forecast Engine records.
- Paper Trader.
- Learning cycles.
- Broad scanners.

Completion criteria: user can manually run portfolio-aware analysis for supported assets and later review exactly what the agents knew at the time.

## Phase 3 - Lightweight Scanners and Event Detection

Objective: build the cheap funnel that decides what deserves deep analysis.

Scope:

- Portfolio Scanner.
- Watchlist Scanner.
- Opportunity/market scanner over a configured discovery universe.
- Crypto Scanner where practical.
- News/Event Scanner.
- Scanner runs and scanner signals.
- Structured event detection and extensible market-event taxonomy.
- Candidate ranking and material-change thresholds.

Completion criteria: system can cheaply surface high-priority candidates without running deep LLM analysis for every asset.

## Phase 4 - TradingAgents Integration Hardening

Objective: harden the Deep Analysis Engine around scanner/event/pattern inputs.

Scope:

- Feed scanner signals and structured events into analysis snapshots.
- Add retrieved historical cases/patterns when available.
- Preserve TradingAgents-inspired roles while keeping application-owned state and orchestration.
- Prepare a clean boundary for a future Python/LangGraph/TradingAgents service if needed.

Completion criteria: Deep Analysis consumes application-normalized snapshots and remains clearly separate from scanning, forecasting, portfolio state, and paper execution.

## Phase 5 - Forecast Engine and Prediction Persistence

Objective: create immutable structured forecasts.

Scope:

- Forecast Engine separate from Deep Analysis.
- Horizons appropriate to asset and strategy, such as 1h, 1d, 3d, 7d, 30d, 90d, and 1y.
- Bear/base/bull scenarios, probabilities, expected return, expected price where useful, confidence, direction probability, and forecast horizon.
- Prediction and scenario persistence.
- Links to input snapshot, analysis run, market events, and historical patterns.

Completion criteria: forecasts are immutable structured records eligible for later evaluation.

## Phase 6 - Outcome Evaluation and Point-in-Time Evaluation

Objective: settle matured forecasts and measure usefulness.

Scope:

- Outcome settlement jobs.
- Actual price and benchmark retrieval.
- Direction correctness, price error, realized return, scenario hit, calibration, alpha, maximum adverse excursion, and maximum favorable excursion where useful.
- Guardrails against future-data leakage in evaluation and backtesting.

Completion criteria: user and system can inspect forecast quality without reducing everything to one accuracy number.

## Phase 7 - Paper Trader

Objective: evaluate whether the full AI decision system creates useful virtual portfolio outcomes.

Scope:

- Separate paper portfolios, virtual cash, positions, orders, fills/trades, NAV, realized/unrealized P&L, drawdown, and benchmark comparison.
- Strategy configuration and risk constraints.
- Virtual execution only.
- Comparison by strategy, model, agent, asset type, and horizon.

Completion criteria: Paper Trader can act autonomously with virtual money and cannot modify real portfolio state.

## Phase 8 - Market Intelligence Memory and Pattern Engine

Objective: accumulate historical market experience.

Scope:

- Market observations / historical cases.
- Event plus context plus future outcome records.
- Learned patterns with observation count, first/last seen, recent and long-term evidence, regime, confidence, significance where practical, data version, and pattern version.
- Ability to record "no meaningful relationship exists."
- Initial Impact Graph relationships as hypotheses for discovery, not guaranteed truths.

Completion criteria: future analysis can retrieve relevant historical cases and pattern evidence known at the decision timestamp.

## Phase 9 - Periodic Learning Cycles

Objective: turn outcomes into durable lessons.

Scope:

- Weekly learning.
- Monthly learning.
- Quarterly learning.
- Yearly learning.
- Separate market learning and agent learning.
- Internal learning reports distinct from user-facing reports.
- Versioned lessons and weight suggestions.

Completion criteria: the system can generate traceable lessons and calibration suggestions without blindly rewriting production behavior.

## Phase 10 - Adaptive Signal and Model Weighting

Objective: use accumulated evidence to improve routing and decision support.

Scope:

- Signal performance metrics.
- Model performance metrics by task, asset type, horizon, and regime.
- Agent performance metrics.
- Quality-vs-cost analysis.
- Suggested model-tier changes and signal weights.

Completion criteria: routing and weighting recommendations are based on measured historical performance, cost, and latency.

## Deferrals

- Real brokerage execution.
- High-frequency trading.
- Continuous expensive LLM analysis for every asset.
- Model fine-tuning and reinforcement learning.
- Autonomous prompt/code rewriting.
- Advanced paid on-chain/social providers before measured value is proven.
- Microservice-heavy architecture before workload requires it.
