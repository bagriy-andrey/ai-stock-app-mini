# Product Vision

Build a small personal web application that acts as an AI investment assistant.

The application is primarily intended for long-term investing and portfolio monitoring. It should also identify tactical or speculative opportunities when attractive setups appear, especially for assets such as Bitcoin, Ethereum, selected stocks, and other high-conviction assets.

The product should become a personal AI investment intelligence system that:

- monitors the user's portfolio
- continuously monitors a watchlist and runs deeper analysis only when useful
- scans a broader market universe
- identifies interesting investment opportunities
- produces structured forecasts and recommendations
- measures whether previous analyses were useful
- improves its decision process through outcome evaluation

The system must not automatically trade the user's real portfolio. Autonomous trading belongs only in the isolated AI Paper Trader using virtual/mock money.

The application is intended for personal self-hosted use. It should support Russian and English UI language switching. AI reports should be stored in their original generated language, with on-demand translated views generated through OpenRouter and cached for later reuse.

## Main Product Modes

### Long-Term Investing

The primary mode. It monitors the real portfolio, evaluates portfolio health, recommends accumulation or rebalancing, and identifies deteriorating investment theses.

It should prioritize fundamentals, valuation, macroeconomic environment, earnings growth, free cash flow, balance sheet strength, long-term trends, diversification, sector exposure, concentration risk, expected long-term return ranges, and thesis quality.

### Tactical / Speculation

The secondary mode. It identifies short- and medium-term opportunities, especially in crypto and volatile assets.

It should prioritize technical indicators, momentum, volatility, sentiment, derivatives data, funding rates, open interest, liquidations, short-term news, market positioning, and on-chain metrics for crypto.

### Opportunity Discovery

The discovery mode. It scans assets outside the user's current portfolio and watchlist to surface potentially interesting long-term or tactical opportunities.

Discovery should start with a configured universe rather than attempting to collect and analyze every possible market asset. The universe can expand as data providers, cost controls, and outcome evaluation mature.
