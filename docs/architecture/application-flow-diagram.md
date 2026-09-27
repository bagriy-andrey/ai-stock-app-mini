# Application Flow Architecture

This document shows the intended high-level application flow in Russian and English.

## Русская Версия

```mermaid
flowchart TB
  user["Пользователь<br/>браузер + Telegram"] --> web["Next.js Web App<br/>дашборд, портфель, watchlist, отчеты"]

  web --> api["Application API<br/>Next.js route handlers / server actions"]
  api --> auth["Single-user self-hosted config<br/>секреты, env, настройки"]

  api --> portfolio["Portfolio Service<br/>позиции, cash, allocation, P&L"]
  api --> watchlist["Watchlist Service<br/>активы для мониторинга"]
  api --> reports["Reports & Alerts Service<br/>история, Telegram, переводы"]
  api --> paper["Paper Trader Service<br/>виртуальные стратегии и сделки"]
  api --> predictions["Prediction Service<br/>структурные прогнозы и outcome"]

  scheduler["Scheduler / Workers<br/>периодические проверки и ingestion"] --> ingestion["Market Data Ingestion<br/>provider adapters"]
  scheduler --> monitoring["Automated Monitoring<br/>portfolio + watchlist + discovery"]
  scheduler --> reportJobs["Report Jobs<br/>daily / weekly / monthly / quarterly / yearly"]
  scheduler --> outcomeJobs["Outcome Resolution Jobs<br/>проверка истекших прогнозов"]

  ingestion --> fmp["FMP<br/>US stocks/ETF, fundamentals, calendars"]
  ingestion --> coingecko["CoinGecko<br/>crypto spot"]
  ingestion --> fred["FRED / ALFRED<br/>macro + vintages"]
  ingestion --> sec["SEC EDGAR<br/>filings"]
  ingestion --> gdelt["GDELT<br/>global events"]
  ingestion --> marketaux["Marketaux optional<br/>financial news"]
  ingestion -. "later" .-> coinglass["CoinGlass<br/>crypto derivatives"]
  ingestion -. "deferred" .-> advancedCrypto["Glassnode / CryptoQuant / Santiment<br/>advanced on-chain / social"]

  portfolio --> db[("PostgreSQL<br/>application data")]
  watchlist --> db
  ingestion --> db
  predictions --> db
  reports --> db
  paper --> db
  monitoring --> db

  monitoring --> aiService["AI Analysis Service<br/>TradingAgents / LangGraph / custom agents"]
  web --> aiService
  aiService --> agentRouter["Asset Intent Router<br/>LONG_TERM / TACTICAL / DISCOVERY"]

  agentRouter --> longTerm["Long-term Investment Path<br/>fundamentals, valuation, macro, thesis"]
  agentRouter --> tactical["Tactical Path<br/>technicals, sentiment, derivatives, news"]
  agentRouter --> discovery["Opportunity Discovery Path<br/>universe scan, opportunity score"]

  longTerm --> forecast["Forecast Engine<br/>horizons, scenarios, confidence"]
  tactical --> forecast
  discovery --> forecast
  forecast --> predictions

  aiService --> modelRouter["Model Router<br/>cheap / standard / strong + task profiles"]
  reports --> modelRouter
  paper --> modelRouter
  modelRouter --> openrouter["OpenRouter<br/>разные LLM модели"]
  modelRouter --> usage["AI Usage Logger<br/>tokens, cost, latency, status"]
  usage --> db

  predictions --> evaluation["Outcome Evaluation<br/>actual vs forecast, alpha, calibration"]
  outcomeJobs --> evaluation
  evaluation --> learning["Learning Engine<br/>agent/model/provider weights, reflection"]
  learning --> db
  learning --> aiService

  predictions --> paper
  paper --> paperMetrics["Paper Performance Metrics<br/>P&L, drawdown, benchmark, strategy comparison"]
  paperMetrics --> learning

  reportJobs --> reports
  monitoring --> reports
  reports --> telegram["Telegram Bot<br/>alerts and reports"]
  reports --> translations["Cached Report Translations<br/>RU/EN on demand"]
  translations --> db
```

### Как Работает Поток

1. Пользователь вручную ведет портфель, cash и watchlist в браузерном приложении.
2. Scheduler запускает ingestion только для портфеля, watchlist и настроенного discovery universe.
3. Данные приходят из FMP, CoinGecko, FRED/ALFRED, SEC EDGAR, GDELT и optional Marketaux. CoinGlass добавляется позже для crypto derivatives.
4. AI Analysis Service использует TradingAgents/LangGraph/custom agents и проходит через Asset Intent Router.
5. Forecast Engine сохраняет структурные прогнозы с горизонтом, сценариями, confidence, моделью, агентом и provider provenance.
6. Outcome Evaluation сравнивает прогнозы с фактическими результатами.
7. Learning Engine калибрует веса агентов, моделей, сигналов и провайдеров только на основе измеренных результатов.
8. Paper Trader использует прогнозы для виртуальных сделок и сравнивает стратегии, агентов и модели.
9. Reports & Alerts генерируют отчеты, Telegram-уведомления и on-demand переводы через OpenRouter с кешированием.
10. Реальный портфель никогда не исполняет сделки автоматически.

## English Version

```mermaid
flowchart TB
  user["User<br/>browser + Telegram"] --> web["Next.js Web App<br/>dashboard, portfolio, watchlist, reports"]

  web --> api["Application API<br/>Next.js route handlers / server actions"]
  api --> auth["Single-user self-hosted config<br/>secrets, env, settings"]

  api --> portfolio["Portfolio Service<br/>positions, cash, allocation, P&L"]
  api --> watchlist["Watchlist Service<br/>monitored assets"]
  api --> reports["Reports & Alerts Service<br/>history, Telegram, translations"]
  api --> paper["Paper Trader Service<br/>virtual strategies and trades"]
  api --> predictions["Prediction Service<br/>structured forecasts and outcomes"]

  scheduler["Scheduler / Workers<br/>periodic checks and ingestion"] --> ingestion["Market Data Ingestion<br/>provider adapters"]
  scheduler --> monitoring["Automated Monitoring<br/>portfolio + watchlist + discovery"]
  scheduler --> reportJobs["Report Jobs<br/>daily / weekly / monthly / quarterly / yearly"]
  scheduler --> outcomeJobs["Outcome Resolution Jobs<br/>expired forecast checks"]

  ingestion --> fmp["FMP<br/>US stocks/ETF, fundamentals, calendars"]
  ingestion --> coingecko["CoinGecko<br/>crypto spot"]
  ingestion --> fred["FRED / ALFRED<br/>macro + vintages"]
  ingestion --> sec["SEC EDGAR<br/>filings"]
  ingestion --> gdelt["GDELT<br/>global events"]
  ingestion --> marketaux["Marketaux optional<br/>financial news"]
  ingestion -. "later" .-> coinglass["CoinGlass<br/>crypto derivatives"]
  ingestion -. "deferred" .-> advancedCrypto["Glassnode / CryptoQuant / Santiment<br/>advanced on-chain / social"]

  portfolio --> db[("PostgreSQL<br/>application data")]
  watchlist --> db
  ingestion --> db
  predictions --> db
  reports --> db
  paper --> db
  monitoring --> db

  monitoring --> aiService["AI Analysis Service<br/>TradingAgents / LangGraph / custom agents"]
  web --> aiService
  aiService --> agentRouter["Asset Intent Router<br/>LONG_TERM / TACTICAL / DISCOVERY"]

  agentRouter --> longTerm["Long-term Investment Path<br/>fundamentals, valuation, macro, thesis"]
  agentRouter --> tactical["Tactical Path<br/>technicals, sentiment, derivatives, news"]
  agentRouter --> discovery["Opportunity Discovery Path<br/>universe scan, opportunity score"]

  longTerm --> forecast["Forecast Engine<br/>horizons, scenarios, confidence"]
  tactical --> forecast
  discovery --> forecast
  forecast --> predictions

  aiService --> modelRouter["Model Router<br/>cheap / standard / strong + task profiles"]
  reports --> modelRouter
  paper --> modelRouter
  modelRouter --> openrouter["OpenRouter<br/>multiple LLM models"]
  modelRouter --> usage["AI Usage Logger<br/>tokens, cost, latency, status"]
  usage --> db

  predictions --> evaluation["Outcome Evaluation<br/>actual vs forecast, alpha, calibration"]
  outcomeJobs --> evaluation
  evaluation --> learning["Learning Engine<br/>agent/model/provider weights, reflection"]
  learning --> db
  learning --> aiService

  predictions --> paper
  paper --> paperMetrics["Paper Performance Metrics<br/>P&L, drawdown, benchmark, strategy comparison"]
  paperMetrics --> learning

  reportJobs --> reports
  monitoring --> reports
  reports --> telegram["Telegram Bot<br/>alerts and reports"]
  reports --> translations["Cached Report Translations<br/>RU/EN on demand"]
  translations --> db
```

### How The Flow Works

1. The user manually maintains portfolio positions, cash, and watchlist in the web app.
2. The scheduler runs ingestion only for the portfolio, watchlist, and configured discovery universe.
3. Data comes from FMP, CoinGecko, FRED/ALFRED, SEC EDGAR, GDELT, and optional Marketaux. CoinGlass is added later for crypto derivatives.
4. The AI Analysis Service uses TradingAgents/LangGraph/custom agents and passes decisions through the Asset Intent Router.
5. The Forecast Engine stores structured forecasts with horizon, scenarios, confidence, model, agent, and provider provenance.
6. Outcome Evaluation compares forecasts against actual results.
7. The Learning Engine calibrates agent, model, signal, and provider weights only from measured outcomes.
8. Paper Trader uses forecasts for virtual trades and compares strategies, agents, and models.
9. Reports & Alerts generate reports, Telegram notifications, and on-demand translations through OpenRouter with caching.
10. The real portfolio never executes trades automatically.
