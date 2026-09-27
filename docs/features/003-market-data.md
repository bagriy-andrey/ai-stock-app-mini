# 003 - Market Data

## Goal

Provide current and historical market data needed for portfolio valuation, analysis, forecasting, and evaluation.

## User Value

The user sees current portfolio value and the AI system has reliable inputs for analysis.

## Scope

- Basic prices for stocks, ETFs, and crypto
- Historical prices for prediction evaluation
- Asset metadata
- Provider abstraction where practical
- Data freshness tracking

## Non-Goals

- Hundreds of providers
- High-frequency market data
- Full institutional-grade data warehouse

## Inputs

- External market data providers
- Asset universe definitions
- Manual asset metadata if needed

## Outputs

- Current prices
- Historical price series
- Data freshness status
- Provider metadata

## Core Data / Entities

- Asset
- MarketPrice
- PriceHistory
- DataProvider
- DataFreshnessStatus

## Main Flows

- System fetches current prices
- System stores price snapshots
- System retrieves historical prices for evaluation
- System marks stale or missing data

## Edge Cases

- Market closed
- Provider outage
- Delayed prices
- Symbol changes
- Crypto trades 24/7 while equities do not

## Dependencies

- Chosen market data providers
- Scheduler
- Database

## Acceptance Criteria

- Portfolio valuation can use current prices
- Forecast evaluation can retrieve point-in-time prices
- Data freshness is visible to downstream services

## Open Questions

- Which initial providers should be used?
- How much historical data is needed for MVP?

## Future Extensions

- Fundamentals
- News
- Sentiment
- Crypto derivatives
- On-chain metrics

