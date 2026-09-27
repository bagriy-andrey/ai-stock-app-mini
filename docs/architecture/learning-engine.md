# Learning Engine

## Principle

Self-learning should mean measured feedback and calibration, not unconstrained LLM self-modification.

Use the loop:

```text
prediction
  -> actual outcome
  -> evaluation
  -> reflection
  -> performance metrics
  -> calibrated weights
```

## Outcome Evaluation

After each prediction horizon expires, evaluate:

- direction accuracy
- price error
- absolute error
- scenario hit rate
- confidence calibration
- return
- alpha vs benchmark
- max adverse excursion if useful

## Agent Performance

Track performance independently by:

- agent
- model
- asset
- asset type
- horizon
- market regime

## Adaptive Weighting

Eventually learn signal weights from historical prediction performance. For example, BTC 7-day risk-on may weight technical, on-chain, macro, and sentiment signals differently from MSFT 12-month analysis.

## Market Regimes

The system should eventually distinguish regimes such as:

- risk-on
- risk-off
- high volatility
- low volatility
- tightening liquidity
- easing liquidity
- bull market
- bear market
- crypto-specific regimes

## Paper Trader Learning

Prediction accuracy and trading profitability are different problems.

Evaluate both:

- Were predictions correct?
- Did the trading strategy convert predictions into profitable decisions?

