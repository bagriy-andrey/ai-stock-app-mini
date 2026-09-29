# Development Insights

This file is the durable memory for implementation patterns discovered while working in this repository. Update it after development chats when there is a reusable insight that can reduce future investigation or rework.

## Entry Format

Use short entries. Prefer this structure:

```md
## YYYY-MM-DD - Short Topic

- Context: what was being built or fixed.
- Insight: reusable repo-specific knowledge.
- Files: `path/to/file.ts`, `path/to/other-file.tsx`.
```

Do not record generic progress logs. Record only insights that should help future coding, review, debugging, or design decisions.

## 2026-09-28 - Phase 2 Deep Analysis Boundary

- Context: Phase 2 added manually triggered Deep Analysis.
- Insight: Deep Analysis is implemented inside the Next.js monolith with application-owned TypeScript agents. It should remain separate from scanners, forecasts, learning, Paper Trader, and real portfolio execution. Reports are advisory-only and are not structured prediction records.
- Files: `lib/analysis/orchestrator.ts`, `lib/analysis/agents.ts`, `docs/plans/002-ai-market-intelligence-plan.md`, `docs/architecture/agent-architecture.md`.

## 2026-09-28 - Analysis Input Snapshots

- Context: Phase 2 needs point-in-time correctness.
- Insight: Analysis runs store immutable JSON snapshots on `AgentRun.inputSnapshot`. The context builder must not invent missing market, news, or fundamentals data; it should surface missing/stale data warnings instead.
- Files: `lib/analysis/context-builder.ts`, `prisma/schema.prisma`, `docs/architecture/data-model.md`.

## 2026-09-28 - Model Routing Settings

- Context: OpenRouter model selection became configurable from the UI.
- Insight: Agents still request logical tiers (`cheap`, `standard`, `strong`). The primary model for each tier can be selected in `/settings/models` and persisted in `AiModelTierSetting`; `.env` model values remain fallback configuration when no DB setting exists.
- Files: `app/settings/models/page.tsx`, `lib/model-router/settings.ts`, `config/models.ts`, `prisma/schema.prisma`.

## 2026-09-28 - OpenRouter Model Catalog Pricing

- Context: The UI needs model name and estimated cost per call.
- Insight: OpenRouter exposes live model metadata through `GET /api/v1/models`. Pricing is per token, not fixed per request, so UI call cost is an estimate based on a fixed planning token budget. Do not present it as guaranteed actual spend.
- Files: `lib/model-router/openrouter-client.ts`, `lib/model-router/pricing.ts`, `app/api/openrouter/models/route.ts`.

## 2026-09-28 - Searchable Model Dropdown

- Context: Native model dropdowns were too hard to use with the OpenRouter catalog.
- Insight: For long option lists, use `SearchableModelSelect` instead of native `<select>`. It supports search by model name/id, model selection, clearing, and hidden form submission for server actions.
- Files: `components/model-router/searchable-model-select.tsx`, `app/settings/models/page.tsx`, `app/settings/models/actions.ts`.

## 2026-09-28 - Existing UI Style

- Context: Portfolio, watchlist, analysis, and settings screens share an MVP operations UI style.
- Insight: Keep pages dense and utilitarian: bordered white panels on `bg-zinc-50`, small uppercase section labels, compact tables/cards, and direct action buttons. Avoid marketing-style hero layouts for app workflows.
- Files: `app/portfolio/page.tsx`, `app/watchlist/page.tsx`, `app/analysis/page.tsx`, `app/settings/models/page.tsx`.

## 2026-09-28 - Next Build Route Types

- Context: Running `npm run build` changes generated route type imports.
- Insight: `next-env.d.ts` may switch from `.next/dev/types/...` to `.next/types/...` after production builds. Treat this as generated noise unless the user explicitly wants it committed.
- Files: `next-env.d.ts`.

## 2026-09-28 - Local Runtime Constraint

- Context: Prisma migrations were attempted during Phase 2 work.
- Insight: The local PostgreSQL database may be unavailable at `localhost:5432`, causing `P1001`. Code, schema, and migration files can still be completed and verified with lint/typecheck/tests/build, but UI pages that query new tables require `npm run prisma:migrate` after Postgres is running.
- Files: `prisma/migrations/`, `prisma/schema.prisma`.

## 2026-09-28 - Analysis Actions and Toasts

- Context: AI analysis actions needed icon-only controls, start/completion notifications, and refresh from history/detail pages.
- Insight: Use `AnalysisIconForm` and `RefreshAnalysisForm` for analysis-related icon buttons so start toasts, tooltips, hidden form fields, and icon styling stay consistent. Completion toasts are driven by `analysisToast` query params after server actions redirect to the new run detail page.
- Files: `components/analysis/analysis-action-button.tsx`, `components/analysis/analysis-toast-on-load.tsx`, `components/ui/toast.tsx`, `app/analysis/actions.ts`.

## 2026-09-28 - Analysis Page UI Conventions

- Context: Deep Analysis history/detail pages were tightened after MVP implementation.
- Insight: Header navigation should use icon-only Home buttons. History rows should make all non-action cells clickable. Model tiers are visually encoded as cheap=red, standard=amber, strong=emerald, and detail widgets should expose compact native-title `i` tooltips for field meaning.
- Files: `app/analysis/page.tsx`, `app/analysis/[id]/page.tsx`.

## 2026-09-28 - Active Analysis UI State

- Context: AI analysis buttons must not start duplicate runs while a previous run is active.
- Insight: Portfolio and watchlist repositories attach `hasActiveAnalysis` from `AgentRun` rows with `PENDING` or `RUNNING` status. UI buttons should consume that flag and disable submit buttons. Analysis history/detail pages use `AnalysisAutoRefresh` to refresh server data while active runs exist.
- Files: `lib/portfolio/repository.ts`, `lib/watchlist/repository.ts`, `components/analysis/analysis-auto-refresh.tsx`.

## 2026-09-28 - Tooltip and AI Cost UI

- Context: Native tooltips were inconsistent and table tooltips were clipped; analysis cost showed `N/A`.
- Insight: Use the shared `Tooltip` component for app tooltips. It renders through a fixed-position portal so table/card overflow does not clip it. New AI usage records calculate `cost` from actual token counts and OpenRouter prompt/completion pricing when pricing metadata is available; old runs without stored cost remain `N/A`.
- Files: `components/ui/tooltip.tsx`, `lib/analysis/orchestrator.ts`, `lib/model-router/pricing.ts`.

## 2026-09-28 - Tooltip Rule and Refresh Control

- Context: Refresh buttons and tooltip behavior needed repeated correction.
- Insight: All new user-facing tooltips must use `components/ui/tooltip.tsx`, not native `title`. Refresh actions use `RefreshAnalysisForm`; pass `size="header"` for report header controls and keep compact size for table rows.
- Files: `AGENTS.md`, `components/analysis/analysis-action-button.tsx`, `app/analysis/[id]/page.tsx`.

## 2026-09-28 - Completion Toast Timing

- Context: Analysis completion toasts were not visible after server-action redirects.
- Insight: Do not rely on a separate page-load component dispatching a toast event before `ToastViewport` subscribes. For redirect-driven completion messages, pass `initialToast` directly into `ToastViewport`.
- Files: `components/ui/toast.tsx`, `app/analysis/[id]/page.tsx`.

## 2026-09-29 - Analysis JSON Fallbacks

- Context: Deep Analysis runs could fail after successful model calls when the final model returned malformed JSON.
- Insight: Analysis orchestration should request OpenRouter JSON mode and still defensively fallback when parsing/schema validation fails. Malformed agent output should produce a low-confidence fallback summary/report with a warning instead of failing the whole run.
- Files: `lib/analysis/orchestrator.ts`, `lib/analysis/json.ts`, `lib/model-router/types.ts`.

## 2026-09-29 - Model Settings Tabs

- Context: `/settings/models` separates tier selection from the full OpenRouter catalog.
- Insight: Keep server-side model loading in `app/settings/models/page.tsx` and put tab/search persistence in `components/model-router/model-settings-tabs.tsx`. Active tab uses `modelSettings.activeTab`; catalog name search uses `modelSettings.catalogSearch`.
- Files: `app/settings/models/page.tsx`, `components/model-router/model-settings-tabs.tsx`.

## 2026-09-29 - Phase 3 Scanner Planning

- Context: Phase 3 needed an implementation plan before schema and UI work.
- Insight: Phase 3 scope is documented in `docs/plans/003-lightweight-scanners-event-detection-plan.md`. Start with manual scanner runs in the existing Next.js app, persist `ScannerRun`/`ScannerSignal`/`MarketEvent` provenance before escalation, keep scoring deterministic and explainable first, and defer forecasts, Paper Trader, Market Intelligence Memory, and learning cycles.
- Files: `docs/plans/003-lightweight-scanners-event-detection-plan.md`, `docs/decisions.md`.
