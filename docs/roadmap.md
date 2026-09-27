# Roadmap

## Phase 0 - Foundation

Objective: create the base project and architecture.

Scope: repository structure, frontend skeleton, backend skeleton, database, environment configuration, OpenRouter integration, model router abstraction, scheduler foundation, logging, i18n foundation, and basic application configuration.

Dependencies: documentation bootstrap and architecture decisions for initial stack.

Completion criteria: project can run locally with baseline app/API structure, configuration, logging, and test foundation.

## Phase 1 - Portfolio & Watchlist

Objective: build non-AI portfolio and watchlist workflows.

Scope: manually add/edit/remove positions, cash balance, watchlist CRUD, stock/ETF/crypto asset types, basic market prices, portfolio value, P&L, allocation, and provider abstraction for the initial market-data stack.

Dependencies: foundation and database.

Completion criteria: user can maintain portfolio and watchlist without AI.

## Phase 2 - AI Market Intelligence

Objective: integrate manually triggered AI analysis.

Scope: TradingAgents or adapted architecture, initial analyst roles, research debate, risk analysis, portfolio manager, manual asset analysis.

Dependencies: model router, OpenRouter, basic market data.

Completion criteria: user can manually analyze assets such as BTC, NVDA, and SPY.

## Phase 3 - Automated Monitoring

Objective: add scheduled monitoring and alerts.

Scope: scheduler, owned/watchlist analysis, persisted reports, changed-outlook detection, portfolio alerts, morning/evening reports, daily/weekly/monthly/quarterly/yearly reports, Telegram notifications, and on-demand report translation.

Dependencies: AI analysis and scheduler foundation.

Completion criteria: system produces automated monitoring outputs on configurable cadence.

## Phase 4 - Opportunity Scanner

Objective: scan assets outside the portfolio.

Scope: discovery universe, opportunity score, long-term and tactical opportunity detection, add-to-watchlist flow.

Dependencies: market data, AI analysis, watchlist.

Completion criteria: system surfaces new opportunities with reasons, risks, confidence, and suggested action.

## Phase 5 - Forecast Engine

Objective: create normalized structured predictions.

Scope: tactical and long-term horizons, scenarios, probabilities, confidence, structured storage, forecast versioning.

Dependencies: AI analysis and prediction persistence.

Completion criteria: forecasts are stored in a form that can be evaluated later.

## Phase 6 - Outcome Evaluation

Objective: evaluate completed predictions.

Scope: forecast resolution, actual-vs-forecast comparison, accuracy, error, benchmark return, alpha, confidence calibration, analytics screens.

Dependencies: forecast engine and market data.

Completion criteria: user can inspect prediction quality over time.

## Phase 7 - AI Paper Trader

Objective: add isolated autonomous mock trading.

Scope: virtual portfolio, virtual cash, mock decisions, transaction ledger, position sizing, risk constraints, performance metrics, benchmark comparison, and comparison across multiple agents, models, and strategy configurations.

Dependencies: forecasts, risk data, market data.

Completion criteria: paper strategies can trade virtual assets without touching the real portfolio.

## Phase 8 - Adaptive Learning

Objective: calibrate decision process from outcomes.

Scope: agent performance, performance by horizon/asset/regime, dynamic weights, confidence calibration, reflection memory, mathematical performance layer.

Dependencies: outcome evaluation and sufficient historical data.

Completion criteria: system can adjust weighting recommendations based on measured historical performance.

## Phase 9 - Model Optimization

Objective: optimize model quality and cost.

Scope: OpenRouter experiments, quality-vs-cost comparison, automatic model-tier recommendations, cost budgets, fallback routing, model performance tracking.

Dependencies: model routing, AI cost tracking, prediction quality metrics.

Completion criteria: system can compare models by cost, latency, and investment-analysis quality.
