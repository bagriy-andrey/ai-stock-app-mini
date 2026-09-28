# 002 - Phase 2 Deep Analysis MVP Plan

## Objective

Build the first AI-powered workflow for the application: manually triggered, portfolio-aware Deep Analysis for stocks, ETFs, and crypto.

Phase 2 should let the user run a structured multi-agent analysis for assets such as BTC, NVDA, and SPY, inspect balanced reasoning, understand portfolio fit, and persist the result for later review.

This phase is the foundation for later scanners, structured events, forecasts, automated monitoring, reports, Paper Trader, and learning workflows. It should not attempt to implement all of those future systems at once.

## Phase 2 Scope

- Manual AI analysis trigger for portfolio positions and watchlist items
- TradingAgents-inspired analysis flow
- Initial analyst roles
- Bull and bear research debate
- Risk analysis
- Portfolio-aware final recommendation
- Asset intent routing for `LONG_TERM` and `TACTICAL`
- OpenRouter model routing through logical tiers
- AI usage, latency, status, and cost tracking
- Persisted analysis runs and reports
- Saved reasoning summaries by agent
- Immutable input snapshots
- Basic analysis history and report detail UI
- Focused tests for context building, output validation, model fallback, and persistence behavior

## Non-Goals

- Automated monitoring
- Lightweight scanners
- Structured event detection
- Market Intelligence Memory / Pattern Engine
- Scheduled reports
- Telegram notifications
- Opportunity scanner for broad assets outside the user's portfolio/watchlist
- Structured forecast engine
- Outcome evaluation
- Paper Trader
- Adaptive learning and dynamic self-modification
- Real brokerage integration
- Real order execution
- Full market/news/fundamentals ingestion pipeline
- Unrestricted user-created agents in the UI

## Product Boundaries

The real portfolio remains advisory-only. Phase 2 may analyze, warn, and recommend, but it must not execute real trades or imply brokerage connectivity.

Long-term investing remains the primary product mode. Tactical/speculative analysis is supported, but it must be clearly labeled and separated from long-term investment reasoning.

AI reports are not yet normalized forecasts. They may contain directional opinions and scenario discussion, but measurable prediction records belong to the later Forecast Engine phase.

Paper trading is not part of Phase 2. Any language that sounds like a trade instruction must be framed as advisory analysis for the user, not as an executable action.

TradingAgents-inspired agents are the Deep Analysis Engine only. They must not own scheduling, scanner rules, the watchlist, the real portfolio, Paper Trader execution, reporting, or learning persistence.

## Recommended MVP Architecture

Continue using the Phase 0/1 monolithic Next.js application for Phase 2:

- React UI in the App Router
- Server actions or route handlers for analysis requests
- Prisma as the persistence layer
- Existing `ModelRouter` and `OpenRouterClient` as the LLM boundary
- A TypeScript Deep Analysis orchestration layer inspired by TradingAgents
- No separate Python/FastAPI service yet

Do not introduce LangGraph, Celery, Redis, BullMQ, or a separate worker service in Phase 2 unless manual analysis latency becomes unmanageable.

The application should preserve a clean future boundary so a Python/LangGraph/TradingAgents service can be introduced later without rewriting product workflows.

## Phase 2A Decisions

### Use adapted TradingAgents concepts inside the Next.js app first

Phase 2 should use TauricResearch/TradingAgents as a reference for roles and flow, but should not copy the framework wholesale or turn the application into a thin TradingAgents UI wrapper.

Initial implementation should define application-owned TypeScript agents and prompts. This keeps the early system easier to test, persist, and integrate with portfolio/watchlist context.

### Keep agents code-defined in early phases

Initial agents should be defined in code and versioned with the repository. The UI may later allow selecting profiles, models, risk modes, or strategy configurations, but Phase 2 should not provide free-form custom agent creation.

Reasoning:

- Agent behavior must be reproducible.
- Prompt and output schema versions must be trackable.
- Tests can validate expected structure.
- Future learning metrics need stable agent identities.

### Let learning calibrate weights later, not rewrite agents

Future adaptive learning should adjust measurable configuration such as agent weights, confidence calibration, model-tier recommendations, and strategy preferences.

It should not autonomously rewrite source code, prompts, or schemas without explicit user review.

### Separate analysis reports from structured forecasts

Phase 2 stores human-readable and semi-structured analysis reports. It should not create normalized prediction records with forecast horizons, probabilities, and outcome eligibility.

The Forecast Engine phase will later extract or generate structured predictions from analysis outputs.

### Use logical model tiers only

Agents must request `cheap`, `standard`, or `strong` tiers. They should not hardcode provider model names. Exact model choices remain environment/config decisions behind the model router.

### Preserve analysis input snapshots

Each analysis run should persist enough input context to explain what the AI saw at the time of analysis:

- asset metadata
- latest price and freshness state
- portfolio position context when available
- watchlist context when available
- cash/base currency context where relevant
- selected intent
- provider provenance and missing-data warnings

This supports later review, reproducibility, and point-in-time correctness.

Later phases should extend snapshots with scanner signals, structured market events, and retrieved learned patterns. Phase 2 should design the snapshot shape so these inputs can be added without changing the responsibility boundary.

## Agent Flow

The Phase 2 MVP should implement this flow:

```text
User starts analysis
  -> Analysis Context Builder
  -> Asset Intent Router
    -> LONG_TERM or TACTICAL analysis mode
  -> Analyst agents
    -> Market Analyst
    -> Fundamentals / Asset Quality Analyst
    -> News / Sentiment Analyst
  -> Bull Researcher
  -> Bear Researcher
  -> Research Manager
  -> Risk Analyst
  -> Portfolio Manager
  -> Persisted Analysis Report
```

The exact analyst set can be reduced for the first implementation if cost or latency is too high, but the persisted run should record which agents actually participated.

## Initial Agent Responsibilities

### Market Analyst

Reviews available price context, freshness, asset type, and basic trend information. In Phase 2 this agent should be explicit when market data is missing, stale, or manually entered.

Recommended model tier: `cheap` or `standard`.

### Fundamentals / Asset Quality Analyst

Reviews the asset's long-term quality using whatever metadata is available. For stocks and ETFs, this may focus on company, sector, ETF structure, or broad exposure. For crypto, this may focus on network/use case, liquidity, adoption, and protocol-level risks.

Recommended model tier: `cheap` or `standard`.

### News / Sentiment Analyst

Reviews available news/sentiment context when present. If no durable news provider is integrated yet, the agent must state that limitation rather than inventing recent news.

Recommended model tier: `cheap`.

### Bull Researcher

Builds the strongest positive case from the analyst outputs.

Recommended model tier: `standard`.

### Bear Researcher

Builds the strongest negative case from the analyst outputs.

Recommended model tier: `standard`.

### Research Manager

Synthesizes the debate into a balanced view and identifies key uncertainties.

Recommended model tier: `strong`.

### Risk Analyst

Reviews downside risks, concentration risk, volatility, missing data, stale data, and portfolio-specific risk.

Recommended model tier: `standard`.

### Portfolio Manager

Produces the final advisory-only recommendation using the selected intent and portfolio/watchlist context.

Recommended model tier: `strong`.

## Intent Routing

Phase 2 should route analysis through the existing `InvestmentIntent` concept:

### `LONG_TERM`

Long-term analysis should prioritize:

- business or asset quality
- thesis durability
- valuation uncertainty
- macro sensitivity
- portfolio allocation fit
- downside risk
- long-term diversification

### `TACTICAL`

Tactical analysis should prioritize:

- price action
- short-term catalysts
- sentiment
- volatility
- liquidity
- risk/reward
- position sizing caution

Tactical analysis must remain separate from long-term portfolio guidance.

## Data Model

Phase 2 should add a minimal persistence model for analysis workflows.

### AgentRun

Represents one user-triggered analysis workflow.

Recommended fields:

- `id`
- `assetId`
- `portfolioId`
- `watchlistItemId`
- `requestedIntent`: `LONG_TERM` or `TACTICAL`
- `status`: `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `PARTIAL`
- `inputSnapshot`
- `startedAt`
- `completedAt`
- `errorMessage`
- `createdAt`
- `updatedAt`

### AnalysisReport

Represents the final saved report.

Recommended fields:

- `id`
- `agentRunId`
- `assetId`
- `language`
- `title`
- `summary`
- `recommendationLabel`
- `confidence`
- `riskLevel`
- `timeHorizon`
- `thesis`
- `opportunities`
- `risks`
- `portfolioFit`
- `missingDataWarnings`
- `rawOutput`
- `createdAt`
- `updatedAt`

### AgentReasoningSummary

Represents a compact persisted summary of one agent's output.

Recommended fields:

- `id`
- `agentRunId`
- `agentName`
- `agentRole`
- `modelTier`
- `model`
- `promptVersion`
- `summary`
- `stance`: `BULLISH`, `BEARISH`, `NEUTRAL`, or `MIXED`
- `confidence`
- `rawOutput`
- `createdAt`

### AiUsageRecord

The existing `AiUsageRecord` should be linked to `AgentRun` when Phase 2 persistence is implemented.

Recommended additional field:

- `agentRunId`

## Output Contract

The final Portfolio Manager output should be validated before persistence.

Recommended structured shape:

```json
{
  "title": "string",
  "summary": "string",
  "recommendationLabel": "HOLD",
  "confidence": 0.65,
  "riskLevel": "MEDIUM",
  "timeHorizon": "long-term",
  "thesis": ["string"],
  "opportunities": ["string"],
  "risks": ["string"],
  "portfolioFit": "string",
  "missingDataWarnings": ["string"]
}
```

Recommended recommendation labels:

- `BUY_MORE`
- `HOLD`
- `WATCH`
- `REDUCE`
- `AVOID`
- `NO_ACTION`

These labels are advisory-only and must not map to trade execution.

## Analysis Context Builder

The context builder should gather:

- asset metadata
- latest market price
- price freshness status
- portfolio position if owned
- platform holding summary if owned
- portfolio allocation and base currency context if available
- watchlist item if watched
- investment intent
- target entry price when available
- notes
- missing-data warnings

The context builder must not invent missing market, news, or fundamentals data.

## UI Workflows

### Start analysis from portfolio

The user should be able to start AI analysis for an owned position from the portfolio UI.

### Start analysis from watchlist

The user should be able to start AI analysis for a watchlist item from the watchlist UI.

### Analysis history

The user should be able to view prior analysis runs and their statuses.

### Analysis report detail

The user should be able to open a completed report and see:

- final summary
- recommendation label
- confidence
- risk level
- thesis
- opportunities
- risks
- portfolio fit
- bull and bear summaries
- cost/latency/model metadata
- missing-data warnings

## Error Handling

Phase 2 should handle:

- missing OpenRouter API key
- no configured model for tier
- model provider failure
- invalid structured model output
- missing/stale market data
- missing portfolio context
- conflicting agent outputs
- partial agent failure
- high cost or unexpectedly long latency

A failed analysis run should be persisted with a clear status and error message where possible.

## Cost Controls

Phase 2 should keep costs visible and bounded:

- every model call is recorded in `AiUsageRecord`
- each agent declares a model tier
- analysis runs should surface total model calls, latency, and estimated cost when available
- expensive `strong` calls should be limited to synthesis and final portfolio decision steps

## Testing Plan

Add focused tests for:

- context builder for owned assets
- context builder for watchlist-only assets
- missing price handling
- stale price warnings
- model fallback behavior
- AI usage logging
- structured output validation
- failed analysis persistence
- report repository behavior

Real OpenRouter calls should not be required for automated tests.

## Documentation Updates

During Phase 2 implementation, update:

- `docs/decisions.md` when AI service boundary decisions change
- `docs/architecture/agent-architecture.md` if agent roles or flow change
- `docs/architecture/model-routing.md` if model-tier behavior changes
- feature specs if Phase 2 intentionally moves scope between analysis, forecasts, reports, or learning

## Completion Criteria

Phase 2 is complete when:

- the user can manually run AI analysis for supported assets such as BTC, NVDA, and SPY
- analysis can be started from portfolio or watchlist context
- the system persists analysis runs and reports
- the report separates recommendation, confidence, reasoning, risks, and portfolio fit
- bull and bear reasoning summaries are visible
- missing and stale data are explicitly surfaced
- AI calls are tracked for model, tier, status, latency, and token usage
- real portfolio workflows remain advisory-only
- no Paper Trader or automated monitoring behavior is introduced
- lint, typecheck, tests, and build pass
