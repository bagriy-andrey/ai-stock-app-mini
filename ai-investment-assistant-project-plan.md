# AI Investment Assistant - Project Plan & Codex Handoff

> Historical handoff note: this document preserves earlier project planning context. The current source of truth is the reconciled documentation under `docs/`, especially `docs/architecture/system-architecture.md`, `docs/architecture-audit-2026-09-28.md`, `docs/roadmap.md`, and the feature specs. If this handoff conflicts with those files, follow the reconciled docs.

## 1. Project vision

Build a small personal web application that acts as an AI investment assistant.

The application is primarily intended for long-term investing and portfolio monitoring, with optional tactical/speculative opportunities when attractive setups appear.

The user's main investment strategy is long-term diversified ETF investing, for example S&P 500-type ETFs.

The user is not planning to become an active trader. However, the system should identify situations where short-term or medium-term speculation may be attractive, especially for assets such as Bitcoin, Ethereum, selected stocks, or other high-conviction opportunities.

The product should therefore be designed as:

> A personal AI investment intelligence system that monitors the user's portfolio, continuously analyzes a watchlist and the broader market, identifies interesting investment opportunities, produces forecasts and recommendations, and learns from the outcomes of its previous analyses.

The system should not automatically trade the user's real portfolio.

Any autonomous trading must exist only inside an isolated AI Paper Trader using virtual/mock money.

---

## 2. Core product principles

### 2.1 Long-term investing first

The system should treat long-term investing as the primary strategy.

Typical long-term assets:

- S&P 500 ETFs
- broad-market ETFs
- sector ETFs
- quality stocks
- other diversified investments

For long-term assets, the system should focus more on:

- fundamentals
- valuation
- macroeconomic environment
- earnings growth
- free cash flow
- balance sheet strength
- long-term trends
- portfolio diversification
- sector exposure
- concentration risk
- expected long-term return ranges
- investment thesis quality

It should not overreact to short-term price noise.

### 2.2 Tactical/speculative opportunities are secondary

The system should separately detect tactical opportunities.

Examples:

- Bitcoin
- Ethereum
- crypto market setups
- oversold stocks
- momentum opportunities
- event-driven opportunities
- strong technical setups

For tactical assets, analysis should place more weight on:

- technical indicators
- momentum
- volatility
- sentiment
- derivatives data
- funding rates
- open interest
- liquidations
- short-term news
- market positioning
- on-chain metrics for crypto

### 2.3 Advisory only for the real portfolio

The real portfolio must be read-only from the AI execution point of view.

The system may:

- analyze
- recommend
- warn
- suggest buys
- suggest sells
- suggest rebalancing
- suggest reducing risk

But it must not execute real orders automatically.

### 2.4 Paper Trader is fully isolated

The AI Paper Trader is a separate experimental feature.

It may:

- use virtual money
- make autonomous mock trades
- manage its own mock portfolio
- rebalance
- open and close virtual positions
- follow the AI system's forecasts

It must never modify the user's real portfolio.

---

# 3. Main product areas

The application should contain three main decision modes.

## 3.1 Long-Term Investing

Purpose:

- monitor the real investment portfolio
- evaluate portfolio health
- evaluate long-term opportunities
- recommend accumulation/rebalancing
- identify deteriorating investment theses

Example output:

```text
VWCE
Role: Core holding

Long-term view: Positive
Valuation: Neutral
Risk: Low/Medium

Current allocation: 28%
Target range: 25-35%

Action:
Continue regular accumulation

Reason:
No material deterioration in long-term thesis.
```

## 3.2 Tactical / Speculation

Purpose:

- identify short/medium-term opportunities
- especially crypto and volatile assets
- produce entry/exit scenarios
- suggest risk levels

Example:

```text
BTC
Role: Tactical

7d outlook: Bullish
30d outlook: Neutral/Bullish

Confidence: 71%

Interesting entry zone:
$61k-$64k

Risk:
High
```

## 3.3 Opportunity Scanner

Purpose:

Discover potentially interesting assets that the user does not currently own.

The system should scan:

- user watchlist
- market universe
- selected indexes
- selected ETFs
- selected stock universes
- selected crypto universe

Example:

```text
New Opportunity

GOOGL

Not in portfolio
Not in watchlist

Why surfaced:
- valuation below historical average
- earnings estimates improving
- strong free cash flow
- recent drawdown
- improving sector momentum

Suggested action:
Add to watchlist
```

---

# 4. Asset lifecycle

Assets may have states such as:

```text
DISCOVERED
WATCHING
INTERESTING
ENTRY_OPPORTUNITY
OWNED
AVOID
```

This allows the system to gradually move assets from discovery to deeper monitoring.

---

# 5. Portfolio and watchlist

## 5.1 Real portfolio

The user should be able to store:

- asset
- ticker/symbol
- asset type
- quantity
- average purchase price
- current value
- currency
- portfolio weight
- realized/unrealized P&L
- optional notes
- investment intent: long-term / tactical

Also store:

- cash balance
- base currency
- sector exposure
- geographic exposure
- currency exposure

## 5.2 Watchlist

The user should be able to maintain a watchlist of:

- stocks
- ETFs
- crypto

The system should continuously scan the watchlist.

The watchlist is not the same as owned positions.

## 5.3 Discovery universe

The system should also maintain a broader market universe outside the watchlist.

Examples:

- S&P 500
- Nasdaq 100
- selected European indexes
- selected ETF catalogs
- selected crypto assets
- sector-specific universes

This universe is used by the Opportunity Scanner.

---

# 6. Multi-agent AI architecture

Use TradingAgents by TauricResearch as either:

1. an underlying Python analysis engine,
2. a fork,
3. or a strong architectural reference.

Repository:

https://github.com/TauricResearch/TradingAgents

The preferred approach is hybrid:

- reuse/adapt TradingAgents for multi-agent financial analysis
- build the application, portfolio, prediction storage, scheduler, learning engine, opportunity scanner, and paper trading independently around it

---

# 7. TradingAgents concepts to reuse

The TradingAgents architecture already contains useful roles.

## 7.1 Analyst Team

Reuse/adapt:

- Market / Technical Analyst
- Fundamentals Analyst
- Sentiment Analyst
- News Analyst

Potential custom addition:

- Crypto / On-chain Analyst
- Macro Analyst if separated from News

## 7.2 Bull / Bear Research Debate

Reuse the concept of:

- Bull Researcher
- Bear Researcher
- Research Manager

The agents should critique one another instead of producing a single unchallenged opinion.

## 7.3 Trader

TradingAgents Trader currently turns research into:

- Buy
- Hold
- Sell
- entry price
- stop loss
- position sizing

In this project, Trader should mainly be relevant to the tactical decision path and the AI Paper Trader.

## 7.4 Risk debate

Reuse/adapt:

- Aggressive Risk Analyst
- Neutral Risk Analyst
- Conservative Risk Analyst

## 7.5 Portfolio Manager

Reuse as the final portfolio-aware decision layer.

The Portfolio Manager should understand:

- user's current holdings
- cash
- sector exposure
- concentration
- tactical vs long-term intent
- portfolio risk

---

# 8. Asset Intent Router

Add a routing layer before the final decision.

```text
Analysis
   ↓
Asset Intent Router
   │
   ├── LONG_TERM
   │      ↓
   │   Investment Manager
   │
   ├── TACTICAL
   │      ↓
   │   Trader / Risk Manager
   │
   └── DISCOVERY
          ↓
       Opportunity Scorer
```

This prevents the same decision logic from being used for every asset.

---

# 9. Suggested agent weighting by mode

Example:

| Agent / Signal | Long-term | Tactical |
|---|---:|---:|
| Fundamentals | High | Low |
| Valuation | High | Low |
| Macro | High | Medium |
| Technical | Low | High |
| Sentiment | Low | High |
| News | Medium | High |
| On-chain | Medium | High for crypto |
| Derivatives | Low | High for crypto |

The system should eventually learn these weights dynamically.

---

# 10. Crypto-specific analysis

The default TradingAgents crypto support is not enough for the final version.

Add a Crypto / On-chain Analyst.

Potential data:

- funding rates
- open interest
- liquidations
- long/short ratio
- exchange inflows/outflows
- whale activity
- ETF flows
- stablecoin liquidity
- MVRV
- realized cap
- on-chain activity
- market dominance
- derivatives positioning

This agent should be especially important for BTC and ETH.

---

# 11. Forecast Engine

Analysis and forecasting should be separated.

The system should not only produce prose such as:

```text
Buy
Price target: 215
Time horizon: 3-6 months
```

It should also create structured forecasts.

Example:

```json
{
  "ticker": "NVDA",
  "timestamp": "...",
  "horizon": "7d",
  "currentPrice": 185.4,
  "direction": "UP",
  "directionProbability": 0.68,
  "bearCase": {
    "price": 171,
    "probability": 0.18
  },
  "baseCase": {
    "price": 193,
    "probability": 0.57
  },
  "bullCase": {
    "price": 210,
    "probability": 0.25
  },
  "confidence": 0.71
}
```

---

# 12. Forecast horizons

## 12.1 Tactical

Possible horizons:

- 1 day
- 7 days
- 30 days

Focus on:

- direction
- probability
- expected return
- price scenarios
- volatility
- entry/exit conditions

## 12.2 Long-term

Possible horizons:

- 3 months
- 6 months
- 12 months
- 3 years

Avoid pretending to know an exact future price several years ahead.

Prefer:

- expected return range
- upside/downside scenarios
- valuation ranges
- thesis confidence
- macro/fundamental risks

---

# 13. Prediction history

Every prediction should be persisted.

Recommended fields:

```text
prediction_id
asset
asset_type
timestamp
price_at_prediction
time_horizon

technical_score
fundamental_score
macro_score
sentiment_score
onchain_score

prediction_direction
direction_probability

bear_price
bear_probability

base_price
base_probability

bull_price
bull_probability

confidence

recommended_action

agent_reasoning_summary
market_conditions

strategy_version
model_version

actual_price
actual_return
benchmark_return
alpha
prediction_error
resolved_at
```

---

# 14. Outcome evaluation

After each prediction horizon expires, evaluate it.

Example:

```text
Prediction date:
26.09.2026

BTC 7d forecast

Direction:
UP

Confidence:
67%

Expected scenario:
62k-72k
```

After 7 days:

```text
Actual:
73.4k

Actual return:
+10.7%

Prediction direction:
Correct
```

Evaluation should include:

- direction accuracy
- price error
- absolute error
- scenario hit rate
- confidence calibration
- return
- alpha vs benchmark
- max adverse excursion if useful

---

# 15. Self-learning / adaptive system

Do not implement "self-learning" as unconstrained LLM self-modification.

Use a measured feedback loop:

```text
Prediction
   ↓
Outcome
   ↓
Evaluation
   ↓
Reflection
   ↓
Performance metrics
   ↓
Weight calibration
```

TradingAgents already implements part of this using:

- decision log
- realized return
- alpha
- reflection
- injection of previous lessons

Keep that concept.

Add a mathematical layer.

---

# 16. Agent performance tracking

Measure performance independently for each agent.

Example:

```text
Technical Agent
BTC 7d direction accuracy: 67%

Macro Agent
BTC 30d direction accuracy: 69%

On-chain Agent
BTC 30d direction accuracy: 73%
```

Track by:

- asset
- asset type
- horizon
- market regime
- agent
- model

---

# 17. Adaptive weighting

Eventually calculate weights such as:

```text
BTC / 7d / risk-on

Technical     0.30
On-chain      0.30
Macro         0.15
Sentiment     0.25
```

Versus:

```text
MSFT / 12m

Fundamental   0.40
Macro         0.30
News          0.15
Technical     0.05
Sentiment     0.10
```

The weights should be learned from historical prediction performance.

---

# 18. Market regime detection

The learning system should eventually distinguish regimes such as:

- risk-on
- risk-off
- high volatility
- low volatility
- tightening liquidity
- easing liquidity
- bull market
- bear market
- crypto-specific regimes

Agent performance should be tracked separately by regime.

---

# 19. AI Paper Trader

Paper Trader is a separate feature.

It should not create its own raw market analysis from scratch.

It consumes:

- forecasts
- recommendations
- risk data
- current virtual portfolio
- available virtual cash

Then it autonomously decides mock trades.

Example:

```text
BTC
7d expected return: +8%
confidence: 74%
risk: medium

Paper Trader:
BUY 5% allocation
```

---

# 20. Paper Trader portfolio

The Paper Trader should have:

- starting virtual capital
- virtual cash
- virtual holdings
- average entry price
- P&L
- transaction history
- portfolio exposure
- risk constraints

The initial mock portfolio may optionally be copied from the user's real portfolio at a specific start date.

After that, real and paper portfolios diverge.

---

# 21. Paper Trader metrics

Track:

- return
- benchmark return
- alpha
- max drawdown
- volatility
- win rate
- average win
- average loss
- profit factor
- Sharpe ratio
- number of trades
- average holding period
- turnover
- best trade
- worst trade

---

# 22. Multiple Paper Trader strategies

Architecture should allow more than one strategy later.

Examples:

```text
Conservative
Balanced
Aggressive
Momentum
Mean Reversion
Crypto Tactical
```

All strategies may consume the same forecast stream but use different:

- thresholds
- position sizes
- risk limits
- holding periods
- exit rules

---

# 23. Learning from Paper Trader

Prediction accuracy and trading profitability are different problems.

The system should evaluate both:

```text
LEVEL 1
Were predictions correct?

LEVEL 2
Did the trading strategy convert those predictions into profitable decisions?
```

This should allow improvement of:

- agent weights
- confidence thresholds
- entry conditions
- exit conditions
- position sizing
- risk limits

---

# 24. OpenRouter

Use OpenRouter as the primary LLM gateway.

Goals:

- access multiple model providers through one API
- avoid being locked to one provider
- optimize cost
- use stronger models only where necessary
- support fallback models
- compare model quality

---

# 25. Model tiers

Do not hardcode every agent directly to a specific model.

Define model tiers.

Example:

```text
cheap
standard
strong
```

Agents should request a tier.

Example:

```yaml
models:
  cheap:
    primary: some-fast-low-cost-model

  standard:
    primary: some-balanced-model

  strong:
    primary: some-high-reasoning-model
```

This allows model replacement without changing agent code.

---

# 26. Suggested model allocation

Initial concept:

```text
Market Analyst          cheap
Sentiment Analyst       cheap
News Analyst            cheap
Fundamentals Analyst    cheap/standard

Bull Researcher         standard
Bear Researcher         standard

Research Manager        strong

Trader                  standard

Aggressive Risk         standard
Neutral Risk            standard
Conservative Risk       standard

Portfolio Manager       strong

Forecast Engine         strong

Reflection              cheap/standard
```

The exact models should remain configurable.

---

# 27. Model fallback

Support fallbacks.

Example:

```text
Portfolio Manager

Primary strong model
   ↓ failure
Fallback strong model
   ↓ failure
Fallback standard model
```

Different providers may be routed through OpenRouter.

---

# 28. AI cost tracking

Persist every AI call.

Recommended fields:

```text
agent_run_id
agent
ticker
model
model_tier

input_tokens
output_tokens

cost
latency

timestamp
status
```

Dashboard should eventually show:

```text
AI Usage

This month: $12.84

Technical:   $1.20
News:        $2.45
Research:    $3.10
Portfolio:   $5.02
Reflection:  $1.07
```

---

# 29. Model quality / cost optimization

Eventually track:

```text
agent
model
asset_type
horizon
market_regime

cost
latency
prediction_accuracy
alpha
```

Then compare quality per dollar.

The system may eventually learn which model tier is worth using for each role.

---

# 30. Scheduler / monitoring

The system should continuously analyze assets with configurable intervals.

Example initial cadence:

```text
Crypto prices          5 min
Stock prices           5-15 min

Technical analysis     15 min
Crypto derivatives     15 min

News                   10-15 min
Sentiment              30 min

Macro                   1 hour
Fundamentals            1 day

Portfolio analysis      1 hour

Full report             morning + evening

Critical alerts         event-based
```

These values must be configurable.

Avoid unnecessarily running expensive LLM analysis if the underlying data has not materially changed.

---

# 31. Reports and alerts

The app should produce:

- morning brief
- evening brief
- portfolio alerts
- watchlist alerts
- opportunity alerts
- critical market alerts
- changed-thesis alerts

Example:

```text
BTC dropped 5.2% in 35 minutes
Liquidations increased significantly
Funding turned negative
Support zone approaching
```

Possible delivery:

- web dashboard
- Telegram
- later other channels if needed

---

# 32. Main UI screens

Potential screens:

## Dashboard

Show:

- total portfolio value
- daily change
- cash
- long-term allocation
- tactical allocation
- risk level
- important alerts
- top opportunities

## Portfolio

Show:

- holdings
- allocation
- P&L
- sector exposure
- risk
- AI assessment

## Watchlist

Show:

- monitored assets
- current AI view
- changed outlook
- confidence
- important catalysts

## Opportunities

Show discovered assets outside the portfolio.

Example fields:

- asset
- opportunity type
- horizon
- expected upside
- downside
- confidence
- reasons
- risks
- discovery date

## Predictions

Show:

- prediction history
- forecast vs actual
- accuracy
- confidence calibration

## Reports

Show:

- daily reports
- asset reports
- macro reports
- portfolio reports

## Paper Trader

Show:

- virtual portfolio
- trade history
- P&L
- strategy metrics
- benchmark comparison

## AI Usage

Show:

- token usage
- model usage
- agent cost
- cost by model
- monthly spend

---

# 33. High-level system architecture

```text
┌────────────────────────────────────────────┐
│                Web App                     │
│                                            │
│ Dashboard / Portfolio / Watchlist          │
│ Predictions / Reports / Paper Trading      │
└────────────────────┬───────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────┐
│              Application API               │
│                                            │
│ Portfolio Service                          │
│ Prediction Service                         │
│ Alert Service                              │
│ Paper Trading Service                      │
│ Opportunity Service                        │
└────────────────────┬───────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────┐
│         AI Analysis Service (Python)       │
│                                            │
│ TradingAgents / LangGraph                  │
│                                            │
│ Technical Analyst                          │
│ Fundamental Analyst                        │
│ Sentiment Analyst                          │
│ News/Macro Analyst                         │
│ Crypto/On-chain Analyst                    │
│                                            │
│ Bull ↔ Bear Debate                         │
│ Research Manager                           │
│ Trader                                     │
│ Risk Debate                                │
│ Portfolio Manager                          │
└────────────────────┬───────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────┐
│             Forecast Engine                │
│                                            │
│ 1d / 7d / 30d                              │
│ 3m / 6m / 12m                              │
│ scenarios + probabilities                  │
│ confidence                                 │
└────────────────────┬───────────────────────┘
                     │
         ┌───────────┴────────────┐
         ▼                        ▼
 Prediction Store           Paper Trader
         │                        │
         ▼                        ▼
 Outcome Evaluator          Mock Portfolio
         │                        │
         └───────────┬────────────┘
                     ▼
             Learning Engine
```

---

# 34. Suggested technical stack

Initial proposal:

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Backend / application API

Possible options:

- Next.js API routes for the first MVP
- or NestJS if a separate application backend is preferred

## AI service

- Python
- FastAPI
- TradingAgents
- LangGraph

## Database

- PostgreSQL

Possible extension:

- TimescaleDB for time-series workloads

## Background jobs

Possible options:

- Redis
- BullMQ for Node-side jobs
- Celery/RQ/other Python worker solution if preferred

Do not lock the architecture prematurely. Codex should document the chosen approach and trade-offs.

## Charts

- TradingView Lightweight Charts or another suitable financial chart library

## LLM gateway

- OpenRouter

## Notifications

- Telegram Bot first

---

# 35. Important data integrity principles

Financial backtesting is extremely sensitive to data leakage.

The system must preserve point-in-time correctness.

Never use data that was not available at the timestamp being simulated.

Examples:

- earnings filed later
- revised fundamentals
- future news
- future macro releases
- future outcomes from prediction memory

TradingAgents already contains point-in-time/backtesting protections. Preserve these concepts.

---

# 36. Versioning

Persist versions for reproducibility.

Examples:

```text
strategy_version
agent_prompt_version
model_version
forecast_version
data_provider_version
```

This allows comparisons such as:

```text
Strategy v1.8
vs
Strategy v1.3
```

---

# 37. MVP development roadmap

## Phase 0 - Foundation

Goal:

Create the base project and architecture.

Features:

- repository structure
- frontend skeleton
- backend skeleton
- database
- environment configuration
- OpenRouter integration
- model router abstraction
- job scheduler foundation
- logging
- basic application configuration

No advanced AI features required yet.

---

## Phase 1 - Portfolio & Watchlist

Features:

- manually add portfolio positions
- edit/remove positions
- cash balance
- watchlist CRUD
- asset types: stock / ETF / crypto
- basic market prices
- portfolio value
- P&L
- allocation

This phase should work without AI.

---

## Phase 2 - AI Market Intelligence

Integrate TradingAgents or adapted architecture.

Initial agents:

- Technical Analyst
- Fundamentals Analyst
- Sentiment Analyst
- News/Macro Analyst
- Bull Researcher
- Bear Researcher
- Research Manager
- Risk Analysts
- Portfolio Manager

Initial use:

```text
Analyze BTC
Analyze NVDA
Analyze SPY
```

Manually triggered analysis is sufficient initially.

---

## Phase 3 - Automated Monitoring

Add scheduler.

Automatically analyze:

- owned assets
- watchlist assets

Add:

- persisted AI reports
- changed-outlook detection
- portfolio alerts
- morning/evening reports
- Telegram notifications

---

## Phase 4 - Opportunity Scanner

Add discovery universe.

Features:

- scan assets outside portfolio
- calculate opportunity score
- identify long-term opportunities
- identify tactical opportunities
- allow "add to watchlist"

This is one of the most important features.

---

## Phase 5 - Forecast Engine

Create normalized predictions.

Features:

- tactical horizons
- long-term horizons
- scenarios
- probabilities
- confidence
- structured prediction storage
- forecast versioning

---

## Phase 6 - Outcome Evaluation

Features:

- resolve completed predictions
- compare forecast vs actual
- calculate accuracy
- calculate error
- calculate benchmark return
- calculate alpha
- confidence calibration

Create analytics screens for prediction quality.

---

## Phase 7 - AI Paper Trader

Features:

- virtual portfolio
- virtual cash
- autonomous mock decisions
- transaction ledger
- position sizing
- risk constraints
- performance metrics
- benchmark comparison

Real portfolio remains isolated.

---

## Phase 8 - Adaptive Learning

Features:

- agent performance
- performance by horizon
- performance by asset
- performance by market regime
- dynamic agent weighting
- confidence calibration
- TradingAgents reflection memory
- mathematical performance layer

---

## Phase 9 - Model Optimization

Features:

- OpenRouter model experiments
- quality vs cost comparison
- automatic model-tier recommendations
- cost budgets
- fallback routing
- model performance tracking

---

# 38. Recommended repository documentation structure

Create:

```text
/docs
  /product
    product-vision.md
    user-goals.md
    scope.md

  /architecture
    system-architecture.md
    agent-architecture.md
    model-routing.md
    data-model.md
    scheduling.md
    learning-engine.md

  /features
    001-portfolio.md
    002-watchlist.md
    003-market-data.md
    004-ai-analysis.md
    005-automated-monitoring.md
    006-opportunity-scanner.md
    007-predictions.md
    008-outcome-evaluation.md
    009-reports-alerts.md
    010-paper-trader.md
    011-learning-engine.md
    012-ai-cost-model-routing.md

  /plans
    # implementation plans will be added here later

  roadmap.md
  decisions.md

AGENTS.md
README.md
```

---

# 39. AGENTS.md purpose

AGENTS.md should act as persistent project context for Codex.

It should contain only durable, high-level rules and architecture principles.

It should not become a huge copy of all specs.

Recommended contents:

```text
Project: Personal AI Investment Assistant

Primary strategy:
Long-term diversified investing.

Secondary strategy:
Occasional tactical/speculative opportunities.

Core capabilities:
- portfolio tracking
- watchlist monitoring
- market discovery
- multi-agent analysis
- forecasts
- reports and alerts
- prediction evaluation
- paper trading
- adaptive learning

TradingAgents:
Use/adapt TauricResearch/TradingAgents as the reference or underlying multi-agent framework.

LLM:
Use OpenRouter through a model-routing abstraction.

Important:
- Real portfolio is advisory only.
- Paper Trader is isolated.
- Preserve point-in-time correctness.
- Persist predictions and outcomes.
- Keep architecture modular.
- Prefer structured outputs.
- Avoid over-engineering early MVP phases.
```

---

# 40. Recommended development workflow with Codex

Use separate stages.

```text
SPEC
 ↓
IMPLEMENTATION PLAN
 ↓
IMPLEMENT
 ↓
REVIEW
```

Recommended workflow for every feature:

1. Select one feature spec.
2. Ask Codex to inspect the repository.
3. Ask Codex to create an implementation plan.
4. Review the plan.
5. Implement only that feature.
6. Run tests.
7. Review architecture impact.
8. Update documentation and decisions if needed.

Example:

```text
/docs/features/006-opportunity-scanner.md
```

produces:

```text
/docs/plans/006-opportunity-scanner-plan.md
```

Then an implementation session receives:

- AGENTS.md
- architecture docs
- feature spec
- implementation plan

This keeps context focused.

---

# 41. Product scope boundaries

Do not build these too early:

- real brokerage trading execution
- highly complex ML pipelines
- reinforcement learning
- model fine-tuning
- microservice explosion
- multiple notification platforms
- hundreds of data providers
- high-frequency trading
- minute-by-minute LLM calls for every asset

Start simple and measurable.

---

# 42. Main success criteria

The system is useful if it can answer:

### Portfolio

- What do I currently own?
- Is my portfolio too concentrated?
- What risks are increasing?
- Should I continue accumulating core ETFs?

### Watchlist

- Has something materially changed?
- Is there an attractive entry?
- Is the thesis improving or deteriorating?

### Discovery

- What interesting assets am I currently missing?
- Why did the system surface them?

### Forecasts

- What does the system expect?
- How confident is it?
- What are the bull/base/bear cases?

### Learning

- Were previous forecasts actually good?
- Which agents are useful?
- Which models are worth their cost?
- Which signals work for which horizon?

### Paper Trader

- If the AI followed its own recommendations, what would happen?
- Does it outperform benchmarks?
- Is the extra return worth the drawdown?

---

# 43. Important design philosophy

Do not optimize for impressive AI text.

Optimize for:

- measurable predictions
- reproducibility
- structured outputs
- useful portfolio decisions
- transparent reasoning summaries
- clear uncertainty
- cost awareness
- historical evaluation
- point-in-time correctness

The objective is not to create an oracle.

The objective is to create a system that continuously improves its decision process by measuring what actually worked.

---

# 44. Codex bootstrap prompt

Copy the following prompt into Codex when starting the repository documentation phase.

---

## CODEX PROMPT

You are helping me bootstrap a new personal project: an AI Investment Assistant.

I have added a project planning document to the repository. Treat that document as the source material for product intent and architecture.

Your task is NOT to implement product features yet.

Your task is to turn the planning document into a clean, durable project documentation structure that future Codex sessions can reliably use as repository context.

### Goals

1. Read the entire project planning document carefully.
2. Inspect the existing repository structure before making changes.
3. Create an `AGENTS.md` file at the repository root.
4. Create the `/docs` documentation structure described in the planning document.
5. Split the large planning document into focused, maintainable documentation files.
6. Preserve the original intent and important decisions.
7. Avoid duplicating the same information across many files.
8. Do not invent major product requirements that are not supported by the planning document.
9. Where an architectural choice is intentionally unresolved, document it as an open decision instead of guessing.
10. Do not implement application code during this task.

### AGENTS.md requirements

`AGENTS.md` must be concise enough to serve as persistent Codex context.

It should include:

- what the product is
- primary long-term investment strategy
- secondary tactical/speculative strategy
- distinction between real portfolio and AI Paper Trader
- requirement to preserve point-in-time correctness
- TradingAgents usage/adaptation
- OpenRouter + model-routing architecture
- preference for structured AI outputs
- requirement to persist predictions and evaluate outcomes
- development workflow expectations
- instruction to read relevant `/docs` files before implementing a feature
- instruction to update docs when architectural decisions change
- instruction to avoid over-engineering MVP phases

Do not copy the full project spec into `AGENTS.md`.

### Create these documentation areas

Use the following structure unless the existing repository strongly suggests a better equivalent:

```text
/docs
  /product
    product-vision.md
    user-goals.md
    scope.md

  /architecture
    system-architecture.md
    agent-architecture.md
    model-routing.md
    data-model.md
    scheduling.md
    learning-engine.md

  /features
    001-portfolio.md
    002-watchlist.md
    003-market-data.md
    004-ai-analysis.md
    005-automated-monitoring.md
    006-opportunity-scanner.md
    007-predictions.md
    008-outcome-evaluation.md
    009-reports-alerts.md
    010-paper-trader.md
    011-learning-engine.md
    012-ai-cost-model-routing.md

  /plans

  roadmap.md
  decisions.md
```

### Product model to preserve

The product is primarily a long-term investment assistant, not an active trading bot.

Main modes:

1. Long-Term Investing
2. Tactical / Speculation
3. Opportunity Discovery

The user's real portfolio is advisory-only.

The AI Paper Trader is isolated and may autonomously trade only virtual/mock assets.

### TradingAgents

The project should evaluate using or adapting:

https://github.com/TauricResearch/TradingAgents

Important concepts to preserve:

- technical/market analyst
- fundamentals analyst
- sentiment analyst
- news/macro analyst
- bull researcher
- bear researcher
- research manager
- trader
- aggressive/neutral/conservative risk analysis
- portfolio manager
- portfolio-aware analysis
- decision memory/reflection
- backtesting
- point-in-time correctness

The application itself should NOT simply become a UI wrapper around TradingAgents.

Our own application should own:

- portfolio
- watchlist
- discovery universe
- scheduling
- prediction storage
- outcome evaluation
- opportunity scanner
- alerts
- paper trader
- learning metrics
- model cost tracking

### OpenRouter

The application should use OpenRouter through a model-routing abstraction.

Agents request logical tiers such as:

```text
cheap
standard
strong
```

Do not hardcode the whole architecture to one model provider.

Model selection must remain configurable.

Track model:

- cost
- token usage
- latency
- agent
- prediction quality where applicable

### Predictions

Forecasts must be stored as structured data.

Support different horizons for:

- tactical analysis
- long-term analysis

Persist enough information to compare forecasts against actual future outcomes.

### Learning

"Self-learning" should initially mean measured feedback and calibration, not autonomous model rewriting.

Use:

```text
prediction
→ actual outcome
→ evaluation
→ reflection
→ performance metrics
→ calibrated weights
```

Track performance by:

- agent
- model
- asset
- asset type
- horizon
- market regime

### Development phases

Preserve the roadmap:

- Phase 0 - Foundation
- Phase 1 - Portfolio & Watchlist
- Phase 2 - AI Market Intelligence
- Phase 3 - Automated Monitoring
- Phase 4 - Opportunity Scanner
- Phase 5 - Forecast Engine
- Phase 6 - Outcome Evaluation
- Phase 7 - AI Paper Trader
- Phase 8 - Adaptive Learning
- Phase 9 - Model Optimization

Do not collapse all phases into one implementation plan.

### Feature spec format

Each file under `/docs/features` should contain, where applicable:

- Goal
- User value
- Scope
- Non-goals
- Inputs
- Outputs
- Core data/entities
- Main flows
- Edge cases
- Dependencies
- Acceptance criteria
- Open questions
- Future extensions

Do not prematurely specify implementation details if they are not necessary.

### Architecture documentation

Clearly distinguish:

- Web application
- Application API
- AI analysis service
- TradingAgents / LangGraph layer
- Forecast Engine
- persistence
- scheduler/background workers
- Paper Trader
- Learning Engine
- market data providers
- OpenRouter/model router

Document unresolved choices in `docs/decisions.md`.

### Roadmap

Create `docs/roadmap.md` from the phased plan.

For each phase include:

- objective
- scope
- dependencies
- completion criteria

### decisions.md

Create an initial architecture decision log.

Include confirmed decisions such as:

- long-term investing is primary
- tactical trading is secondary
- real portfolio is advisory only
- Paper Trader is isolated
- use/adapt TradingAgents rather than recreate the entire framework blindly
- use OpenRouter abstraction
- store structured predictions
- measure outcomes
- preserve point-in-time integrity

Also include unresolved decisions such as:

- exact frontend/backend split
- Next.js API vs separate backend
- worker/scheduler technology
- exact market data providers
- exact initial OpenRouter models

### README

If a README already exists, preserve useful content.

Add a concise project overview and links to:

- product vision
- architecture
- roadmap
- feature specs

Do not turn README into the full specification.

### Final task output

After making documentation changes:

1. List all created or modified files.
2. Summarize the documentation structure.
3. Call out unresolved architecture decisions.
4. Do not implement product code.
5. Do not begin Phase 0 implementation unless I explicitly ask for it.

---

# 45. Next recommended step after Codex bootstrap

Once Codex creates the documentation, the next task should be:

```text
Review AGENTS.md and all Phase 0 related docs.
Create /docs/plans/000-foundation-plan.md.

Do not implement yet.

The plan should include:
- repository structure
- frontend/backend boundaries
- database setup
- OpenRouter abstraction
- configuration strategy
- scheduler foundation
- logging/observability
- test strategy
- local development
- deployment assumptions
- milestones
- risks
```

After reviewing that plan, start implementation in a separate Codex session.

---

# 46. Source-of-truth rule

The repository documentation should become the long-term source of truth.

Chat history should not be required for future development.

If future discussions change a major decision:

1. update the relevant documentation
2. update `decisions.md`
3. update `AGENTS.md` only if the change affects durable project-wide instructions

This prevents important context from being trapped inside individual chat sessions.
