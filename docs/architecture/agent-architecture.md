# Agent Architecture

## TradingAgents Reference

The project should evaluate using or adapting TauricResearch/TradingAgents:

https://github.com/TauricResearch/TradingAgents

The application should not become only a UI wrapper around TradingAgents. TradingAgents can provide or inspire the multi-agent analysis layer, while this application owns portfolio workflows, prediction storage, scheduling, outcome evaluation, paper trading, learning metrics, alerts, and cost tracking.

## Agent Roles to Reuse or Adapt

- Market / Technical Analyst
- Fundamentals Analyst
- Sentiment Analyst
- News Analyst
- Bull Researcher
- Bear Researcher
- Research Manager
- Trader
- Aggressive Risk Analyst
- Neutral Risk Analyst
- Conservative Risk Analyst
- Portfolio Manager

## Potential Custom Agents

- Crypto / On-chain Analyst
- Macro Analyst if separated from News

## Asset Intent Router

Analysis should pass through an intent router before final decisions:

```text
Analysis
  -> Asset Intent Router
    -> LONG_TERM -> Investment Manager
    -> TACTICAL -> Trader / Risk Manager
    -> DISCOVERY -> Opportunity Scorer
```

This prevents the same decision logic from being used for every asset.

## Signal Weighting by Mode

Long-term decisions should place more weight on fundamentals, valuation, macro, and thesis quality.

Tactical decisions should place more weight on technicals, sentiment, news, volatility, derivatives, and crypto on-chain metrics where applicable.

Eventually, weights should be calibrated from historical prediction performance by asset, horizon, market regime, agent, and model.

