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

### Market data provider plan details

Partially resolved: the initial provider strategy is FMP, CoinGecko, FRED/ALFRED, SEC EDGAR, GDELT, and optional Marketaux. CoinGlass is the first planned tactical crypto upgrade. Tiingo and EODHD remain fallback candidates.

Unresolved: exact FMP plan, exact endpoint coverage, initial historical backfill depth, Marketaux upgrade threshold, and when advanced providers such as Glassnode, CryptoQuant, or Santiment become worth the cost.

### Database extensions

Resolved for MVP: use plain PostgreSQL initially.

Future option: add TimescaleDB for time-series workloads if market data volume and query patterns justify it. Add pgvector if embeddings or reflection memory need vector search.

### Initial OpenRouter models

Unresolved: exact model choices for `cheap`, `standard`, and `strong` tiers.

### Deployment details

Partially resolved: target deployment is a personal self-hosted single-user application.

Unresolved: exact server shape, environment strategy, secrets management, and background worker deployment model.

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

### Use PostgreSQL as the primary database

PostgreSQL is the primary application database. The project needs relational consistency, joins, historical records, analytics, and reproducible forecast evaluation across portfolio, watchlist, market data, predictions, reports, AI usage, and paper trading records.

Optional future extensions may include TimescaleDB for time-series workloads and pgvector for embeddings or reflection memory. NoSQL databases are not the primary storage choice for the MVP.

### Target single-user self-hosted deployment

The application is intended for personal self-hosted use by one user. The architecture should not optimize early for multi-tenant SaaS concerns, public redistribution, or third-party API access.

Provider abstractions are still required, but ingestion can be optimized around the user's portfolio, watchlist, and configured discovery universe instead of collecting the entire market at high frequency.

### Initial market data provider strategy

Use a provider abstraction, but start with a practical personal-use provider stack:

- FMP as the initial primary provider for US stock/ETF prices, fundamentals, calendars, estimates, and financial news if the selected plan covers the required endpoints.
- CoinGecko for crypto spot prices and history.
- FRED/ALFRED for macroeconomic data and point-in-time macro vintages.
- SEC EDGAR for primary company filings.
- GDELT for global and geopolitical event intelligence.
- Marketaux as an optional financial-news provider, starting with the free tier and upgrading only if needed.

Keep Tiingo and EODHD as fallback candidates if FMP coverage, pricing, licensing, or data quality is insufficient.

Add CoinGlass Hobbyist as the first paid tactical crypto upgrade when crypto derivatives data becomes useful. Defer Glassnode, CryptoQuant, and Santiment until outcome evaluation shows that advanced on-chain or social metrics improve forecast quality enough to justify the cost.

### Store reports in original language and translate on demand

Persist AI reports in their original generated language. Report detail pages should support on-demand translation through OpenRouter using a cost-effective translation-capable model. Translations should be cached so the same report is not translated repeatedly.

### Support Russian and English UI

The application should support Russian and English UI language switching. This is a durable product requirement and should be considered before building large user-facing flows.

### Support multiple model and strategy comparisons

Predictions, AI usage tracking, and Paper Trader workflows should support comparing different OpenRouter models, agents, and strategy configurations over time. The system should preserve enough metadata to evaluate quality, cost, latency, prediction accuracy, and paper-trading performance by model and strategy.

## Phase 1 Decisions

### Use average-cost positions for the portfolio MVP

Phase 1 stores one average cost per active position. Tax lots, broker lots, dividend lots, and advanced performance attribution are deferred until later portfolio work.

### Enforce one active position per portfolio and asset in Phase 1

The MVP schema uses a unique `(portfolioId, assetId)` constraint for positions. Different intents for the same asset can be revisited later if there is a concrete workflow that needs separate lots or sub-positions.

### Store platform breakdowns below aggregated positions

The portfolio keeps one aggregate position per portfolio asset for Phase 1 valuation and allocation, but stores child platform holding rows for the user's exchange/brokerage breakdown. Repeated adds to the same asset and platform update both the aggregate position and the platform holding with weighted average cost. This provides visibility into where assets are held without introducing full tax-lot accounting yet.

### Keep watchlist items unique by asset in Phase 1

The MVP schema allows one watchlist item per asset. Watchlist groups and multiple strategy-specific watch entries are deferred.

### Store multi-currency cash, but do not infer FX conversion

Cash balances are stored by currency from the start. Portfolio totals are complete only when values can be represented in the portfolio base currency. FX conversion belongs in later market-data work.

### Keep MVP portfolio quantities and cash balances non-negative

Phase 1 does not support margin, short positions, negative cash, or liability modeling. Quantity, average cost, cash amount, target entry price, and market price fields use database-level non-negative checks.

### Track free cash by platform and limited MVP currencies

Free cash is stored by platform and currency so balances can be separated across brokerages, exchanges, and bank accounts. Phase 1 UI limits cash currency selection to USD, EUR, and PLN.

### Deduct cash when adding portfolio positions

Adding a real portfolio position requires an exchange/platform. The add-position flow shows the available cash for the selected exchange/platform and currency when a matching balance exists, then deducts `quantity * averageCost` from that cash balance in the same transaction that creates or increases the position. If the user enters a new exchange/platform without a matching cash balance yet, the position can still be added and no cash movement is inferred. Editing an existing position remains a manual correction workflow and does not infer cash movements.

### Store portfolio activity logs for cash movements

Phase 1 tracks cash deposits and withdrawals in `PortfolioActivityLog`. Cash deposits are logged when the add-cash workflow increases a balance. Cash withdrawals are logged in the same transaction that decrements the selected exchange/currency cash balance. Manual cash edits remain correction workflows and do not create movement logs. The user can manually delete activity log entries from the UI to remove noisy or mistaken history rows.

### Store portfolio activity logs for manual asset trades

Manual asset purchases and sales are logged in `PortfolioActivityLog` with `ASSET_BUY` and `ASSET_SELL` entries. Adding or increasing a position deducts matching platform cash when that cash balance exists and records the purchase cost. Selling a position is capped by the selected platform holding quantity, decrements both the platform holding and aggregate position, increases cash on the selected platform in the holding cost currency, and records the sale proceeds. These are manual bookkeeping actions only and do not execute real brokerage trades.

### Store latest price snapshots through MarketPrice

Phase 1A adds normalized market price snapshots with provider provenance. The first UI workflows may use manual or mock prices before real provider integrations are selected.

### Use provider search only as an asset metadata helper in Phase 1

Portfolio entry can search local assets, CoinGecko crypto metadata, and FMP stock/ETF metadata when `FMP_API_KEY` is configured. These searches populate asset fields only; they do not execute trades and they do not replace later market-price ingestion.

### Use Frankfurter for MVP portfolio FX conversion

Portfolio base currency is user-selectable between USD, EUR, and PLN and is persisted on the default portfolio. The MVP uses the no-key Frankfurter latest-rates API to convert supported cash balances and holdings into the selected base currency for portfolio summary calculations. If a holding has no latest market price yet, summary value falls back to average cost while keeping the portfolio status incomplete and P&L unavailable for that holding. If an FX rate cannot be fetched, affected totals are marked incomplete instead of using stale or invented rates.
