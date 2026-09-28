import Link from "next/link";
import { startWatchlistAnalysis } from "@/app/analysis/actions";
import {
  createManualPrice,
  createPosition,
  sellPosition,
} from "@/app/portfolio/actions";
import {
  createWatchlistItem,
  deleteWatchlistItem,
  updateWatchlistItem,
} from "@/app/watchlist/actions";
import { WatchlistTable } from "@/components/watchlist/watchlist-table";
import { getPortfolioSummary } from "@/lib/portfolio/repository";
import { getWatchlistSummary } from "@/lib/watchlist/repository";

export const dynamic = "force-dynamic";

type WatchlistSummary = Awaited<ReturnType<typeof getWatchlistSummary>>;
type PortfolioSummary = Awaited<ReturnType<typeof getPortfolioSummary>>;

export default async function WatchlistPage() {
  let watchlist: WatchlistSummary;
  let portfolio: PortfolioSummary;

  try {
    [watchlist, portfolio] = await Promise.all([
      getWatchlistSummary(),
      getPortfolioSummary(),
    ]);
  } catch (error) {
    return <WatchlistSetupState error={error} />;
  }

  const pricedCount = watchlist.items.filter((item) => item.latestPrice).length;
  const ownedCount = watchlist.items.filter((item) => item.isOwned).length;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link className="text-sm font-medium text-zinc-500" href="/">
              AI Investment Assistant
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Watchlist</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Manual asset monitoring, separate from owned portfolio positions.
            </p>
          </div>
          <Link
            aria-label="Exit to home"
            className="grid size-9 place-items-center rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
            href="/"
            title="Exit to home"
          >
            <HomeIcon />
          </Link>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <SummaryMetric
            detail="Manual monitoring list"
            label="Assets"
            value={String(watchlist.items.length)}
          />
          <SummaryMetric
            detail="Also held in the portfolio"
            label="Owned"
            value={String(ownedCount)}
          />
          <SummaryMetric
            detail="Have latest market snapshot"
            label="Priced"
            value={String(pricedCount)}
          />
          <SummaryMetric
            detail="Need market-price support"
            label="Missing price"
            value={String(watchlist.items.length - pricedCount)}
          />
        </section>

        <WatchlistTable
          baseCurrency={portfolio.baseCurrency}
          cashBalances={portfolio.cashBalances}
          createAction={createWatchlistItem}
          createPositionAction={createPosition}
          deleteAction={deleteWatchlistItem}
          exchanges={portfolio.exchanges}
          items={watchlist.items}
          portfolioPositions={portfolio.positions}
          sellPositionAction={sellPosition}
          startAnalysisAction={startWatchlistAnalysis}
          updateAction={updateWatchlistItem}
          updatePriceAction={createManualPrice}
        />
      </div>
    </main>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-4">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function WatchlistSetupState({ error }: { error: unknown }) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-5 py-6">
        <header className="border-b border-zinc-200 pb-5">
          <Link className="text-sm font-medium text-zinc-500" href="/">
            AI Investment Assistant
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Watchlist setup</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Configure PostgreSQL and apply migrations before using watchlist
            CRUD.
          </p>
        </header>
        <section className="rounded border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold uppercase text-amber-900">
            Database unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Set `DATABASE_URL`, run `npm run prisma:migrate`, then reload this
            page.
          </p>
          <pre className="mt-3 max-h-96 overflow-auto rounded border border-amber-200 bg-white p-3 text-xs text-zinc-700">
            {getErrorMessage(error)}
          </pre>
        </section>
      </div>
    </main>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown database error";
}
