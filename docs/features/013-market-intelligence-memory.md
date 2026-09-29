# 013 - Event Detector and Market Intelligence Memory

## Goal

Convert external information into structured market events and accumulate historical cases so future analysis can retrieve evidence from the system's own market experience.

## User Value

The system can explain not only what happened today, but how similar conditions have historically behaved and whether the evidence is strong, weak, stale, or nonexistent.

## Scope

- Structured market-event taxonomy
- Event extraction from news, filings, macro releases, crypto feeds, and scanner signals
- Event entity linking to assets, companies, sectors, countries, ETFs, indexes, and asset classes
- Market observations / historical cases
- Outcome filling as horizons mature
- Learned pattern aggregation
- Impact relationship hypotheses for candidate discovery
- Retrieval of relevant cases/patterns into future Deep Analysis and Forecast Engine runs

## Non-Goals

- Hardcoded market truths
- Full institutional knowledge graph in the MVP
- Advanced statistical discovery before enough observations exist
- Paid advanced data feeds before evaluation proves value
- Automatic production behavior changes from unvalidated patterns

## Inputs

- News and article metadata
- SEC filings and company updates
- Earnings, guidance, analyst, dividend, buyback, dilution, and management-change data
- Macro releases and vintages
- Geopolitical feeds
- ETF flow data where available
- Crypto market, derivatives, whale, exchange, and on-chain data where available
- Scanner signals
- Price history and future outcomes
- Market regime labels

## Outputs

- Structured market events
- Event-entity links
- Market observations / historical cases
- Learned patterns
- "No meaningful relationship" records
- Retrieved evidence for Deep Analysis and Forecast Engine

## Core Data / Entities

- MarketEvent
- EventEntity
- ImpactRelationship
- MarketObservation
- LearnedPattern
- PatternEvidence
- PatternVersion
- DataVersion

## Event Examples

- `earnings_beat`
- `earnings_miss`
- `guidance_raise`
- `guidance_cut`
- `analyst_upgrade`
- `analyst_downgrade`
- `insider_buy`
- `insider_sell`
- `CEO_change`
- `management_change`
- `acquisition`
- `acquisition_rumor`
- `customer_win`
- `customer_loss`
- `product_launch`
- `product_delay`
- `regulatory_risk`
- `lawsuit`
- `share_buyback`
- `share_dilution`
- `dividend_increase`
- `dividend_cut`
- `ETF_inflow`
- `ETF_outflow`
- `whale_buy`
- `whale_sell`
- `exchange_hack`
- `tariff_change`
- `sanctions`
- `trade_restriction`
- `war_escalation`
- `geopolitical_deescalation`
- `rate_cut`
- `rate_hike`
- `major_macro_surprise`
- `oil_supply_disruption`

## Main Flows

- System ingests external source data.
- Event Detector extracts structured events with source, timestamp, affected entities, direction, severity, and confidence.
- System creates market observations combining event, context, and price at event time.
- Outcome jobs fill future returns at available horizons.
- Pattern Engine aggregates observations into learned patterns or records lack of meaningful relationship.
- Future analysis retrieves only cases and patterns that were known at the analysis timestamp.

## Edge Cases

- Conflicting sources
- Duplicate news coverage of the same event
- Unclear affected entity
- Revised macro or fundamentals data
- Sparse observations
- Regime changes and concept drift
- False relationships from small samples

## Dependencies

- Market data
- News/macro/filing/event providers
- Scanners
- Outcome evaluation
- Point-in-time snapshots
- Learning Engine

## Acceptance Criteria

- Events are stored as structured records with source provenance.
- Observations connect events and context to future outcomes.
- Learned patterns include evidence counts, recency, confidence, and versioning.
- The system can state when no meaningful relationship exists.
- Retrieved patterns cannot include evidence learned after the analysis timestamp.

## Open Questions

- Which event categories are enabled in the first MVP taxonomy?
- What minimum sample size is required before a pattern can influence forecasts?
- How should impact relationships be seeded without making them hardcoded truths?

## Future Extensions

- Rich impact graph across countries, economies, industries, sectors, companies, ETFs, indexes, and asset classes.
- Statistical significance tests by asset type and regime.
- Recency-weighted pattern confidence.
- Pattern drift and stale-knowledge detection.
