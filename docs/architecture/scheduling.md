# Scheduling

## Purpose

The scheduler monitors assets, triggers analysis when useful, resolves predictions when horizons expire, and produces reports and alerts.

## Initial Cadence Concept

All values must be configurable.

- Crypto prices: 5 minutes
- Stock prices: 5 to 15 minutes
- Technical analysis: 15 minutes
- Crypto derivatives: 15 minutes
- News: 10 to 15 minutes
- Sentiment: 30 minutes
- Macro: 1 hour
- Fundamentals: 1 day
- Portfolio analysis: 1 hour
- Full report: morning and evening
- Critical alerts: event-based

## Cost Control

Avoid unnecessary expensive LLM analysis when underlying data has not materially changed.

## Open Decisions

- Node-side scheduler such as BullMQ vs Python worker solution such as Celery/RQ
- How to detect material changes before triggering costly analysis
- Exact retry, backoff, and dead-letter behavior

