# 003 - Phase 3 Lightweight Scanners and Event Detection Plan

## Objective

Build the cheap, explainable funnel that decides what deserves expensive Deep Analysis.

Phase 3 should let the application scan owned assets, watched assets, and a small configured discovery universe, detect material changes and structured market events, rank candidates, and explain why an asset should or should not be escalated to Deep Analysis.

This phase is not a forecasting, learning, or paper-trading phase. It creates durable scanner and event records that later phases can feed into Deep Analysis snapshots, Forecast Engine runs, reports, and learning workflows.

## Phase 3 Scope

- Portfolio scanner
- Watchlist scanner
- Opportunity scanner over configured discovery universes
- Crypto scanner where useful with existing or low-cost data
- News/event scanner
- Scanner run and signal persistence
- Structured market-event persistence
- Extensible event taxonomy MVP
- Material-change thresholds
- Candidate ranking
- Manual scanner execution from the UI
- Basic scanner results UI
- Ability to add surfaced opportunity candidates to the watchlist
- Focused tests for scoring, thresholds, event normalization, duplicate handling, and persistence

## Non-Goals

- Structured Forecast Engine records
- Outcome evaluation
- Paper Trader
- Market Intelligence Memory / Pattern Engine
- Learned patterns or historical case retrieval
- Telegram notifications
- Morning/evening reports
- Broad market ingestion outside configured universes
- High-frequency trading or tick-level monitoring
- Continuous expensive LLM analysis for every asset
- Automatic real trade execution
- Full paid crypto/on-chain/social provider integration
- Separate Python/FastAPI, BullMQ, Redis, or Celery infrastructure unless the current Next.js scheduler foundation becomes insufficient

## Product Boundaries

The real portfolio remains advisory-only. Scanner output may recommend "review", "monitor", "consider analysis", "add to watchlist", or "ignore for now", but it must not execute real trades or imply brokerage connectivity.

Scanners are cheap triage components. They may use deterministic rules, lightweight technical calculations, provider metadata, and cheap model classification when needed. They must not run the full TradingAgents-inspired Deep Analysis workflow for every scanned asset.

Deep Analysis remains manually triggered or explicitly selected by candidate escalation in this phase. Fully integrating scanner and event evidence into Deep Analysis snapshots belongs to Phase 4.

Forecasts remain out of scope. Scanner scores, opportunity scores, and event severity are not immutable predictions and should not be evaluated as forecast records.

## Recommended MVP Architecture

Continue using the existing Next.js/Prisma application:

- React UI in the App Router
- Server actions or route handlers for scanner execution and watchlist actions
- Prisma repositories for scanner runs, scanner signals, discovery universes, and market events
- Existing scheduler foundation for future scheduled scans, with manual runs first
- Existing model router for any cheap classification calls
- Existing portfolio, watchlist, asset, and latest-price repositories as scanner inputs

Do not introduce a separate worker stack for the MVP unless scanner execution becomes too slow or unreliable for request/response execution.

## Phase 3 Decisions

### Start with manual scanner runs

Phase 3 should first implement manual scan execution from the UI and service layer. Scheduled automation can reuse the same services later, but the first implementation should keep operational behavior visible and easy to debug.

### Persist scanner outputs before escalation

Scanner runs and signals should be stored before any Deep Analysis escalation. This preserves provenance and makes it possible to explain why expensive analysis was or was not run.

### Keep event detection structured but narrow

The first event detector should support a small taxonomy and a conservative normalization flow. It should store source provenance, confidence, severity, and affected entities. It should not attempt to build a full market knowledge graph.

### Keep scoring explainable

Scores should be derived from named signal components and stored reasons. A score that cannot be explained in the UI should not drive escalation.

### Prefer deterministic checks before cheap AI

Use deterministic thresholds first. Cheap AI classification can help normalize ambiguous news/events or summarize reasons, but it should not be required for basic portfolio/watchlist material-change detection.

## Data Model

Phase 3 should add a minimal scanner and event persistence model.

### DiscoveryUniverse

Represents a configured group of assets that may be scanned for opportunities.

Recommended fields:

- `id`
- `name`
- `description`
- `isActive`
- `createdAt`
- `updatedAt`

MVP assumption:

- Store a small curated universe first. Do not attempt full S&P 500, Nasdaq 100, all ETFs, or all crypto assets until provider limits and scoring quality are understood.

### DiscoveryUniverseAsset

Represents an asset included in a discovery universe.

Recommended fields:

- `id`
- `discoveryUniverseId`
- `assetId`
- `priority`
- `notes`
- `createdAt`
- `updatedAt`

Constraints:

- One row per universe and asset.

### ScannerRun

Represents one scanner execution.

Recommended fields:

- `id`
- `scannerType`: `PORTFOLIO`, `WATCHLIST`, `OPPORTUNITY`, `CRYPTO`, `NEWS_EVENT`
- `status`: `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `PARTIAL`
- `trigger`: `MANUAL`, `SCHEDULED`, `SYSTEM`
- `configurationVersion`
- `inputScope`
- `startedAt`
- `completedAt`
- `errorMessage`
- `createdAt`
- `updatedAt`

`inputScope` should be JSON that identifies scanned portfolio ids, watchlist ids, universe ids, asset ids, provider snapshots, threshold settings, and missing-data warnings.

### ScannerSignal

Represents one material signal emitted by a scanner.

Recommended fields:

- `id`
- `scannerRunId`
- `assetId`
- `signalType`
- `severity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `direction`: `POSITIVE`, `NEGATIVE`, `MIXED`, `NEUTRAL`, `UNKNOWN`
- `score`
- `confidence`
- `title`
- `summary`
- `reasons`
- `risks`
- `sourceRefs`
- `dataFreshness`
- `isDeepAnalysisCandidate`
- `createdAt`

MVP assumption:

- `reasons`, `risks`, and `sourceRefs` can be JSON arrays to preserve structured explanations without over-normalizing early.

### MarketEvent

Represents a structured event extracted from news, provider data, or scanner evidence.

Recommended fields:

- `id`
- `eventType`
- `occurredAt`
- `detectedAt`
- `sourceProvider`
- `sourceUrl`
- `sourceTitle`
- `affectedAssetId`
- `affectedEntity`
- `assetClass`
- `sector`
- `country`
- `direction`: `POSITIVE`, `NEGATIVE`, `MIXED`, `NEUTRAL`, `UNKNOWN`
- `severity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `confidence`
- `summary`
- `rawPayload`
- `createdAt`
- `updatedAt`

MVP assumption:

- Support one primary affected asset per event first. A future `EventEntity` table can support many-to-many event links when needed.

### ScannerEventLink

Represents the relationship between scanner signals and structured events.

Recommended fields:

- `id`
- `scannerSignalId`
- `marketEventId`
- `createdAt`

## MVP Event Taxonomy

Start with a narrow taxonomy that covers common high-value events:

- `earnings_beat`
- `earnings_miss`
- `guidance_raise`
- `guidance_cut`
- `analyst_upgrade`
- `analyst_downgrade`
- `management_change`
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
- `rate_cut`
- `rate_hike`
- `major_macro_surprise`
- `geopolitical_escalation`
- `geopolitical_deescalation`
- `unknown_material_event`

The taxonomy should be centralized in code and documented enough that new categories can be added without changing unrelated scanner logic.

## Scanner Responsibilities

### Portfolio Scanner

Inputs:

- active real portfolio positions
- latest prices and price freshness
- portfolio weights
- cash/base-currency context
- existing analysis run recency where available

Initial signals:

- missing latest price
- stale latest price
- large price move where history is available
- high concentration
- material allocation drift
- large unrealized gain/loss
- owned asset has high-severity event

Outputs:

- ranked owned-asset candidates
- explanations tied to portfolio risk and position context

### Watchlist Scanner

Inputs:

- watchlist items
- latest prices and freshness
- target entry prices
- watchlist priority
- investment intent

Initial signals:

- missing latest price
- stale latest price
- price near or below target entry
- material price move
- high-priority watchlist asset has high-severity event
- watched asset has not been analyzed recently

Outputs:

- ranked watchlist candidates
- reasons to monitor, ignore, or run Deep Analysis

### Opportunity Scanner

Inputs:

- active discovery universes
- latest prices where available
- available provider metadata
- portfolio and watchlist exclusions

Initial signals:

- candidate not currently owned or watched
- strong watchlist-style opportunity score
- favorable event with enough confidence
- long-term candidate from curated universe
- tactical candidate from material movement or event

Outputs:

- opportunity list
- opportunity score
- opportunity type: `LONG_TERM`, `TACTICAL`, or `MIXED`
- confidence
- reasons and risks
- add-to-watchlist action

### Crypto Scanner

Inputs:

- crypto assets in portfolio, watchlist, or crypto discovery universe
- latest spot prices
- market cap, liquidity, or provider metadata where available

Initial signals:

- material price move
- volume/liquidity change where available
- stale or missing crypto price
- exchange/security event
- whale activity if available from a low-cost source

MVP caveat:

- Avoid paid derivatives, on-chain, and social feeds until outcome evaluation can prove they justify cost.

### News/Event Scanner

Inputs:

- provider news or event data where configured
- source title, timestamp, url, publisher/provider metadata
- asset or symbol mapping

Initial behavior:

- deduplicate obvious repeated coverage
- classify event type from the MVP taxonomy
- link to affected asset when confidence is high enough
- emit a scanner signal for material events

MVP caveat:

- If no news provider is configured, the scanner should complete with a clear missing-data warning rather than inventing events.

## Candidate Ranking

Candidate ranking should combine scanner signals into a single priority score.

Recommended initial components:

- severity score
- confidence score
- portfolio relevance score
- watchlist priority score
- opportunity score
- event recency score
- data freshness penalty
- duplicate/noise penalty
- recent-analysis penalty

Recommended output labels:

- `RUN_DEEP_ANALYSIS`
- `MONITOR`
- `ADD_TO_WATCHLIST`
- `IGNORE_FOR_NOW`
- `INSUFFICIENT_DATA`

The UI should expose the score components or a concise explanation so the ranking is auditable.

## Material-Change Thresholds

Use centralized threshold configuration.

Suggested MVP defaults:

- price is stale after 24 hours for portfolio/watchlist display parity
- target-entry proximity is material when current price is within 5% of target
- portfolio concentration is material when an asset exceeds 25% of portfolio value
- high-severity events become Deep Analysis candidates when confidence is at least 0.7
- missing price for an owned high-priority asset is at least medium severity

These values are implementation defaults, not investment truths. Keep them easy to revise.

## UI Workflows

### Scanner dashboard

Show:

- latest scanner runs by type
- status, started/completed timestamps, and errors
- count of emitted signals
- count of Deep Analysis candidates
- manual run buttons by scanner type

### Scanner run detail

Show:

- scanned scope
- configuration version
- missing-data warnings
- ranked signals
- signal reasons, risks, confidence, severity, and source references

### Candidate actions

Supported actions:

- start Deep Analysis for eligible portfolio/watchlist candidates
- add opportunity candidate to watchlist
- dismiss or ignore signal locally if implemented cheaply

The action copy must remain advisory-only.

## Error Handling

Phase 3 should handle:

- provider API key missing
- provider outage
- stale or missing prices
- empty discovery universe
- duplicate assets across universes
- invalid or ambiguous event classification
- unknown symbols from news providers
- scanner run partial failure
- repeated manual run clicks
- model-router failure for cheap classification

A failed or partial scanner run should be persisted with status and error details where possible.

## Cost Controls

- Deterministic checks should run before any model call.
- Cheap AI classification should use the `cheap` tier unless there is a clear reason to escalate.
- Scanner runs should record counts of scanned assets, emitted signals, and model calls.
- Deep Analysis should be triggered only for ranked candidates or explicit user action.
- Broad provider ingestion should stay limited to configured universes.

## Testing Plan

Add focused tests for:

- portfolio scanner missing/stale price behavior
- portfolio concentration threshold behavior
- watchlist target-entry threshold behavior
- opportunity scanner exclusion of owned/watched assets
- opportunity score normalization
- candidate ranking order
- event taxonomy validation
- event deduplication
- scanner run persistence for success, partial, and failure states
- signal provenance and reason persistence
- add-to-watchlist action from opportunity candidate

Real provider calls and real OpenRouter calls should not be required for automated tests.

## Documentation Updates

During Phase 3 implementation, update:

- `docs/decisions.md` when scanner boundary, scheduler, taxonomy, or persistence decisions change
- `docs/architecture/scheduling.md` if run cadence or scheduler technology changes
- `docs/architecture/data-model.md` when schema names differ from this plan
- `docs/features/005-automated-monitoring.md` if reports/alerts move between phases
- `docs/features/006-opportunity-scanner.md` if opportunity scoring scope changes
- `docs/features/013-market-intelligence-memory.md` if event taxonomy or event storage changes

## Recommended Phase 3 Milestones

### Phase 3A - Schema and Domain Contracts

- Add scanner and event enums
- Add `DiscoveryUniverse`, `DiscoveryUniverseAsset`, `ScannerRun`, `ScannerSignal`, `MarketEvent`, and scanner-event link persistence
- Add repository methods
- Add centralized scanner thresholds
- Add unit tests for score and threshold helpers

### Phase 3B - Portfolio and Watchlist Scanners

- Implement deterministic owned-asset scanning
- Implement deterministic watchlist scanning
- Persist runs and signals
- Add manual run actions
- Add scanner dashboard MVP

### Phase 3C - Opportunity Scanner

- Add discovery universe management or seed data
- Implement opportunity scan over configured assets
- Exclude or mark owned/watchlist assets
- Add candidate ranking
- Add add-to-watchlist action

### Phase 3D - Event Detection MVP

- Add centralized MVP event taxonomy
- Implement provider-agnostic event normalization interface
- Add news/event scanner with missing-provider behavior
- Persist market events and link them to scanner signals
- Add event classification and deduplication tests

### Phase 3E - Review and Stabilization

- Tighten scanner UI
- Verify advisory-only language
- Run lint, typecheck, tests, and build
- Update docs and development insights

### Phase 3F - Provider-Backed Scanner Ingestion

Detailed specification: [003F - Provider-Backed Scanner Ingestion Plan](003f-provider-backed-scanner-ingestion-plan.md).

- Refresh scoped stock/ETF and crypto latest prices before scanner runs - implemented for manual portfolio, watchlist, opportunity, and crypto scanners
- Persist provider-backed `MarketPrice` snapshots with provenance - implemented with `fmp` and `coingecko` provider values
- Harden news/event ingestion beyond missing-provider placeholders - implemented for FMP news with explicit missing-key partial runs
- Normalize provider news into deduped `MarketEvent` records - implemented with deterministic taxonomy normalization and `dedupeKey`
- Keep ingestion scoped to portfolio, watchlist, and active discovery universes - implemented
- Add scanner scope controls before scaling to large watchlists or universes - implemented for selected universe, high priority only, stale data only, and max assets per run
- Add scanner-to-Deep Analysis escalation with scanner/event context - implemented for eligible scanner signals

## Completion Criteria

Phase 3 is complete when:

- the user can manually run portfolio, watchlist, opportunity, and available news/event scanners
- scanner runs and signals are persisted with provenance
- structured market events are persisted for supported event types
- candidates are ranked with explainable reasons and confidence
- opportunity candidates can be added to the watchlist
- expensive Deep Analysis is not run for every scanned asset
- scanner output clearly separates long-term and tactical relevance where possible
- missing/stale/low-quality data is surfaced instead of hidden
- real portfolio workflows remain advisory-only
- no Forecast Engine, outcome evaluation, Paper Trader, or learning-cycle behavior is introduced
- lint, typecheck, tests, and build pass
