# 011 - Learning Engine

## Goal

Improve decision quality through measured feedback, calibration, and performance tracking.

## User Value

The user can see which signals, agents, models, and strategies actually worked over time.

## Scope

- Market learning
- Agent learning
- Market observations / historical cases
- Learned market patterns
- Agent performance tracking
- Performance by horizon
- Performance by asset and asset type
- Performance by market regime
- Performance by external signal/provider
- Performance by model and strategy configuration
- Dynamic agent weighting
- Confidence calibration
- TradingAgents reflection memory
- Mathematical performance layer
- Weekly, monthly, quarterly, and yearly learning cycles
- Internal learning reports

## Non-Goals

- Unconstrained LLM self-modification
- Model fine-tuning
- Reinforcement learning

## Inputs

- Prediction outcomes
- Agent outputs
- Model usage records
- External signal records and provider provenance
- Market regime labels
- Paper Trader results
- Market events
- Scanner signals
- Market observations

## Outputs

- Agent performance metrics
- Model performance metrics
- Market observations
- Learned patterns
- Agent lessons
- Calibrated weights
- Reflection summaries
- Recommendations for model/agent configuration
- Internal learning reports

## Core Data / Entities

- AgentPerformanceMetric
- ModelPerformanceMetric
- MarketObservation
- LearnedPattern
- AgentLesson
- LearningRun
- SignalPerformanceMetric
- MarketRegime
- SignalWeight
- ReflectionRecord

## Main Flows

- System aggregates resolved predictions
- System updates market observations as horizons mature
- System aggregates observations into learned patterns
- System records when no meaningful relationship exists
- Metrics are grouped by agent, model, asset, horizon, and regime
- Metrics are grouped by provider/signal type when forecasts used external data
- Calibration recommendations are produced
- Weights are updated when rules allow
- Periodic learning runs create versioned internal reports and lessons

## Edge Cases

- Too little data
- Regime misclassification
- Overfitting to recent history
- Survivorship bias
- Data leakage
- Mistaking correlation from a costly provider for durable predictive value

## Dependencies

- Outcome evaluation
- Prediction storage
- AI analysis records
- Market regime detection

## Acceptance Criteria

- System can report agent and model performance
- Weight changes are based on measured outcomes
- Learning process preserves point-in-time correctness
- Market learning and agent learning are stored separately
- Periodic learning outputs are traceable and do not blindly rewrite production behavior

## Open Questions

- What minimum sample size is needed before changing weights?
- How should market regimes be detected initially?
- What evidence is required before adding expensive providers such as Glassnode, CryptoQuant, or Santiment?

## Future Extensions

- Automated model-tier recommendations
- Strategy parameter calibration
- Regime-specific dashboards
