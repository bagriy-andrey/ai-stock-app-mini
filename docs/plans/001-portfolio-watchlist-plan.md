# 001 - Phase 1 Portfolio & Watchlist Plan

## Objective

Build the first usable non-AI product workflow: manual real-portfolio tracking and watchlist management.

Phase 1 should let the user maintain owned positions, cash balances, and assets of interest, then calculate basic portfolio value, allocation, and P&L from current prices.

## Phase 1 Scope

- Portfolio CRUD
- Position CRUD
- Cash balance management
- Watchlist CRUD
- Shared asset catalog for stocks, ETFs, and crypto
- Investment intent tracking
- Minimal market-price abstraction
- Portfolio value, weights, and unrealized P&L calculations
- Basic operational UI for portfolio and watchlist workflows
- API/server-action layer for the above workflows
- Focused tests for domain calculations and data-access behavior

## Non-Goals

- AI analysis
- TradingAgents integration
- Automated monitoring
- Opportunity discovery outside user-entered assets
- Structured forecasts
- Outcome evaluation
- Paper trading
- Real brokerage integration
- Real order execution
- Tax lots and advanced performance attribution
- Broad market ingestion

## Product Boundaries

The real portfolio remains advisory-only. Phase 1 must not introduce any workflow that can execute real trades or imply brokerage connectivity.

The watchlist remains distinct from owned positions. An owned asset may also appear in watchlist-style monitoring views later, but Phase 1 should not merge the concepts in storage.

Market-data ingestion should be scoped to assets the user owns or watches. Do not build broad universe ingestion in this phase.

## Recommended MVP Architecture

Continue using the Phase 0 monolithic Next.js application:

- React UI in the App Router
- Next.js route handlers or server actions for application writes
- Prisma as the data-access layer
- PostgreSQL as the system of record
- A small domain layer for portfolio calculations
- A provider interface for current prices

Do not introduce a separate backend service yet. Do not introduce BullMQ, Redis, Python/FastAPI, or TradingAgents in Phase 1.

## Data Model

### Asset

Represents a normalized investable or watchable instrument.

Recommended fields:

- `id`
- `symbol`
- `name`
- `assetType`: `STOCK`, `ETF`, `CRYPTO`
- `currency`
- `exchange`
- `provider`
- `providerSymbol`
- `sector`
- `region`
- `createdAt`
- `updatedAt`

Constraints:

- Use a unique key that prevents duplicate assets for the same provider namespace.
- Keep fields optional where provider metadata may be missing.

### Portfolio

Represents the user's real advisory-only portfolio.

Recommended fields:

- `id`
- `name`
- `baseCurrency`
- `createdAt`
- `updatedAt`

MVP assumption:

- Support one default real portfolio first, while keeping the schema able to support more later.

### Position

Represents an owned real-portfolio holding.

Recommended fields:

- `id`
- `portfolioId`
- `assetId`
- `quantity`
- `averageCost`
- `costCurrency`
- `investmentIntent`: `LONG_TERM`, `TACTICAL`
- `notes`
- `openedAt`
- `createdAt`
- `updatedAt`

MVP assumption:

- Store average cost only. Do not model tax lots in Phase 1.
- Treat repeat adds for the same portfolio asset as additional buys: increase quantity and recalculate weighted average cost.
- Treat edit as a manual correction of the aggregated position values.

Constraints:

- Allow only one active position per portfolio and asset for the MVP.
- Quantity must be non-negative.
- Average cost must be non-negative.

### PositionPlatformHolding

Represents the exchange/platform breakdown under an aggregated real-portfolio position.

Recommended fields:

- `id`
- `positionId`
- `platform`
- `quantity`
- `averageCost`
- `costCurrency`
- `openedAt`
- `notes`
- `createdAt`
- `updatedAt`

MVP assumption:

- Keep one aggregated `Position` per portfolio asset for valuation and allocation.
- Store one platform holding row per position and platform so the user can inspect where the asset is held.
- Repeated adds for the same position and platform increase the platform quantity and recalculate that platform's weighted average cost.
- Manual position edits are correction workflows and may collapse the platform breakdown back into one platform row from the edit form.

### CashBalance

Represents available real-portfolio cash by currency.

Recommended fields:

- `id`
- `portfolioId`
- `currency`
- `amount`
- `createdAt`
- `updatedAt`

MVP assumption:

- Support multiple currencies in storage, but calculate full portfolio value primarily in the portfolio base currency.
- If FX conversion is unavailable, show the cash line but mark base-currency total as partially unavailable.
- Treat repeat adds for the same platform and currency as cash deposits that increase the stored balance. Editing an existing cash row replaces the stored balance.

### WatchlistItem

Represents a user-monitored asset that is not necessarily owned.

Recommended fields:

- `id`
- `assetId`
- `investmentIntent`: `LONG_TERM`, `TACTICAL`
- `notes`
- `targetEntryPrice`
- `priority`: `LOW`, `MEDIUM`, `HIGH`
- `createdAt`
- `updatedAt`

Constraints:

- One watchlist item per asset in Phase 1.

### MarketPrice

Represents the latest normalized price snapshot.

Recommended fields:

- `id`
- `assetId`
- `price`
- `currency`
- `provider`
- `providerSymbol`
- `observedAt`
- `ingestedAt`
- `createdAt`

MVP assumption:

- Keep latest price snapshots in the database.
- Historical price series and point-in-time evaluation support belong to later market-data work unless they are trivial to preserve while storing snapshots.

## Domain Calculations

Phase 1 should include pure functions for:

- Position market value
- Position cost basis
- Unrealized P&L amount
- Unrealized P&L percentage
- Portfolio total value
- Position weight
- Cash weight

Calculation rules:

- If a required price is missing, show the affected position as unpriced.
- Do not hide unpriced positions from holdings.
- Portfolio total should distinguish complete totals from partial totals.
- Do not use AI-generated estimates as prices.

## Market Data Plan

Start with a provider interface rather than a full real-provider integration.

Recommended interfaces:

- `MarketDataProvider`
- `getCurrentPrice(asset)`
- `searchAssets(query)` if needed for add flows

Phase 1 implementation options, in order:

1. Manual price entry or seeded/mock provider for reliable local development.
2. Narrow CoinGecko current-price integration for crypto if API access is simple.
3. Narrow FMP current-price integration for stocks/ETFs after the exact plan and endpoint coverage are confirmed.

Do not block portfolio/watchlist CRUD on real market-data provider selection.

## Application Workflows

### Portfolio

The user should be able to:

- Open the portfolio view.
- Add a stock, ETF, or crypto position.
- Edit quantity, average cost, intent, and notes.
- Remove a position.
- Add or update cash by currency.
- See holdings with symbol, name, type, quantity, average cost, latest price, value, weight, and unrealized P&L.
- See whether portfolio totals are complete or missing some prices.

### Watchlist

The user should be able to:

- Open the watchlist view.
- Add an asset to the watchlist.
- Edit intent, notes, target entry price, and priority.
- Remove a watchlist item.
- See watched assets with latest price when available.

### Asset Entry

Phase 1 should keep asset entry simple:

- Allow manual asset creation if provider search is not implemented.
- Validate asset type and symbol.
- Prevent accidental duplicate assets where possible.

## UI Plan

Use a quiet operational layout, not a marketing page.

Recommended screens:

- `/portfolio`
- `/watchlist`
- Optional `/assets` only if manual asset management needs a separate view.

Recommended components:

- Holdings table
- Position form
- Cash balance form
- Portfolio summary strip
- Watchlist table
- Watchlist item form
- Price freshness indicator
- Empty states for first use

The first useful Phase 1 UI should favor dense, scannable data over decorative cards.

## API / Server Layer

Use route handlers or server actions consistently with the surrounding code. Keep the boundary simple.

Required operations:

- Create/update/delete asset
- Create/update/delete position
- Create/update/delete cash balance
- Create/update/delete watchlist item
- Read portfolio summary
- Read watchlist summary
- Upsert latest price if manual/mock prices are supported

Validation:

- Use Zod schemas for request/input validation.
- Validate numeric inputs before Prisma writes.
- Keep decimal handling explicit.

## Test Strategy

Add focused tests for:

- Portfolio valuation calculations
- P&L calculations
- Weight calculations
- Missing-price behavior
- Duplicate watchlist prevention if implemented in application logic
- Input validation for position and cash writes

Keep database integration tests optional unless the setup remains lightweight.

## Documentation Updates

During implementation, update:

- `README.md` current status when Phase 1 work starts.
- `docs/architecture/data-model.md` if the implemented schema materially differs from the conceptual model.
- `docs/decisions.md` when resolving durable decisions such as average-cost-only positions, multi-currency cash handling, or initial price provider choice.

Do not update `AGENTS.md` unless a durable project-wide instruction changes.

## Questions Resolved During Implementation

- Phase 1 ships with manual latest-price snapshots first.
- Real provider price ingestion is deferred until after portfolio/watchlist CRUD; provider search is used only as an asset metadata helper.
- The MVP enforces one active position per portfolio and asset.
- Cash balances and position quantities are non-negative.
- The default portfolio uses USD initially, with USD, EUR, and PLN supported in the Phase 1 UI.

## Recommended Phase 1 Milestones

### Phase 1A - Schema and Domain Core

- Add Prisma models and enums.
- Create migration.
- Add domain calculation utilities.
- Add tests for calculations.

### Phase 1B - Portfolio CRUD

- Implement portfolio, position, cash, and asset write flows.
- Implement portfolio summary read flow.
- Build `/portfolio`.

### Phase 1C - Watchlist CRUD

- Implement watchlist write flows.
- Implement watchlist summary read flow.
- Build `/watchlist`.

### Phase 1D - Minimal Prices

- Add manual/mock latest-price support.
- Wire prices into portfolio and watchlist summaries.
- Show missing/stale price states.

### Phase 1E - Review and Stabilization

- Run lint, typecheck, tests, and build.
- Review acceptance criteria.
- Update documentation for decisions made during implementation.

Phase 1E status: complete. `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass after documentation cleanup.

## Completion Criteria

Phase 1 is complete when:

- The user can manually maintain a real advisory-only portfolio.
- The user can manage cash balances.
- The user can manually maintain a watchlist distinct from the portfolio.
- Stocks, ETFs, and crypto are supported as asset types.
- Portfolio value, weights, and unrealized P&L are calculated when prices are available.
- Missing prices are visible and do not corrupt totals.
- No autonomous AI action can modify the real portfolio.
- The codebase remains typed, linted, tested, and documented enough to begin Phase 2 planning.
