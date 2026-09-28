# Data Model

This is a conceptual data model. Exact schema design belongs in implementation plans and migrations. Do not claim a concept is implemented unless it exists in `prisma/schema.prisma` and supporting code.

## Current Implemented Schema

Implemented today:

- `AiUsageRecord`
- `Asset`
- `Portfolio`
- `PortfolioExchange`
- `Position`
- `PositionPlatformHolding`
- `CashBalance`
- `PortfolioActivityLog`
- `WatchlistItem`
- `MarketPrice`

Not implemented yet:

- analysis runs and analysis reports
- scanners and scanner signals
- market events and event entities
- immutable input snapshots
- predictions, prediction scenarios, outcomes, and evaluations
- paper portfolios, positions, orders, trades, and NAV
- market observations, learned patterns, lessons, learning runs, reports, and alerts

## Portfolio

Real portfolio records should support:

- asset
- ticker/symbol
- asset type
- quantity
- average purchase price
- current value
- currency
- portfolio weight
- realized/unrealized P&L
- optional notes
- investment intent: long-term or tactical

Portfolio-level data should include:

- user-defined exchanges/platforms with a name and supported operation type
- cash balance
- base currency
- sector exposure
- geographic exposure
- currency exposure

Position storage keeps one aggregated position per portfolio asset for allocation and P&L, plus platform-level holding rows for the exchange/brokerage breakdown of that aggregated position. Portfolio operations choose only from user-defined exchanges/platforms, grouped as crypto or stock exchanges for MVP.

## Watchlist

Watchlist records should support stocks, ETFs, and crypto assets. The watchlist is distinct from owned positions.

## Discovery Universe

The discovery universe may include S&P 500, Nasdaq 100, selected European indexes, ETF catalogs, crypto assets, and sector-specific universes.

## Asset Lifecycle

Assets may move through states such as:

- `DISCOVERED`
- `WATCHING`
- `INTERESTING`
- `ENTRY_OPPORTUNITY`
- `OWNED`
- `AVOID`

## Versioning

Persist versions for reproducibility:

- strategy version
- agent prompt version
- model version
- forecast version
- data provider version

## Market Data Provenance

Market data and external signals should preserve provenance:

- provider
- provider endpoint or dataset
- provider symbol/id
- observed timestamp
- ingestion timestamp
- source publication timestamp when applicable
- data freshness status
- raw payload reference or normalized snapshot hash when useful

This is required for point-in-time correctness, reproducible forecast evaluation, and later provider quality comparisons.

## Reports and Translations

Reports should store:

- original language
- original report content
- generated timestamp
- model and prompt version
- source analysis/report run

Report translations should be generated on demand through OpenRouter and cached with:

- target language
- translated content
- translation model
- translation timestamp
- source report version

The original report remains the canonical record.

## Input Snapshots

Every important analysis, forecast, evaluation, and backtest should reference an immutable input snapshot.

Potential snapshot contents:

- prices and price freshness
- fundamentals
- news and structured events
- macro data and vintages
- sentiment
- technical signals
- relevant crypto derivatives/on-chain metrics
- portfolio and watchlist context
- relevant learned patterns available at the timestamp
- provider provenance and missing-data warnings

Snapshots should make it possible to reconstruct what the system knew at the decision timestamp.

## Scanners and Events

Scanner records should preserve:

- scanner run id
- scanner type, such as portfolio, watchlist, market, opportunity, crypto, or news/event
- started and completed timestamps
- configuration version
- universe or input scope
- candidate assets and scores
- material-change reasons
- provider/source provenance

Market events should preserve:

- event type
- timestamp
- source
- affected entities
- affected asset classes
- industries/sectors
- countries
- direction where meaningful
- severity
- confidence
- original source reference

Event taxonomy should be extensible and include categories such as earnings, guidance, analyst actions, insider transactions, management changes, acquisitions, product events, regulatory risks, lawsuits, buybacks, dilution, dividends, ETF flows, crypto whale activity, exchange hacks, tariffs, sanctions, geopolitical changes, rate changes, and macro surprises.

## Market Observations and Learned Patterns

A `MarketObservation` or `HistoricalCase` should combine market context with future outcomes.

Example fields:

- asset and asset type
- event id
- timestamp
- price at event
- company or asset context
- sector state
- market regime
- macro context
- geopolitical context
- sentiment
- technical indicators
- crypto derivatives/on-chain context where relevant
- outcomes at available horizons such as 1h, 1d, 3d, 7d, 30d, 90d, and 1y

Outcomes may be filled incrementally as horizons mature.

Learned patterns aggregate observations. They should store observation count, first seen, last seen, long-term success rate, recent success rate, market regime, confidence, statistical significance where practical, data version, pattern version, and whether the system found no meaningful relationship.

Patterns are evidence records, not eternal rules. Recent evidence may eventually receive more weight than stale evidence, but changes must remain traceable.

## Predictions and Evaluations

Every prediction should be persisted with enough structure to evaluate it later:

- prediction id
- asset and asset type
- generated timestamp
- horizon
- price at prediction time
- predicted direction
- scenarios and probabilities
- expected return
- expected price where used
- confidence
- provider and model
- prompt/template version
- input snapshot id
- related deep-analysis run
- related market events
- related historical patterns

Predictions are immutable. Outcomes and evaluations should be separate records that reference the original prediction.

Evaluation domains should remain separate:

- forecast quality
- analysis quality
- paper portfolio decision quality

## Paper Trader

Paper Trader records should include:

- paper portfolios
- virtual cash
- paper positions
- orders
- fills/trades
- NAV
- realized and unrealized P&L
- drawdown
- benchmark comparison
- strategy, agent, model, and configuration identifiers

These records must not share state with the real `Portfolio`, `Position`, or `CashBalance` tables.
