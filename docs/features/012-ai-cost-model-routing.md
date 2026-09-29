# 012 - AI Cost and Model Routing

## Goal

Control AI cost and model selection through a configurable OpenRouter-based routing layer.

## User Value

The user can benefit from strong models where useful while keeping spend visible and controlled.

## Scope

- OpenRouter integration
- Logical model tiers: `cheap`, `standard`, `strong`
- Task profiles for scanner triage, event extraction, analysis, forecasting, reflection, translation, learning, and paper-trading decisions
- Model fallback routing
- AI call persistence
- Cost, token, and latency tracking
- Cost dashboard
- Quality-vs-cost comparison in later phases

## Non-Goals

- Hardcoding every agent to a provider-specific model
- Automatic model fine-tuning
- Full optimization before prediction quality data exists

## Inputs

- Agent model tier request
- Model routing config
- OpenRouter response metadata
- Prediction and outcome metrics
- Task type, prompt/template version, and input snapshot where applicable

## Outputs

- Model completion response
- AI usage record
- Cost metrics
- Latency metrics
- Model quality comparisons in later phases

## Core Data / Entities

- ModelTier
- ModelRoute
- ModelFallback
- AiUsageRecord
- ModelQualityMetric

## Main Flows

- Agent requests logical model tier
- Router selects configured primary model
- Router falls back on failure
- Usage is persisted
- Dashboard aggregates spend by month, agent, and model
- Report translation requests use a cost-effective configured model and cache translated output
- Strategy and model experiments are tagged so prediction and paper-trading outcomes can be compared later

## Edge Cases

- Primary model failure
- Provider outage
- Rate limits
- Unexpected cost spike
- Missing token metadata

## Dependencies

- OpenRouter
- AI analysis
- Forecast and outcome records for quality comparison

## Acceptance Criteria

- Agents use model tiers rather than hardcoded providers
- AI usage is persisted with cost and latency
- Fallbacks are supported
- Monthly cost can be summarized
- Translation usage is tracked separately from analysis and forecasting usage
- Prediction and Paper Trader records can be grouped by model, agent, and strategy configuration
- Important AI outputs record provider, model, prompt/template version, timestamp, and available token/cost metadata

## Open Questions

- Which initial models should back each tier?
- What monthly budget guardrails should be enforced?
- Which cost-effective model should be used first for report translation?

## Future Extensions

- Automatic tier recommendations
- Per-agent budget limits
- Quality per dollar ranking
