# Data Model

This is a conceptual data model. Exact schema design belongs in implementation plans.

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

- cash balance
- base currency
- sector exposure
- geographic exposure
- currency exposure

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

## Predictions

Every prediction should be persisted with enough structure to evaluate it later:

- prediction id
- asset
- asset type
- timestamp
- price at prediction
- time horizon
- signal scores
- predicted direction
- direction probability
- bear/base/bull scenarios and probabilities
- confidence
- recommended action
- reasoning summary
- market conditions
- strategy version
- model version
- actual price and return after resolution
- benchmark return
- alpha
- prediction error
- resolved timestamp

## Paper Trader

Paper Trader records should include:

- starting virtual capital
- virtual cash
- virtual holdings
- average entry price
- P&L
- transaction history
- exposure
- risk constraints
- strategy identity

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
