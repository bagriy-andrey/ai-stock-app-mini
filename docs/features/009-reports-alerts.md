# 009 - Reports and Alerts

## Goal

Produce useful reports and alerts from portfolio, watchlist, market, and AI analysis data.

## User Value

The user receives timely information about material changes without constantly checking the app.

## Scope

- Morning brief
- Evening brief
- Intraday/as-needed reports
- Daily reports
- Weekly reports
- Monthly reports
- Quarterly reports
- Yearly reports
- Portfolio alerts
- Watchlist alerts
- Opportunity alerts
- Critical market alerts
- Changed-thesis alerts
- Telegram delivery first
- Web dashboard history
- Store reports in their original generated language
- On-demand report translation through OpenRouter with cached translations

## Non-Goals

- Many notification channels initially
- Noisy low-value alerts
- Guaranteed real-time delivery
- Regenerating translated reports on every page view
- Internal learning reports that calibrate models, signals, agents, or learned patterns

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
- Cached report translations

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
- User opens a report and requests translation
- System translates through OpenRouter, stores the translated version, and reuses it on later views

## Edge Cases

- Duplicate alerts
- Telegram failure
- Stale data
- Alert storm during volatile market
- Conflicting analysis updates
- Translation model failure
- Original report updated after a translation was cached

## Dependencies

- Automated monitoring
- Telegram integration
- AI analysis
- Market data
- OpenRouter model routing

## Acceptance Criteria

- Reports are persisted and visible in the app
- Critical alerts can be delivered through Telegram
- Alert severity and source are clear
- Reports can be generated on daily, weekly, monthly, quarterly, and yearly cadence
- Original report content is preserved
- Translations are generated on demand and cached by report version and target language
- User-facing reports remain separate from internal learning artifacts

## Open Questions

- What alert thresholds should be default?
- How should alert deduplication work?

## Future Extensions

- Email or push notifications
- User-configurable alert rules
- Alert feedback controls
