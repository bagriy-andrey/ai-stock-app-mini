# Agent Architecture

## Role in the Product

Agent architecture covers deep reasoning for selected assets and portfolio questions. It does not cover the whole product. Scanning, event detection, market memory, forecasts, portfolio state, paper execution, reports, scheduling, and learning persistence are application-owned responsibilities.

## TradingAgents Reference

The project should evaluate using or adapting TauricResearch/TradingAgents:

https://github.com/TauricResearch/TradingAgents

The application should not become only a UI wrapper around TradingAgents. TradingAgents can provide or inspire the Deep Analysis Engine, while this application owns portfolio workflows, watchlists, scanners, events, market memory, prediction storage, scheduling, outcome evaluation, paper trading, learning metrics, alerts, and cost tracking.

## Deep Analysis Boundary

TradingAgents or adapted agents should answer:

- what is happening
- why it matters
- the bull case
- the bear case
- key uncertainties and risks
- portfolio fit
- investment stance such as Buy, Overweight, Hold, Underweight, or Sell

TradingAgents should not own:

- continuous monitoring of hundreds of assets
- the configured discovery universe
- scanner rules or candidate ranking
- the structured event database
- Market Intelligence Memory or learned market patterns
- immutable forecast records
- real portfolio execution
- Paper Trader execution
- application reports
- global scheduler orchestration

Deep analysis should consume normalized snapshots supplied by the application instead of independently becoming the source of truth for market data.

## Agent Roles to Reuse or Adapt

- Market / Technical Analyst
- Fundamentals Analyst
- Sentiment Analyst
- News Analyst
- Bull Researcher
- Bear Researcher
- Research Manager
- Trader
- Aggressive Risk Analyst
- Neutral Risk Analyst
- Conservative Risk Analyst
- Portfolio Manager

## Potential Custom Agents

- Crypto / On-chain Analyst
- Macro Analyst if separated from News

## Asset Intent Router

Analysis should pass through an intent router before final decisions:

```text
Analysis
  -> Asset Intent Router
    -> LONG_TERM -> Investment Manager
    -> TACTICAL -> Trader / Risk Manager
    -> DISCOVERY -> Opportunity Scorer
```

This prevents the same decision logic from being used for every asset.

## Analysis Inputs

Each deep-analysis run should receive an immutable input snapshot, including the asset, selected intent, latest price and freshness, portfolio/watchlist context, relevant scanner signals, structured market events, retrieved historical patterns as known at that time, provider provenance, and missing-data warnings.

The agents must clearly state when data is missing, stale, manually entered, or outside the current provider coverage.

## Output Persistence

Important agent outputs should record:

- agent identity
- role
- model tier
- provider and model
- prompt/template version
- timestamp
- input snapshot id
- token/cost/latency metadata when available
- structured stance, confidence, risk level, and summary

Analysis reports may include directional opinions and scenarios, but they are not immutable prediction records. Only the Forecast Engine creates forecasts eligible for outcome evaluation.

## Signal Weighting by Mode

Long-term decisions should place more weight on fundamentals, valuation, macro, and thesis quality.

Tactical decisions should place more weight on technicals, sentiment, news, volatility, derivatives, and crypto on-chain metrics where applicable.

Eventually, weights should be calibrated from historical prediction performance by asset, horizon, market regime, agent, and model.

## Implementation Path

The current Phase 2 plan remains valid: implement application-owned TypeScript agents inspired by TradingAgents inside the Next.js app first. A separate Python/LangGraph/TradingAgents service can be introduced later if orchestration complexity, latency, or dependency requirements justify it.
