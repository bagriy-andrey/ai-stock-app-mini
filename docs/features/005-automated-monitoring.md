# 005 - Automated Monitoring

## Goal

Automatically monitor owned and watchlist assets on configurable schedules.

## User Value

The user does not need to manually check every asset to notice meaningful changes.

## Scope

- Scheduler foundation
- Configurable analysis intervals
- Owned asset monitoring
- Watchlist monitoring
- Persisted AI reports
- Changed-outlook detection
- Portfolio alerts
- Morning and evening reports
- Telegram notifications

## Non-Goals

- High-frequency trading
- Constant LLM analysis for every price tick
- Multiple notification platforms initially

## Inputs

- Portfolio assets
- Watchlist assets
- Market data
- News/sentiment inputs
- Scheduling configuration

## Outputs

- Alerts
- Scheduled reports
- Persisted monitoring runs
- Changed-outlook events

## Core Data / Entities

- MonitoringJob
- Alert
- Report
- AnalysisSnapshot
- NotificationDelivery

## Main Flows

- Scheduler checks configured intervals
- System detects material data changes
- Analysis runs when justified
- System persists result
- Alerts or reports are sent when thresholds are met

## Edge Cases

- Job overlap
- Provider outage
- Model outage
- Repeated duplicate alerts
- Stale data

## Dependencies

- Scheduler
- Market data
- AI analysis
- Notification service

## Acceptance Criteria

- Monitoring cadence is configurable
- System can generate morning/evening reports
- Critical alerts are persisted and optionally delivered through Telegram
- Expensive AI analysis is not triggered unnecessarily

## Open Questions

- Which scheduler technology should be used?
- What qualifies as a material change for each asset type?

## Future Extensions

- User-configurable alert rules
- Additional notification channels
- Alert severity tuning

