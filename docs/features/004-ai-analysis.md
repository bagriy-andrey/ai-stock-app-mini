# 004 - AI Analysis

## Goal

Provide manually triggered deep multi-agent analysis for selected assets.

## User Value

The user can request structured analysis of an asset and see a balanced view rather than a single unchallenged AI opinion.

## Scope

- Integrate or adapt TradingAgents concepts
- Support initial analyst roles
- Include bull/bear debate
- Include risk analysis
- Produce portfolio-aware recommendations
- Support manual analysis for assets such as BTC, NVDA, and SPY
- Persist input snapshots and agent output metadata

## Non-Goals

- Automated monitoring
- Lightweight scanners and global candidate discovery
- Event detection and market event storage
- Structured forecast engine
- Paper trading
- Dynamic self-learning

## Inputs

- Asset
- Market data
- Fundamentals where available
- News/sentiment where available
- Portfolio context
- Model routing configuration

## Outputs

- Analysis report
- Recommendation summary
- Risk summary
- Reasoning summary
- Optional structured signal scores
- Input snapshot reference

## Core Data / Entities

- AgentRun
- AnalysisReport
- AgentReasoningSummary
- RiskAssessment
- ModelUsageRecord
- InputSnapshot

## Main Flows

- User requests analysis for an asset
- System collects relevant data into an immutable input snapshot
- Analyst agents produce views
- Bull and bear researchers debate
- Research manager synthesizes
- Risk analysts evaluate
- Portfolio manager produces final portfolio-aware output

## Edge Cases

- Missing data
- Model provider failure
- Conflicting agent outputs
- Asset intent unclear
- High AI cost

## Dependencies

- Market data
- Model router
- OpenRouter
- Portfolio and watchlist context

## Acceptance Criteria

- User can manually run analysis for a supported asset
- Output separates reasoning, recommendation, confidence, and risks
- AI calls are tracked for cost and latency
- Analysis consumes application-normalized data and does not become the source of truth for market data
- Analysis reports are not stored as evaluable prediction records

## Open Questions

- Should a separate Python/LangGraph/TradingAgents service be introduced after the TypeScript MVP?
- Which TradingAgents code should be reused vs adapted once the application-owned boundary is proven?

## Future Extensions

- Automated monitoring
- Forecast extraction
- Crypto/on-chain analyst
- Agent performance tracking
