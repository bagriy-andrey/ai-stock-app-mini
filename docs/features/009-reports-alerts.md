# 009 - Reports and Alerts

## Goal

Produce useful reports and alerts from portfolio, watchlist, market, and AI analysis data.

## User Value

The user receives timely information about material changes without constantly checking the app.

## Scope

- Morning brief
- Evening brief
- Portfolio alerts
- Watchlist alerts
- Opportunity alerts
- Critical market alerts
- Changed-thesis alerts
- Telegram delivery first
- Web dashboard history

## Non-Goals

- Many notification channels initially
- Noisy low-value alerts
- Guaranteed real-time delivery

## Inputs

- Portfolio data
- Watchlist data
- Monitoring results
- Opportunity scanner results
- Market events
- AI analysis

## Outputs

- Reports
- Alerts
- Notification delivery records

## Core Data / Entities

- Report
- Alert
- AlertSeverity
- NotificationChannel
- NotificationDelivery

## Main Flows

- System generates scheduled brief
- System detects critical event
- Alert is persisted
- Notification is delivered if configured
- User views alert/report history

## Edge Cases

- Duplicate alerts
- Telegram failure
- Stale data
- Alert storm during volatile market
- Conflicting analysis updates

## Dependencies

- Automated monitoring
- Telegram integration
- AI analysis
- Market data

## Acceptance Criteria

- Reports are persisted and visible in the app
- Critical alerts can be delivered through Telegram
- Alert severity and source are clear

## Open Questions

- What alert thresholds should be default?
- How should alert deduplication work?

## Future Extensions

- Email or push notifications
- User-configurable alert rules
- Alert feedback controls

