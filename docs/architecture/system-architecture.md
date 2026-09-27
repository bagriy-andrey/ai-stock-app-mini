# System Architecture

## High-Level Components

```text
Web App
  Dashboard / Portfolio / Watchlist / Opportunities / Predictions / Reports / Paper Trader / AI Usage

Application API
  Portfolio Service / Prediction Service / Alert Service / Paper Trading Service / Opportunity Service

AI Analysis Service
  TradingAgents / LangGraph
  Analysts / Research Debate / Risk Debate / Portfolio Manager

Forecast Engine
  Structured horizons, scenarios, probabilities, confidence

Persistence
  Portfolio, watchlist, market data, predictions, outcomes, reports, costs, paper trades

Scheduler / Workers
  Market monitoring, analysis cadence, reports, alerts, outcome resolution

Learning Engine
  Performance metrics, calibration, agent weights, model comparisons
```

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
