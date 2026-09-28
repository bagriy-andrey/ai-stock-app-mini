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
