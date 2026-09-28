# 008 - Outcome Evaluation

## Goal

Resolve completed predictions and measure how accurate and useful they were.

## User Value

The user can see whether the system's previous forecasts were good instead of trusting impressive AI text.

## Scope

- Resolve predictions after horizon expiry
- Compare forecast vs actual
- Calculate direction accuracy
- Calculate price error and absolute error
- Calculate percentage error
- Calculate realized return
- Calculate benchmark return and alpha
- Track scenario hit rate
- Track confidence calibration
- Track maximum adverse excursion and maximum favorable excursion where useful
- Show prediction quality analytics
- Preserve point-in-time correctness for historical evaluation

## Non-Goals

- Adaptive learning implementation
- Paper Trader profitability analysis
- Complex ML retraining
- One universal "accuracy" score for all tasks

## Inputs

- Prediction records
- Actual future prices
- Benchmark prices
- Market regime labels where available

## Outputs

- Resolved prediction
- Error metrics
- Accuracy metrics
- Alpha
- Calibration metrics
- Analytics views
- Market observation outcome updates where applicable

## Core Data / Entities

- PredictionOutcome
- BenchmarkReturn
- PredictionError
- CalibrationMetric
- PredictionEvaluation
- MarketObservation

## Main Flows

- Scheduler identifies expired prediction
- System fetches actual and benchmark prices
- Metrics are calculated
- Prediction is marked resolved
- Related market observations are updated as horizons mature
- Analytics update

## Edge Cases

- Missing actual price
- Market closed on exact horizon date
- Corporate actions
- Crypto 24/7 vs equity trading calendars
- Benchmark unavailable

## Dependencies

- Predictions
- Market data
- Scheduler

## Acceptance Criteria

- Completed predictions are resolved reproducibly
- Outcome metrics are persisted
- User can inspect forecast quality over time
- Evaluation does not use data unavailable at the prediction timestamp
- Forecast quality remains separate from analysis quality and Paper Trader decision quality

## Open Questions

- Which benchmarks should be used by asset type?
- How should non-trading days be handled?

## Future Extensions

- Max adverse excursion
- Market regime performance
- Agent-level attribution
