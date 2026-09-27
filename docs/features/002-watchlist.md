# 002 - Watchlist

## Goal

Allow the user to maintain a list of assets to monitor separately from owned positions.

## User Value

The user can track assets of interest and receive analysis or alerts when material conditions change.

## Scope

- Add, edit, and remove watchlist assets
- Support stock, ETF, and crypto asset types
- Store optional notes and investment intent
- Show current price, AI view, confidence, catalysts, and changed outlook in later phases

## Non-Goals

- Portfolio position management
- Opportunity discovery outside the watchlist
- Automated trading

## Inputs

- User-selected tickers/symbols
- Market prices
- Asset metadata
- AI analysis in later phases

## Outputs

- Watchlist table
- Current monitoring status
- Changed-outlook indicators
- Candidate alerts

## Core Data / Entities

- WatchlistItem
- Asset
- AssetIntent
- AnalysisSummary

## Main Flows

- User adds an asset to watchlist
- User edits notes or intent
- User removes an asset
- System refreshes price and status
- System flags changed outlook in later phases

## Edge Cases

- Asset already owned
- Duplicate watchlist entry
- Ambiguous ticker
- Unsupported asset type

## Dependencies

- Asset metadata
- Market data
- AI analysis in later phases

## Acceptance Criteria

- Watchlist remains distinct from portfolio holdings
- User can manage watchlist manually
- Watchlist can be used by scheduled monitoring in later phases

## Open Questions

- Should owned assets automatically appear in monitoring views?
- How should ticker ambiguity be resolved?

## Future Extensions

- Watchlist groups
- Price and thesis alerts
- Import/export watchlists

