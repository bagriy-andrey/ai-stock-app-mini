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
- Background jobs: Redis with BullMQ, or a Python worker stack such as Celery/RQ
- Charts: TradingView Lightweight Charts or similar
- LLM gateway: OpenRouter
- Notifications: Telegram Bot first

## Open Architecture Choices

The exact frontend/backend split, scheduler technology, market data providers, and initial OpenRouter models are intentionally unresolved. Track final decisions in [decisions.md](../decisions.md).

