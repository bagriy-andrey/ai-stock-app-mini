# 007 - Predictions

## Goal

Create normalized structured forecasts that can be evaluated later.

## User Value

The user can see what the system expects, how confident it is, and what the bull/base/bear scenarios are.

## Scope

- Tactical horizons: 1 day, 7 days, 30 days
- Long-term horizons: 3 months, 6 months, 12 months, 3 years
- Direction, probability, expected return, scenarios, confidence
- Structured prediction storage
- Forecast versioning

## Non-Goals

- Claiming exact long-term future prices
- Outcome evaluation
- Adaptive weighting

## Inputs

- AI analysis outputs
- Current price
- Asset intent
- Market context
- Strategy/model versions

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

## Open Questions

- What probability calibration rules should be enforced initially?
- Which horizons should be enabled first?

## Future Extensions

- Confidence calibration
- Scenario visualization
- Forecast comparison by strategy version

