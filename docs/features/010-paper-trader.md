# 010 - Paper Trader

## Goal

Create an isolated AI Paper Trader that uses virtual money to test whether AI forecasts can be converted into profitable decisions.

## User Value

The user can observe what would happen if the AI followed its own recommendations without risking real capital.

## Scope

- Virtual portfolio
- Virtual cash
- Virtual holdings
- Autonomous mock decisions
- Transaction ledger
- Position sizing
- Risk constraints
- Strategy metrics
- Benchmark comparison

## Non-Goals

- Real brokerage integration
- Real order execution
- Using real portfolio cash
- Reinforcement learning in early phases

## Inputs

- Forecasts
- Recommendations
- Risk data
- Current virtual portfolio
- Virtual cash
- Strategy configuration

## Outputs

- Mock trades
- Virtual holdings
- P&L
- Strategy metrics
- Benchmark comparison

## Core Data / Entities

- PaperPortfolio
- PaperPosition
- PaperTrade
- PaperStrategy
- RiskConstraint
- PaperPerformanceMetric

## Main Flows

- Strategy consumes forecast stream
- Strategy decides whether to open, close, or resize mock position
- Trade is recorded in ledger
- Virtual portfolio and metrics update
- User compares strategy against benchmark

## Edge Cases

- Insufficient virtual cash
- Conflicting signals
- Stop loss or exit trigger
- Missing current price
- Strategy exceeds risk limits

## Dependencies

- Forecast engine
- Market data
- Outcome evaluation
- Portfolio metrics

## Acceptance Criteria

- Paper Trader cannot modify real portfolio
- All mock trades are recorded
- Virtual P&L and benchmark comparison are visible
- Risk limits are enforced

## Open Questions

- What initial strategy should be implemented first?
- Should initial mock portfolio copy the real portfolio at a start date?

## Future Extensions

- Multiple strategies: conservative, balanced, aggressive, momentum, mean reversion, crypto tactical
- Strategy comparison
- Holding period analytics

