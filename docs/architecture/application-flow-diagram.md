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
  scheduler --> scanners["Lightweight Scanners<br/>portfolio + watchlist + market + crypto + news"]
  scanners --> events["Event Detector<br/>структурные market events"]
  events --> memory["Market Intelligence Memory<br/>observations + learned patterns"]
  scanners --> memory
  scheduler --> reportJobs["Report Jobs<br/>daily / weekly / monthly / quarterly / yearly"]
  scheduler --> outcomeJobs["Outcome Resolution Jobs<br/>проверка истекших прогнозов"]
  scheduler --> learningJobs["Learning Jobs<br/>weekly / monthly / quarterly / yearly"]

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
  scanners --> db
  events --> db
  memory --> db

  scanners --> candidates["Prioritized Candidates<br/>material changes and opportunities"]
  memory --> candidates
  candidates --> aiService["Deep Analysis Engine<br/>TradingAgents / adapted agents"]
  web --> aiService
  aiService --> agentRouter["Asset Intent Router<br/>LONG_TERM / TACTICAL / DISCOVERY"]

  agentRouter --> longTerm["Long-term Investment Path<br/>fundamentals, valuation, macro, thesis"]
  agentRouter --> tactical["Tactical Path<br/>technicals, sentiment, derivatives, news"]
  agentRouter --> discovery["Opportunity Discovery Path<br/>universe scan, opportunity score"]

  longTerm --> forecast["Forecast Engine<br/>horizons, scenarios, confidence"]
  tactical --> forecast
  discovery --> forecast
  forecast --> predictions
  forecast --> advisor["Portfolio Advisor<br/>advisory-only real portfolio"]

  aiService --> modelRouter["Model Router<br/>cheap / standard / strong + task profiles"]
  scanners --> modelRouter
  events --> modelRouter
  reports --> modelRouter
  paper --> modelRouter
  modelRouter --> openrouter["OpenRouter<br/>разные LLM модели"]
  modelRouter --> usage["AI Usage Logger<br/>tokens, cost, latency, status"]
  usage --> db

  predictions --> evaluation["Outcome Evaluation<br/>actual vs forecast, alpha, calibration"]
  outcomeJobs --> evaluation
  evaluation --> learning["Learning Engine<br/>market learning + agent learning"]
  learningJobs --> learning
  learning --> db
  learning --> memory
  memory --> aiService

  predictions --> paper
  advisor --> reports
  paper --> paperMetrics["Paper Performance Metrics<br/>P&L, drawdown, benchmark, strategy comparison"]
  paperMetrics --> learning

  reportJobs --> reports
  scanners --> reports
  events --> reports
  reports --> telegram["Telegram Bot<br/>alerts and reports"]
  reports --> translations["Cached Report Translations<br/>RU/EN on demand"]
  translations --> db
```

### Как Работает Поток

1. Пользователь вручную ведет портфель, cash и watchlist в браузерном приложении.
2. Scheduler запускает ingestion только для портфеля, watchlist и настроенного discovery universe.
3. Данные приходят из FMP, CoinGecko, FRED/ALFRED, SEC EDGAR, GDELT и optional Marketaux. CoinGlass добавляется позже для crypto derivatives.
4. Lightweight Scanners и Event Detector дешево находят важные изменения и структурные события.
5. Market Intelligence Memory возвращает исторические аналоги и learned patterns, известные на этот момент.
6. Deep Analysis Engine использует TradingAgents/adapted agents только для приоритетных кандидатов.
7. Forecast Engine сохраняет структурные прогнозы с горизонтом, сценариями, confidence, моделью, агентом и provider provenance.
8. Portfolio Advisor дает советы для реального портфеля, а Paper Trader исполняет только виртуальные сделки.
9. Outcome Evaluation сравнивает прогнозы с фактическими результатами.
10. Learning Engine обновляет market learning, agent learning и internal lessons на основе измеренных результатов.
11. Reports & Alerts генерируют пользовательские отчеты, Telegram-уведомления и on-demand переводы через OpenRouter с кешированием.
12. Реальный портфель никогда не исполняет сделки автоматически.

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
  scheduler --> scanners["Lightweight Scanners<br/>portfolio + watchlist + market + crypto + news"]
  scanners --> events["Event Detector<br/>structured market events"]
  events --> memory["Market Intelligence Memory<br/>observations + learned patterns"]
  scanners --> memory
  scheduler --> reportJobs["Report Jobs<br/>daily / weekly / monthly / quarterly / yearly"]
  scheduler --> outcomeJobs["Outcome Resolution Jobs<br/>expired forecast checks"]
  scheduler --> learningJobs["Learning Jobs<br/>weekly / monthly / quarterly / yearly"]

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
  scanners --> db
  events --> db
  memory --> db

  scanners --> candidates["Prioritized Candidates<br/>material changes and opportunities"]
  memory --> candidates
  candidates --> aiService["Deep Analysis Engine<br/>TradingAgents / adapted agents"]
  web --> aiService
  aiService --> agentRouter["Asset Intent Router<br/>LONG_TERM / TACTICAL / DISCOVERY"]

  agentRouter --> longTerm["Long-term Investment Path<br/>fundamentals, valuation, macro, thesis"]
  agentRouter --> tactical["Tactical Path<br/>technicals, sentiment, derivatives, news"]
  agentRouter --> discovery["Opportunity Discovery Path<br/>universe scan, opportunity score"]

  longTerm --> forecast["Forecast Engine<br/>horizons, scenarios, confidence"]
  tactical --> forecast
  discovery --> forecast
  forecast --> predictions
  forecast --> advisor["Portfolio Advisor<br/>advisory-only real portfolio"]

  aiService --> modelRouter["Model Router<br/>cheap / standard / strong + task profiles"]
  scanners --> modelRouter
  events --> modelRouter
  reports --> modelRouter
  paper --> modelRouter
  modelRouter --> openrouter["OpenRouter<br/>multiple LLM models"]
  modelRouter --> usage["AI Usage Logger<br/>tokens, cost, latency, status"]
  usage --> db

  predictions --> evaluation["Outcome Evaluation<br/>actual vs forecast, alpha, calibration"]
  outcomeJobs --> evaluation
  evaluation --> learning["Learning Engine<br/>market learning + agent learning"]
  learningJobs --> learning
  learning --> db
  learning --> memory
  memory --> aiService

  predictions --> paper
  advisor --> reports
  paper --> paperMetrics["Paper Performance Metrics<br/>P&L, drawdown, benchmark, strategy comparison"]
  paperMetrics --> learning

  reportJobs --> reports
  scanners --> reports
  events --> reports
  reports --> telegram["Telegram Bot<br/>alerts and reports"]
  reports --> translations["Cached Report Translations<br/>RU/EN on demand"]
  translations --> db
```

### How The Flow Works

1. The user manually maintains portfolio positions, cash, and watchlist in the web app.
2. The scheduler runs ingestion only for the portfolio, watchlist, and configured discovery universe.
3. Data comes from FMP, CoinGecko, FRED/ALFRED, SEC EDGAR, GDELT, and optional Marketaux. CoinGlass is added later for crypto derivatives.
4. Lightweight Scanners and Event Detector cheaply identify material changes and structured market events.
5. Market Intelligence Memory retrieves historical analogs and learned patterns known at that time.
6. The Deep Analysis Engine uses TradingAgents/adapted agents only for prioritized candidates.
7. The Forecast Engine stores structured forecasts with horizon, scenarios, confidence, model, agent, and provider provenance.
8. Portfolio Advisor provides advisory-only real-portfolio guidance, while Paper Trader executes only virtual trades.
9. Outcome Evaluation compares forecasts against actual results.
10. The Learning Engine updates market learning, agent learning, and internal lessons from measured outcomes.
11. Reports & Alerts generate user-facing reports, Telegram notifications, and on-demand translations through OpenRouter with caching.
12. The real portfolio never executes trades automatically.
