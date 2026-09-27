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

