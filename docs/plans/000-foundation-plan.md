# 000 - Phase 0 Foundation Plan

## Objective

Create the initial project foundation for the AI Investment Assistant without implementing product features yet.

Phase 0 should make the repository runnable, typed, testable, configurable, and ready for Phase 1 portfolio/watchlist work.

## Phase 0 Scope

- Repository structure
- Frontend skeleton
- Application API skeleton
- Database setup
- Environment configuration
- OpenRouter model-router abstraction
- Scheduler foundation
- Logging/observability foundation
- Test strategy
- Local development workflow
- Documentation updates for chosen architecture

## Non-Goals

- Portfolio CRUD
- Watchlist CRUD
- Real market data integration
- TradingAgents integration
- Python AI service implementation
- Paper Trader
- Forecast engine
- Outcome evaluation
- Production deployment

## Recommended MVP Architecture

### Web application

Use a single Next.js application with:

- React
- TypeScript
- Tailwind CSS
- App Router
- Server-side API routes for early application APIs

Reasoning: this keeps the early codebase small and lets Phase 1 ship portfolio/watchlist workflows without introducing a separate backend service too early.

### Backend boundary

Use Next.js route handlers/server actions for Phase 0 and Phase 1.

Do not introduce NestJS yet. Revisit only if API complexity, background processing, or service boundaries justify it.

### AI service boundary

Do not implement Python/FastAPI in Phase 0.

Define the future boundary in docs and keep AI-related application code behind interfaces:

- `ModelRouter`
- `AiUsageLogger`
- future `AnalysisClient`

The Python service should become relevant in Phase 2 when TradingAgents/LangGraph integration starts.

### Database

Use PostgreSQL with Prisma.

Phase 0 should add:

- Prisma setup
- database connection config
- initial migration machinery
- minimal schema needed for app health/config/model usage foundation

Avoid modeling every future entity in Phase 0. Portfolio/watchlist schema belongs in Phase 1.

### Scheduler

Start with a lightweight scheduler abstraction, not Redis/BullMQ yet.

Phase 0 should define:

- scheduler interface
- job registration shape
- local no-op or interval-based runner for development

BullMQ/Redis can be introduced when automated monitoring requires durable queues in Phase 3.

### OpenRouter

Create a model-routing abstraction early:

- logical tiers: `cheap`, `standard`, `strong`
- configurable model names via env/config
- fallback-ready route definition
- centralized OpenRouter client wrapper
- cost/latency logging hook

Phase 0 should not call expensive AI workflows. A health/test endpoint or unit test can validate configuration shape without requiring real API calls.

### Logging

Use structured application logging from the start.

Recommended:

- simple logger wrapper
- request/error logging for API routes
- clear redaction rules for secrets

Avoid heavy observability tooling in Phase 0.

## Proposed Repository Structure

```text
.
├── app/
│   ├── api/
│   │   └── health/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
├── config/
│   ├── env.ts
│   └── models.ts
├── lib/
│   ├── db/
│   │   └── prisma.ts
│   ├── logging/
│   │   └── logger.ts
│   ├── model-router/
│   │   ├── model-router.ts
│   │   ├── openrouter-client.ts
│   │   └── types.ts
│   └── scheduler/
│       ├── scheduler.ts
│       └── types.ts
├── prisma/
│   └── schema.prisma
├── tests/
├── docs/
├── AGENTS.md
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── .env.example
└── .gitignore
```

## Environment Configuration

Create `.env.example` with:

```text
DATABASE_URL=
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL_CHEAP=
OPENROUTER_MODEL_STANDARD=
OPENROUTER_MODEL_STRONG=
APP_BASE_URL=http://localhost:3000
LOG_LEVEL=info
```

Use a typed env parser so missing required variables fail early in server-side code.

## Initial Database Plan

Phase 0 schema should stay minimal:

- `AppSetting` for durable app configuration values if needed
- `AiUsageRecord` because model routing and cost tracking are durable architecture requirements

Defer these to later phases:

- assets
- portfolio positions
- watchlist items
- market prices
- predictions
- paper trades

## API Skeleton

Add a health endpoint:

```text
GET /api/health
```

It should return:

- app status
- timestamp
- environment name if available
- database connectivity status when Prisma is configured

## UI Skeleton

Create a quiet operational dashboard placeholder, not a landing page.

Initial first screen should show:

- project name
- current phase
- system status
- links or placeholders for future modules:
  - Portfolio
  - Watchlist
  - Opportunities
  - Predictions
  - Reports
  - Paper Trader
  - AI Usage

No fake product metrics in Phase 0.

## Test Strategy

Set up:

- TypeScript typecheck
- lint
- unit test runner
- at least one test for model routing config behavior
- optional health endpoint test if framework setup is straightforward

Recommended scripts:

```text
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
```

## Local Development

Phase 0 should support:

- `npm install`
- `.env` created from `.env.example`
- PostgreSQL available locally
- `npx prisma migrate dev`
- `npm run dev`

Use a manually installed local PostgreSQL instance for Phase 0. Do not add Docker Compose yet.

## Documentation Updates

After implementation:

- Update `README.md` with setup commands
- Update `docs/decisions.md` with any finalized architecture choices
- Update relevant architecture docs if implementation differs from this plan

## Milestones

### Milestone 1 - Project scaffold

- Next.js app created
- TypeScript, Tailwind, linting configured
- Initial dashboard placeholder renders

### Milestone 2 - Configuration and database

- `.env.example` added
- typed env config added
- Prisma configured
- local migration path documented

### Milestone 3 - Core infrastructure modules

- logger wrapper
- model router abstraction
- OpenRouter client wrapper
- AI usage persistence shape
- scheduler abstraction

### Milestone 4 - Verification

- health endpoint works
- lint/typecheck/test scripts exist
- build passes
- README documents local setup

## Risks

- Pulling Python/TradingAgents into Phase 0 would slow the foundation and blur the service boundary.
- Modeling too many future tables now may create churn before Phase 1 requirements are implemented.
- Adding Redis/BullMQ too early may add operational cost without immediate value.
- Real OpenRouter calls in tests would make tests slow, flaky, and potentially costly.

## Acceptance Criteria

- The app runs locally.
- The repository has a clear Next.js/TypeScript foundation.
- Environment configuration is typed and documented.
- Prisma is configured for PostgreSQL.
- Model routing is represented as an interface/configurable abstraction.
- Scheduler foundation exists without committing to a durable queue.
- Logging foundation exists.
- Basic verification scripts are available.
- No product features beyond foundation are implemented.

## Implementation Decisions

- Local PostgreSQL is assumed to be installed manually on the developer machine.
- Vitest should be included in Phase 0.
- `AiUsageRecord` should be included in the initial Prisma schema.
- Prisma 6 should be used for the initial ORM CLI/client toolchain.
- Next.js dev/build scripts should use webpack initially because Turbopack failed in the local environment while processing CSS.
