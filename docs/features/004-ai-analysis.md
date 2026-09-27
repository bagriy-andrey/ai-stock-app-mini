# 004 - AI Analysis

## Goal

Provide manually triggered multi-agent analysis for selected assets.

## User Value

The user can request structured analysis of an asset and see a balanced view rather than a single unchallenged AI opinion.

## Scope

- Integrate or adapt TradingAgents concepts
- Support initial analyst roles
- Include bull/bear debate
- Include risk analysis
- Produce portfolio-aware recommendations
- Support manual analysis for assets such as BTC, NVDA, and SPY

## Non-Goals

- Automated monitoring
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

## Core Data / Entities

- AgentRun
- AnalysisReport
- AgentReasoningSummary
- RiskAssessment
- ModelUsageRecord

## Main Flows

- User requests analysis for an asset
- System collects relevant data
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

## Open Questions

- Should the AI service run as Python FastAPI from the start?
- Which TradingAgents code should be reused vs adapted?

## Future Extensions

- Automated monitoring
- Forecast extraction
- Crypto/on-chain analyst
- Agent performance tracking

