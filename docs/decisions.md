# Architecture Decision Log

## Confirmed Decisions

### Long-term investing is primary

The product should optimize first for long-term diversified investing and portfolio monitoring.

### Tactical trading is secondary

Tactical/speculative opportunities are supported, but they are not the main product identity.

### Real portfolio is advisory-only

The system may analyze, recommend, warn, and suggest rebalancing, but it must not execute real orders.

### Paper Trader is isolated

Autonomous trading is allowed only inside AI Paper Trader with virtual/mock money.

### Use or adapt TradingAgents

The project should evaluate TauricResearch/TradingAgents as a reference or underlying multi-agent framework rather than recreating the entire framework blindly.

### Application owns product workflows

Portfolio, watchlist, discovery universe, scheduling, prediction storage, outcome evaluation, alerts, paper trading, learning metrics, and model cost tracking belong to this application.

### Use OpenRouter abstraction

The system should use OpenRouter through a configurable model-routing abstraction with logical model tiers.

### Store structured predictions

Forecasts must be persisted as structured data so outcomes can be evaluated later.

### Measure outcomes

Prediction quality, confidence calibration, benchmark return, alpha, and paper trading performance should be measured.

### Preserve point-in-time integrity

Backtesting and forecast evaluation must not use data unavailable at the simulated timestamp.

## Open Decisions

### Frontend/backend split

Unresolved: use Next.js API routes for MVP or introduce a separate backend such as NestJS.

### AI service boundary

Unresolved: exact boundary between application API and Python FastAPI AI service.

### Scheduler technology

Unresolved: Node-side BullMQ vs Python worker stack such as Celery/RQ.

### Market data providers

Unresolved: exact providers for stocks, ETFs, crypto prices, fundamentals, news, sentiment, derivatives, and on-chain metrics.

### Database extensions

Unresolved: plain PostgreSQL initially vs TimescaleDB for time-series workloads.

### Initial OpenRouter models

Unresolved: exact model choices for `cheap`, `standard`, and `strong` tiers.

### Deployment assumptions

Unresolved: hosting target, environment strategy, secrets management, and background worker deployment model.

## Phase 0 Decisions

### Use manually installed local PostgreSQL

Phase 0 assumes PostgreSQL is installed and managed manually on the developer machine. Docker Compose is not part of the initial foundation.

### Include Vitest in Phase 0

The foundation should include a unit test runner immediately so core infrastructure modules such as model routing can be tested from the start.

### Create AiUsageRecord in the initial schema

`AiUsageRecord` is part of the first Prisma schema because model routing and AI cost tracking are durable architecture requirements.

### Use Prisma 6 for the initial ORM toolchain

The initial foundation uses `prisma` and `@prisma/client` 6.x. The newer Prisma platform-oriented CLI pulled by `latest` did not support the expected `prisma generate` workflow used by this project.

### Use webpack for Next.js dev/build initially

Next.js 16 defaults to Turbopack, but Turbopack failed in the local environment while processing CSS. The Phase 0 `dev` and `build` scripts use webpack for stable local development and verification.
