# Learning Engine

## Principle

Self-learning means measured feedback, durable evidence, retrieval, and calibration. It does not mean unconstrained LLM self-modification, continuous fine-tuning, or automatic code/prompt rewriting.

Use the loop:

```text
prediction
  -> actual outcome
  -> evaluation
  -> historical case / market observation
  -> pattern discovery or update
  -> reflection
  -> learned knowledge
  -> retrieval into future analysis
```

The durable learning layer lives primarily in structured database records, statistics, historical cases, learned patterns, model performance metrics, agent performance metrics, and retrieved lessons.

## Market Learning vs Agent Learning

Market learning asks:

> How does the market historically react under similar conditions?

Example:

```text
guidance cut + high valuation + risk-off regime
  -> historically negative 7-day outcome
```

Agent learning asks:

> Where do our own agents systematically make mistakes?

Example:

```text
BTC 7-day forecasts:
  social sentiment historically overweighted
  funding and open interest underweighted
```

Store these separately. A market pattern can be true even if an agent ignored it. An agent can be biased even when no durable market pattern exists.

## Market Observations

A market observation, also called a historical case, should combine:

- event
- company or asset context
- sector context
- market regime
- macro conditions
- geopolitical conditions
- technical conditions
- sentiment
- positioning or crypto derivatives where relevant
- future outcomes

Outcome horizons may include 1h, 1d, 3d, 7d, 30d, 90d, and 1y where useful. Not every observation needs every horizon. Outcomes should be filled incrementally as time passes.

## Learned Patterns

Learned patterns aggregate historical observations.

Example pattern:

```text
Event: guidance_cut
Conditions: high valuation, 30d momentum above threshold, risk-off market
Observed cases: 126
7d negative outcomes: 69%
Median 7d return: -4.2%
Confidence: 0.78
```

Patterns should store:

- observation count
- first seen
- last seen
- long-term success rate
- recent success rate
- market regime
- confidence
- statistical significance where practical
- data version
- pattern version

Patterns are evidence, not eternal rules. Recent evidence may eventually receive greater weight than stale evidence. The system must also store "no meaningful historical relationship exists" when evidence does not support a signal.

## Outcome Evaluation Layer

After each prediction horizon expires, evaluate:

- direction accuracy
- price error
- absolute error
- scenario hit rate
- confidence calibration
- return
- alpha vs benchmark
- max adverse excursion if useful

Outcome evaluation settles individual predictions. It should not directly and blindly rewrite production behavior.

## Separate Evaluation Domains

Keep at least three categories separate:

- forecast quality: whether price/direction forecasts were useful
- analysis quality: whether TradingAgents/deep-analysis ratings and recommendations were useful
- portfolio decision quality: whether Paper Trader sizing and rebalancing decisions were good

A correct forecast can still produce a bad portfolio decision if sizing is poor. A bad forecast can occasionally make money by luck.

## Agent and Model Performance

Track performance independently by:

- agent
- model
- asset
- asset type
- horizon
- market regime
- prompt/template version
- input snapshot version
- strategy configuration where relevant

Model performance should also track cost, token usage, latency, provider, model, task type, and quality per dollar. Future routing can use these statistics, but MVP routing remains configuration-based.

## Periodic Learning Cycles

### Weekly Learning

Analyze new market events, forecasts, actual outcomes, TradingAgents recommendations, scanner signals, Paper Trader decisions, successful forecasts, and failed forecasts.

Goals:

- identify new short-term patterns
- update existing patterns
- detect obviously weak signals
- generate agent lessons

### Monthly Learning

Analyze weekly results together.

Goals:

- determine whether weekly patterns persist
- remove or discount accidental correlations
- evaluate horizons, signal categories, and models
- detect changes in market behavior

### Quarterly Learning

Goals:

- market regime analysis
- model comparison
- agent performance comparison
- strategy performance
- persistent forecasting biases
- portfolio and Paper Trader behavior
- architecture-level tuning recommendations

### Yearly Learning

Goals:

- long-term pattern validation
- structural market changes
- stale knowledge detection
- strongest and weakest signals
- long-term model and agent performance

Learning outputs should produce versioned evidence, lessons, and weight suggestions that can be validated and traced. They should not blindly rewrite production behavior.

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

Paper Trader learning should consider virtual cash, positions, orders, fills, NAV, realized P&L, unrealized P&L, drawdown, benchmark comparison, and strategy configuration. It must remain separate from the user's real portfolio.
