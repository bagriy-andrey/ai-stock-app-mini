# 006 - Opportunity Scanner

## Goal

Discover potentially interesting assets that the user does not currently own.

## User Value

The user can find missed long-term or tactical opportunities and understand why they were surfaced.

## Scope

- Maintain discovery universes
- Scan assets outside portfolio and watchlist
- Calculate opportunity score
- Identify long-term opportunities
- Identify tactical opportunities
- Explain reasons and risks
- Allow adding surfaced assets to watchlist

## Non-Goals

- Real trade execution
- Unlimited market universe in MVP
- Full institutional screener

## Inputs

- Discovery universe
- Market data
- Fundamentals
- News/sentiment
- Technical signals
- Portfolio/watchlist exclusions

## Outputs

- Opportunity list
- Opportunity score
- Opportunity type
- Horizon
- Expected upside/downside where available
- Confidence
- Reasons and risks

## Core Data / Entities

- DiscoveryUniverse
- Opportunity
- OpportunityScore
- OpportunityReason
- AssetLifecycleState

## Main Flows

- System scans configured universe
- Existing holdings/watchlist items are excluded or marked
- Candidate assets are scored
- Top opportunities are shown
- User adds candidate to watchlist

## Edge Cases

- Low data quality
- Illiquid assets
- Duplicate listings
- False positives from temporary news
- Conflicting long-term and tactical signals

## Dependencies

- Market data
- AI analysis
- Watchlist
- Portfolio

## Acceptance Criteria

- System can surface assets outside current portfolio
- Each opportunity includes reasons, risks, confidence, and suggested action
- User can add surfaced asset to watchlist

## Open Questions

- Which discovery universe should be first?
- How should opportunity score be normalized across stocks, ETFs, and crypto?

## Future Extensions

- Sector-specific scanners
- Crypto-specific universe
- User-defined scanner rules

