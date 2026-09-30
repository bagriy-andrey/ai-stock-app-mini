# 003F - Provider-Backed Scanner Ingestion Plan

## Objective

Turn Phase 3 scanners from mostly manual-data triage into provider-backed scanner workflows.

This phase should refresh scoped market data before scanner execution, convert external news/filings/macro/crypto inputs into structured scanner evidence, and keep ingestion limited to the user's portfolio, watchlist, and configured discovery universes.

The goal is not broad market data warehousing. The goal is to make scanner signals useful enough to decide what deserves Deep Analysis.

## Why This Exists

The Phase 3 scanner MVP persisted `ScannerRun`, `ScannerSignal`, and `MarketEvent` records, but its usefulness is limited when inputs are mostly manually entered prices or missing provider data.

Provider-backed ingestion makes the scanner funnel practical:

```text
portfolio / watchlist / discovery universe
  -> scoped provider refresh
  -> latest price snapshots + structured events
  -> scanner signals and ranking
  -> selected Deep Analysis
```

Without this step, scanners risk becoming static reports about stale local data instead of an actionable low-cost monitoring layer.

## Scope

- Refresh latest prices before manual scanner runs where provider coverage exists.
- Store provider-backed `MarketPrice` snapshots for stock/ETF and crypto assets.
- Normalize provider news into `MarketEvent` records.
- Persist provider provenance in scanner run `inputScope`, signal `sourceRefs`, and market event records.
- Keep scanner ingestion scoped to:
  - owned portfolio assets
  - watchlist assets
  - active discovery universe assets
- Handle missing API keys, provider outages, rate limits, empty provider responses, and stale provider data explicitly.
- Add focused tests around provider normalization, deduplication, and scanner behavior with mocked provider responses.

## Non-Goals

- Broad market ingestion outside configured universes.
- High-frequency or tick-level data.
- Production-grade institutional data warehouse.
- Paid advanced crypto/on-chain/social providers before outcome evaluation proves value.
- Autonomous real trading.
- Forecast persistence or outcome evaluation.
- Replacing Deep Analysis with scanner output.
- Separate worker infrastructure unless request/response scanner execution becomes unreliable.

## Provider Strategy

Use the provider strategy already recorded in `docs/features/003-market-data.md` and `docs/decisions.md`.

### Phase 3F MVP Providers

#### FMP

Primary MVP provider for stock/ETF scanner inputs.

Use for:

- latest stock/ETF quotes
- basic company metadata when already needed by UI
- financial news where the selected plan covers the endpoint
- earnings/calendar data later if endpoint coverage is confirmed

Environment:

- `FMP_API_KEY`

Persistence:

- latest quotes become `MarketPrice` rows with provider `fmp`
- news becomes `MarketEvent` rows with provider `fmp`

#### CoinGecko

Primary MVP provider for crypto spot data.

Use for:

- latest spot price
- 24h volume and market cap where useful
- basic crypto metadata

Persistence:

- latest crypto spot prices become `MarketPrice` rows with provider `coingecko`
- market cap / volume can initially live in scanner `sourceRefs` or a provider snapshot section of `inputScope` until a durable metrics table is justified

#### Marketaux

Optional financial-news provider when FMP news is insufficient.

Use for:

- entity-linked financial news
- sentiment/entity metadata
- more reliable news-to-asset mapping

Environment:

- future `MARKETAUX_API_KEY`

Upgrade trigger:

- FMP news creates too many irrelevant or weakly classified events
- entity sentiment becomes materially useful for scanner ranking
- free-tier usage is enough to prove value before paid upgrade

### Later Providers

#### SEC EDGAR

Use for durable filing events:

- 10-K
- 10-Q
- 8-K
- company facts

This should become a filings/event scanner, not a generic news provider.

#### FRED / ALFRED

Use for macro context and point-in-time vintages:

- rates
- CPI
- unemployment
- GDP
- yield curve series

This belongs primarily in macro/event context and future forecast snapshots, not the first scanner MVP.

#### GDELT

Use for global and geopolitical events:

- geopolitical escalation/deescalation
- country risk
- broad macro/geopolitical event context

This should be added only after asset-level news/events are useful.

#### CoinGlass

First paid tactical crypto upgrade when crypto derivatives data is useful:

- funding rates
- open interest
- liquidations
- long/short positioning

#### Glassnode / CryptoQuant / Santiment

Deferred advanced crypto/on-chain/social providers.

Add only after outcome evaluation shows that these feeds improve forecast quality enough to justify cost.

## Data Flow

### Manual Scanner Run With Provider Refresh

```text
user clicks Run manually
  -> resolve scanner scope
  -> refresh provider data for scoped assets
  -> persist latest price snapshots and structured events
  -> run deterministic scanner rules
  -> rank scanner signals
  -> persist ScannerRun and ScannerSignal records
```

Provider refresh should be best-effort. A provider failure should not prevent deterministic scanning over existing local data unless the scanner has no usable inputs.

### Scope Resolution

Portfolio scanner:

- active portfolio positions
- latest provider prices for those assets
- no discovery universe expansion

Watchlist scanner:

- all watchlist items initially
- later add priority/scope controls for large watchlists

Opportunity scanner:

- active `DiscoveryUniverseAsset` rows
- exclude owned and watchlisted assets
- no broad market search

Crypto scanner:

- crypto assets in portfolio, watchlist, or active discovery universes
- crypto spot refresh through CoinGecko first
- derivatives/on-chain feeds deferred

News/event scanner:

- tracked stock/ETF assets from portfolio, watchlist, and active discovery universes
- provider news normalized into `MarketEvent`
- event signals emitted only when classification and asset mapping are good enough

## Data Model Expectations

Reuse current MVP models:

- `Asset`
- `MarketPrice`
- `DiscoveryUniverse`
- `DiscoveryUniverseAsset`
- `ScannerRun`
- `ScannerSignal`
- `MarketEvent`
- `ScannerEventLink`

Do not add a broad `DataProvider` table until there is a concrete need for provider health, usage metering, or multi-provider configuration in the UI.

Potential later additions:

- `ProviderIngestionRun`
- `ProviderUsageRecord`
- `PriceHistory`
- `AssetProviderMapping`
- `EventEntity`

## Freshness Rules

Initial defaults:

- portfolio/watchlist stock/ETF latest price is stale after 24 hours
- crypto latest price is stale after 24 hours in MVP, with shorter thresholds considered later
- provider news older than 7 days should have reduced event recency score
- filings and macro releases follow their natural publication cadence

Freshness status should be surfaced rather than hidden. Scanners may still use stale data, but ranking should apply a freshness penalty.

## Event Normalization

Start deterministic:

- provider title/body metadata
- provider asset/entity mapping
- keyword/category mapping into the MVP taxonomy
- confidence and severity rules
- dedupe by provider, event type, affected entity/asset, date, and normalized title

Cheap AI classification may be added later for ambiguous events, but it should use the `cheap` model tier and must not be required for core scanner behavior.

## Error Handling

Scanner ingestion must handle:

- missing API key
- provider auth failure
- rate limit
- provider outage
- malformed provider response
- empty provider response
- unmapped symbol
- duplicate event coverage
- stale provider timestamp
- partial scanner completion

Expected behavior:

- persist scanner run where possible
- set run status to `PARTIAL` when provider refresh fails but local scanner rules still run
- store warnings in `inputScope`
- never invent prices or events

## Cost Controls

- Refresh only scoped assets.
- Batch symbols where provider APIs support it.
- Cache short-lived provider responses where useful.
- Do not refresh broad indexes or all market symbols by default.
- Do not call OpenRouter for every news item.
- Keep paid providers optional until evaluation proves value.

## UI Requirements

Scanner dashboard should eventually show:

- provider refresh status per run
- warnings for missing keys, partial provider failures, and empty provider responses
- latest refresh timestamp
- count of provider-backed price snapshots created
- count of market events created or deduped

Scanner run detail should show:

- provider snapshots in `inputScope`
- source references on each signal
- market event links when present
- clear copy that scanner signals are not trade instructions

## Testing Plan

Automated tests should not require real provider calls.

Add tests for:

- FMP quote normalization into `MarketPrice` input
- CoinGecko spot normalization into `MarketPrice` input
- FMP/Marketaux news normalization into `MarketEvent`
- event dedupe behavior
- provider missing-key behavior
- provider outage partial scanner behavior
- stale provider timestamp warnings
- scanner runs with provider-backed and fallback local data

## Milestones

### Phase 3F.1 - Price Refresh Before Scanning

- Add provider adapters for stock/ETF latest quotes and crypto spot.
- Refresh scoped assets before portfolio/watchlist/crypto scanner runs.
- Persist provider-backed `MarketPrice` rows.
- Preserve manual price entry as fallback/manual override.

### Phase 3F.2 - News/Event Provider Hardening

- Harden FMP news ingestion or replace/augment with Marketaux when useful. Implemented for FMP by trying both legacy and stable news endpoints before treating the response as empty.
- Improve event normalization and event-to-asset mapping. Implemented with symbol and provider-symbol matching plus provider diagnostics in scanner `inputScope`.
- Link `MarketEvent` records to scanner signals. Implemented through `ScannerEventLink` creation when news/event signals are persisted.
- Keep provider-missing behavior explicit and non-fatal. Implemented with `PARTIAL` runs and warnings.

### Phase 3F.3 - Discovery Universe Management

- Add UI to create active discovery universes. Implemented on `/scanners`.
- Add/remove assets from universes. Implemented on `/scanners` with shared asset metadata search.
- Show universe asset counts and provider coverage. Implemented in the discovery universe manager table.
- Keep opportunity scanning limited to active universes. Implemented, with optional selected-universe controls for manual runs.

### Phase 3F.4 - Scope and Batch Controls

- Add manual run scope controls. Implemented on scanner run cards:
  - high priority only
  - selected universe
  - stale data only
  - max assets per run
- Prepare scanner services for future scheduled/background execution. Implemented by passing `ScannerRunOptions` into scanner services.

### Phase 3F.5 - Deep Analysis Escalation

- Add "Run Deep Analysis" action from eligible scanner signals. Implemented on scanner run detail pages for deep-analysis candidates.
- Include scanner signal and market event context in the Deep Analysis input snapshot. Implemented through `scannerContext` in the analysis snapshot.
- Preserve manual user control; do not auto-run expensive analysis for every signal. Implemented; scanner output never auto-starts Deep Analysis.

## Acceptance Criteria

- Portfolio, watchlist, opportunity, crypto, and news/event scanners can use provider-backed data when configured.
- Missing providers produce explicit partial runs or warnings, not invented data.
- Latest provider prices are persisted with provenance before scanner rules use them.
- Provider news/events are normalized into `MarketEvent` with deduplication.
- Scanner signals expose source references and data freshness.
- Scanner ingestion remains scoped to portfolio, watchlist, and active discovery universes.
- Deep Analysis is still manually triggered or explicitly selected, not automatically run for every scanned asset.
- Automated tests pass without real provider or OpenRouter calls.

## Documentation Updates Required During Implementation

- Update `docs/features/003-market-data.md` with exact endpoints and provider limits.
- Update `docs/decisions.md` when exact FMP/Marketaux/CoinGecko endpoint choices are confirmed.
- Update `docs/architecture/data-model.md` if provider ingestion requires new persistence models.
- Update `docs/plans/003-lightweight-scanners-event-detection-plan.md` when Phase 3F milestones are completed.
- Update `docs/development-insights.md` after implementation details settle.
