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
- Initial integration with a small personal-use provider stack
- Point-in-time data capture for forecasts and later evaluation

## Non-Goals

- Hundreds of providers
- High-frequency market data
- Full institutional-grade data warehouse
- Expensive advanced on-chain or social-sentiment providers before measured value is proven
- Broad market-scale ingestion unrelated to the user's portfolio, watchlist, or configured discovery universe

## Inputs

- External market data providers
- Asset universe definitions
- Manual asset metadata if needed

## Initial Provider Strategy

Use provider interfaces so providers can be replaced, but keep the initial implementation narrow:

- Frankfurter for no-key dashboard FX rates and MVP fiat conversion.
- FMP as the initial primary provider for US stock/ETF prices, fundamentals, calendars, estimates, and financial news if the selected plan covers the required endpoints.
- CoinGecko for crypto spot prices and history.
- FRED/ALFRED for macroeconomic data and point-in-time macro vintages.
- SEC EDGAR for primary company filings.
- GDELT for global and geopolitical event intelligence.
- Marketaux as an optional financial-news provider, starting free and upgrading only if needed.

Fallback candidates:

- Tiingo if a clean personal-use price feed is preferable or FMP data quality is insufficient.
- EODHD if broader global stock/ETF coverage is needed earlier.

Deferred providers:

- CoinGlass should be the first paid tactical crypto upgrade for funding, open interest, liquidations, and long/short positioning.
- Glassnode, CryptoQuant, and Santiment should wait until prediction evaluation shows that advanced on-chain or social data improves outcomes enough to justify cost.

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
- Phase 1D allows user-entered manual latest-price snapshots for owned and watched assets before durable provider ingestion is implemented

## Scanner Ingestion Follow-Up

Provider-backed scanner ingestion is specified in [003F - Provider-Backed Scanner Ingestion Plan](../plans/003f-provider-backed-scanner-ingestion-plan.md).

The first practical scanner improvement should refresh scoped provider prices before scanner runs:

- FMP for stock/ETF latest quotes where `FMP_API_KEY` is configured.
- CoinGecko for crypto spot prices.
- FMP news initially, with Marketaux as the optional upgrade path when better entity-linked financial news is needed.

This follow-up should remain scoped to portfolio, watchlist, and active discovery universe assets.

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
- Provider usage and cost assumptions are documented per integration
- Ingestion is scoped to the user's portfolio, watchlist, and configured discovery universe unless a broader scan is explicitly configured

## Open Questions

- Which exact FMP plan covers the MVP endpoints for prices, fundamentals, calendars, estimates, and news?
- How much historical stock/ETF and crypto data should be backfilled during MVP setup?
- When should Marketaux be upgraded from free to paid?

## Future Extensions

- Fundamentals
- News
- Sentiment
- Crypto derivatives
- On-chain metrics
