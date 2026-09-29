# 010 - Paper Trader

## Goal

Create an isolated AI Paper Trader that uses virtual money to test whether AI forecasts can be converted into profitable decisions.

## User Value

The user can observe what would happen if the AI followed its own recommendations without risking real capital.

## Scope

- Virtual portfolio
- Virtual cash
- Virtual holdings
- Virtual orders and fills
- NAV history
- Autonomous mock decisions
- Transaction ledger
- Position sizing
- Risk constraints
- Strategy metrics
- Benchmark comparison
- Multiple paper strategies running in parallel
- Comparison by agent, model, strategy, horizon, and asset type

## Non-Goals

- Real brokerage integration
- Real order execution
- Using real portfolio cash
- Reinforcement learning in early phases
- Using virtual trading results as proof that real trades should be executed automatically

## Inputs

- Forecasts
- Recommendations
- Risk data
- Pattern Engine evidence
- Opportunity Scanner candidates
- Current virtual portfolio
- Virtual cash
- Strategy configuration

## Outputs

- Mock trades
- Virtual holdings
- Virtual orders and fills
- NAV
- P&L
- Drawdown
- Strategy metrics
- Benchmark comparison

## Core Data / Entities

- PaperPortfolio
- PaperPosition
- PaperOrder
- PaperTrade
- PaperStrategy
- RiskConstraint
- PaperPerformanceMetric
- PaperStrategyRun
- PaperModelAssignment

## Main Flows

- Strategy consumes forecast stream
- Strategy decides whether to open, close, or resize mock position
- Order and fill are recorded in ledger
- Virtual portfolio and metrics update
- User compares strategy against benchmark
- Multiple strategies consume the same forecast stream independently
- User compares performance across strategies, agents, and model configurations

## Edge Cases

- Insufficient virtual cash
- Conflicting signals
- Stop loss or exit trigger
- Missing current price
- Strategy exceeds risk limits
- Two strategies using the same forecast but different models produce conflicting trades
- Strategy overfits to a short history of predictions

## Dependencies

- Forecast engine
- Market data
- Outcome evaluation
- Portfolio metrics
- Model routing and AI usage records

## Acceptance Criteria

- Paper Trader cannot modify real portfolio
- All mock trades are recorded
- Paper cash, positions, orders, fills, and NAV are stored separately from real portfolio state
- Virtual P&L and benchmark comparison are visible
- Risk limits are enforced
- Paper strategies can be evaluated independently
- Performance can be compared by model, agent, and strategy configuration
- Paper decision quality is evaluated separately from forecast quality and deep-analysis quality

## Open Questions

- What initial strategy should be implemented first?
- Should initial mock portfolio copy the real portfolio at a start date?

## Future Extensions

- Multiple strategies: conservative, balanced, aggressive, momentum, mean reversion, crypto tactical
- Strategy comparison
- Holding period analytics
