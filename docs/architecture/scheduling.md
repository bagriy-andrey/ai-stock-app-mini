# Scheduling

## Purpose

The scheduler coordinates ingestion, lightweight scans, event detection, deep analysis triggers, forecast outcome settlement, reports, alerts, Paper Trader evaluation, and learning cycles.

Scheduling must be configurable and cost-aware. It should not send every asset through expensive multi-agent analysis on a fixed high-frequency loop.

## Default Funnel

```text
deterministic calculations
  -> lightweight scanner
  -> cheap AI classification if needed
  -> candidate ranking
  -> expensive TradingAgents / Deep Analysis only for selected assets
```

## Initial Cadence Concept

All values are design defaults, not hardcoded business truths.

- Hourly where appropriate: lightweight portfolio, watchlist, market, opportunity, crypto, and news/event scans.
- Triggered by material event: Deep Analysis and Forecast Engine refresh for selected assets.
- Daily: portfolio summary, matured outcome settlement, daily user report.
- Weekly: learning cycle, deeper portfolio review, Paper Trader evaluation, weekly report.
- Monthly: monthly learning, model/signal evaluation, monthly report.
- Quarterly: market regime and strategy evaluation.
- Yearly: long-term knowledge review.

## Data Refresh Guidance

Data refresh frequency depends on provider cost, asset class, and whether the asset is owned, watched, or only part of a discovery universe.

- Portfolio and watchlist latest prices may refresh more often than broad discovery data.
- Crypto can support shorter price intervals than equities, but short intervals should still feed scanners first.
- Fundamentals and macro data should follow their natural release cadence and preserve vintages where possible.
- News/event ingestion should prioritize structured event extraction and deduplication over noisy repeated alerts.
- Advanced paid crypto derivatives/on-chain/social data should wait until evaluation shows it improves forecast quality enough to justify cost.

## Deep Analysis Triggers

Deep analysis may be triggered by:

- material price, volume, volatility, or momentum changes
- important market events
- matured scanner signals crossing configured thresholds
- user request
- portfolio concentration or risk changes
- forecast refresh requirements for selected assets

Deep analysis should store an immutable input snapshot and cost metadata for every important model call.

## Outcome and Learning Jobs

Outcome jobs should resolve forecasts only after the horizon has matured and only with data available at the evaluation timestamp.

Learning jobs should generate versioned evidence and lessons on weekly, monthly, quarterly, and yearly cycles. Learning jobs may suggest weight or routing changes, but production behavior changes require explicit rules and traceability.

## Cost Control

Avoid unnecessary expensive LLM analysis when underlying data has not materially changed.

## Open Decisions

- Node-side scheduler such as BullMQ vs Python worker solution such as Celery/RQ
- How to detect material changes before triggering costly analysis
- Exact retry, backoff, and dead-letter behavior
