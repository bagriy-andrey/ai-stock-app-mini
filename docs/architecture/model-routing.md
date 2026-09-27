# Model Routing

## Gateway

Use OpenRouter as the primary LLM gateway to access multiple model providers through one API, avoid provider lock-in, optimize cost, support fallbacks, and compare model quality.

## Model Tiers

Agents should request logical tiers rather than hardcoded model names:

```yaml
models:
  cheap:
    primary: configurable-fast-low-cost-model
  standard:
    primary: configurable-balanced-model
  strong:
    primary: configurable-high-reasoning-model
```

Initial conceptual allocation:

- Market Analyst: `cheap`
- Sentiment Analyst: `cheap`
- News Analyst: `cheap`
- Fundamentals Analyst: `cheap` or `standard`
- Bull Researcher: `standard`
- Bear Researcher: `standard`
- Research Manager: `strong`
- Trader: `standard`
- Risk Analysts: `standard`
- Portfolio Manager: `strong`
- Forecast Engine: `strong`
- Reflection: `cheap` or `standard`
- Report Translation: `cheap` or `standard`

## Fallbacks

Model routing should support fallbacks, for example:

```text
strong primary
  -> strong fallback
  -> standard fallback
```

## Cost and Quality Tracking

Persist each AI call with:

- agent run id
- agent
- ticker
- model
- model tier
- input tokens
- output tokens
- cost
- latency
- timestamp
- status

Eventually compare model quality per dollar using prediction accuracy, alpha, latency, and cost by agent, model, asset type, horizon, and market regime.

## Task Profiles

In addition to logical tiers, routing should eventually support task profiles so different use cases can choose appropriate model and cost behavior:

- `analysis`: multi-agent asset or portfolio analysis
- `forecast`: structured prediction generation
- `reflection`: post-outcome learning summaries
- `translation`: report translation between Russian and English
- `paper_trading`: strategy decision support for virtual trades

Task profiles should still resolve through configurable OpenRouter models and persist usage records.
