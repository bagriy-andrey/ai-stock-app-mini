# 007 - Predictions

## Goal

Create normalized structured forecasts that can be evaluated later.

## User Value

The user can see what the system expects, how confident it is, and what the bull/base/bear scenarios are.

## Scope

- Flexible horizons such as 1h, 1d, 3d, 7d, 30d, 90d, and 1y where appropriate
- Direction probability, expected return, expected price where useful, price range, scenarios, and confidence
- Structured prediction storage
- Forecast versioning
- Links to input snapshot, deep-analysis run, market events, and learned patterns used

## Non-Goals

- Claiming exact long-term future prices
- Outcome evaluation
- Adaptive weighting
- TradingAgents deep-analysis reports

## Inputs

- AI analysis outputs
- Current price
- Asset intent
- Market context
- Scanner signals
- Structured market events
- Retrieved historical patterns
- Strategy/model versions
- Input snapshot

## Outputs

- Structured prediction record
- Bear/base/bull cases
- Confidence
- Recommended action
- Reasoning summary

## Core Data / Entities

- Prediction
- ForecastScenario
- ForecastHorizon
- ForecastVersion
- InputSnapshot

## Main Flows

- Analysis produces forecast candidates
- Forecast engine normalizes output
- System persists structured prediction
- Prediction becomes eligible for future resolution

## Edge Cases

- Invalid probabilities
- Missing current price
- Horizon mismatch with asset intent
- Overconfident long-term forecast

## Dependencies

- AI analysis
- Market data
- Data model

## Acceptance Criteria

- Predictions are stored as structured records
- Tactical and long-term horizons are represented distinctly
- Forecast records include enough data for future evaluation
- Forecasts are immutable and never overwritten
- Forecast Engine is separate from TradingAgents / Deep Analysis

## Open Questions

- What probability calibration rules should be enforced initially?
- Which horizons should be enabled first?

## Future Extensions

- Confidence calibration
- Scenario visualization
- Forecast comparison by strategy version
