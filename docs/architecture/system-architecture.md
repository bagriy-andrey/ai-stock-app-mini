# System Architecture

This document is the high-level source of truth for the target architecture. It is conceptual, not a microservice mandate. The current implementation is still a single Next.js/Prisma application, and future boundaries should be introduced only when workload and complexity justify them.

## High-Level Components

```text
Market Data / Fundamentals / News / Macro / Crypto / Alternative Data
  -> Normalized Data Layer and Point-in-Time Snapshots
  -> Lightweight Scanners
  -> Event Detector
  -> Market Pattern Engine / Market Intelligence Memory
  -> TradingAgents / Deep Analysis Engine
  -> Forecast Engine
  -> Portfolio Advisor and/or Paper Trader
  -> Outcomes
  -> Evaluation Engine
  -> Learning Engine
  -> Updated Market Intelligence Memory
  -> Future analysis
```

## Application Ownership

The application owns:

- real portfolio and watchlist workflows
- discovery universe configuration
- normalized market data and snapshots
- scanner runs and scanner signals
- market events and event taxonomy
- Market Intelligence Memory and learned patterns
- analysis run persistence
- forecast persistence and evaluation
- user reports and internal learning reports
- Paper Trader state and virtual execution
- learning cycles, agent lessons, model/signal performance, and cost tracking

TradingAgents or TradingAgents-inspired code is a Deep Analysis Engine inside this architecture, not the architecture of the whole product.

## Responsibility Boundaries

### Scanners

Scanners are lightweight and cheap. They monitor the real portfolio, watchlist, configured discovery universe, crypto universe, and news/event feeds to answer:

> Has anything important or unusual happened that deserves deeper analysis?

They may use deterministic calculations, technical indicators, simple provider data, or cheap AI classification. They should not run expensive multi-agent workflows continuously for every asset.

### Event Detector

The Event Detector converts news and external information into structured market events instead of storing only free-form article text. Events should include type, timestamp, source, affected entities, asset classes, sectors, countries, direction, severity, confidence, and source references where available.

The taxonomy is extensible and should include examples such as earnings beats/misses, guidance changes, analyst changes, insider transactions, management changes, acquisitions, product launches/delays, regulatory risks, lawsuits, buybacks, dilution, dividends, ETF flows, crypto whale activity, exchange hacks, tariffs, sanctions, geopolitical changes, rate changes, and macro surprises.

### Market Pattern Engine / Market Intelligence Memory

This is the durable market memory layer. It stores historical cases such as:

```text
event + company context + sector context + regime + macro + geopolitical context
  + technicals + sentiment + positioning
  -> future outcomes
```

It aggregates cases into learned patterns with observation counts, first/last seen, recent and long-term evidence, regime context, confidence, data version, and pattern version. It must also be able to conclude that no meaningful historical relationship exists.

Impact relationships, such as oil price changes affecting energy producers, airlines, inflation expectations, and rate expectations, are hypotheses used for candidate discovery. They are not hardcoded truths; observed outcomes decide whether they are useful.

### TradingAgents / Deep Analysis Engine

TradingAgents is used or adapted for deep analysis of selected assets after scanner/event/pattern evidence justifies the cost. It should preserve useful concepts such as specialized analysts, bull/bear debate, quick-thinking vs deep-thinking model tiers, objective research agents, risk analysts, portfolio-aware decision agents, historical decision memory, outcome reflection, and structured ratings.

It must not own scheduling, global scanning, persistent application state, the real portfolio, Paper Trader execution, reporting, or the complete learning system.

### Forecast Engine

The Forecast Engine is separate from TradingAgents. TradingAgents explains what is happening, why it matters, bull/bear cases, risks, and investment stance. The Forecast Engine creates structured probabilistic price forecasts over explicit horizons.

Forecasts should avoid pretending exact prices are known. Prefer bear/base/bull scenarios, probabilities, expected return, expected price where useful, price range, direction probability, confidence, and horizon.

### Portfolio Advisor

Portfolio Advisor works against the user's real advisory-only portfolio. It may recommend hold, do not add, reduce concentration, consider adding, rebalance, monitor risk, or no action. It must never execute real trades.

### Paper Trader

Paper Trader owns a completely separate virtual portfolio. It may execute virtual buys, sells, rebalancing, sizing, and cash allocation. Paper Trader state must never mix with the real portfolio.

### Evaluation and Learning

Evaluation has separate domains:

- forecast quality: whether price/direction forecasts were useful
- analysis quality: whether TradingAgents recommendations and ratings were useful
- paper decision quality: whether virtual sizing/rebalancing decisions were good

Learning stores durable evidence in database records, statistics, historical cases, learned patterns, model performance, signal performance, agent lessons, and retrieved lessons. It does not mean continuous LLM fine-tuning in the MVP.

## Current Implementation Mapping

Implemented now:

- Next.js App Router web application with Prisma/PostgreSQL.
- Real portfolio, cash, exchange/platform, platform holding, activity log, watchlist, asset, and manual latest-price snapshot workflows.
- Portfolio valuation, P&L, allocation, FX conversion for supported MVP currencies, and price freshness.
- OpenRouter client and logical model-router tiers.
- Lightweight scheduler abstraction.

Planned next:

- Persisted manually triggered Deep Analysis runs with input snapshots.
- Link AI usage records to analysis runs.
- Lightweight scanners and structured event detection.

Future:

- Forecast Engine, immutable predictions, outcomes, evaluation, Paper Trader, Market Intelligence Memory, periodic learning cycles, reports, alerts, and adaptive model/signal weighting.

## Suggested Initial Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend/API: Next.js API routes for MVP, or NestJS if a separate backend is preferred
- AI service: Python, FastAPI, TradingAgents, LangGraph
- Database: PostgreSQL
- Time-series option: TimescaleDB
- Embedding/reflection-memory option: pgvector
- Background jobs: Redis with BullMQ, or a Python worker stack such as Celery/RQ
- Charts: TradingView Lightweight Charts or similar
- LLM gateway: OpenRouter
- Notifications: Telegram Bot first
- i18n: Russian and English UI, with AI report translation generated on demand through OpenRouter

## Open Architecture Choices

The exact frontend/backend split, scheduler technology, initial OpenRouter models, background worker deployment model, and exact market-data endpoint coverage are intentionally unresolved. Track final decisions in [decisions.md](../decisions.md).

## Personal Self-Hosted Assumption

The initial architecture targets one personal self-hosted deployment, not a multi-tenant SaaS product. Keep ownership boundaries modular, but avoid tenant abstractions, public data redistribution paths, and broad market ingestion that is not needed for the user's portfolio, watchlist, or configured discovery universe.

## Initial Market Data Stack

Market data should be accessed through provider interfaces. The initial provider stack is:

- FMP for US stock/ETF prices, fundamentals, calendars, estimates, and financial news if the selected plan covers the required endpoints
- CoinGecko for crypto spot prices and history
- FRED/ALFRED for macro and point-in-time macro vintages
- SEC EDGAR for primary company filings
- GDELT for global and geopolitical event intelligence
- Marketaux as an optional financial-news provider

CoinGlass is the first planned paid tactical crypto upgrade. Glassnode, CryptoQuant, and Santiment are deferred until outcome evaluation can justify their cost.

## Point-in-Time Correctness

Every important analysis, forecast, evaluation, and backtest should reference an immutable input snapshot. Snapshot contents may include prices, fundamentals, news, events, macro data, sentiment, portfolio state, relevant learned patterns, provider provenance, and missing-data warnings as known at that timestamp.

The system must prevent future news, revised fundamentals, future macro data, matured outcomes, later reflections, and future learned patterns from leaking into historical forecasts or backtests.
