# AI Investment Assistant

Personal AI investment intelligence system for portfolio monitoring, watchlist analysis, market discovery, structured forecasting, reports, paper trading, and measured learning from prediction outcomes.

The project is primarily focused on long-term diversified investing. Tactical/speculative analysis is supported as a secondary mode, especially for crypto and selected high-conviction opportunities. The real portfolio is advisory-only; autonomous trading is limited to an isolated AI Paper Trader with virtual money.

## Documentation

- [Product vision](docs/product/product-vision.md)
- [User goals](docs/product/user-goals.md)
- [Scope](docs/product/scope.md)
- [System architecture](docs/architecture/system-architecture.md)
- [Agent architecture](docs/architecture/agent-architecture.md)
- [Data model](docs/architecture/data-model.md)
- [Roadmap](docs/roadmap.md)
- [Architecture decisions](docs/decisions.md)
- [Feature specs](docs/features)

## Current Status

Phase 0 foundation is implemented. Phase 1 portfolio workflows and Watchlist CRUD are implemented.

## Local Development

Prerequisites:

- Node.js 22+
- npm 10+
- PostgreSQL installed manually on the developer machine

Setup:

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

Useful commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Phase plans:

- [000 - Foundation](docs/plans/000-foundation-plan.md)
- [001 - Portfolio & Watchlist](docs/plans/001-portfolio-watchlist-plan.md)
