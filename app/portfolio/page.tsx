import Link from "next/link";
import {
  createPosition,
  deleteCashBalance,
  deletePosition,
  updatePosition,
  upsertCashBalance,
} from "@/app/portfolio/actions";
import { PortfolioTablesTabs } from "@/components/portfolio/portfolio-tables-tabs";
import { getPortfolioSummary } from "@/lib/portfolio/repository";

export const dynamic = "force-dynamic";

type PortfolioSummary = Awaited<ReturnType<typeof getPortfolioSummary>>;

export default async function PortfolioPage() {
  let portfolio: PortfolioSummary;

  try {
    portfolio = await getPortfolioSummary();
  } catch (error) {
    return <PortfolioSetupState error={error} />;
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link className="text-sm font-medium text-zinc-500" href="/">
              AI Investment Assistant
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">{portfolio.name}</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Real portfolio tracking. Advisory-only, no AI trading actions.
            </p>
          </div>
          <div className="text-sm text-zinc-600">
            Base currency:{" "}
            <span className="font-semibold text-zinc-950">
              {portfolio.baseCurrency}
            </span>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <SummaryMetric
            label="Total value"
            value={formatMaybeMoney(
              portfolio.valuation.totalValue,
              portfolio.baseCurrency,
            )}
            detail={portfolio.valuation.isComplete ? "Complete" : "Partial"}
          />
          <SummaryMetric
            label="Priced holdings"
            value={formatMoney(
              portfolio.valuation.pricedPositionValue,
              portfolio.baseCurrency,
            )}
            detail={`${portfolio.positions.length} positions`}
          />
          <SummaryMetric
            label="Base cash"
            value={formatMoney(
              portfolio.valuation.baseCurrencyCashValue,
              portfolio.baseCurrency,
            )}
            detail={`${portfolio.cashBalances.length} balances`}
          />
          <SummaryMetric
            label="Data status"
            value={portfolio.valuation.isComplete ? "Ready" : "Incomplete"}
            detail={
              portfolio.valuation.hasMissingPrices
                ? "Missing prices"
                : portfolio.valuation.hasUnsupportedCurrencies
                  ? "Needs FX data"
                  : "No issues"
            }
          />
        </section>

        <PortfolioTablesTabs
          baseCurrency={portfolio.baseCurrency}
          cashBalances={portfolio.cashBalances}
          createPositionAction={createPosition}
          deleteCashBalanceAction={deleteCashBalance}
          deletePositionAction={deletePosition}
          positions={portfolio.positions}
          upsertCashBalanceAction={upsertCashBalance}
          updatePositionAction={updatePosition}
          valuationPositions={portfolio.valuation.positions}
        />
      </div>
    </main>
  );
}

function PortfolioSetupState({ error }: { error: unknown }) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-5 py-6">
        <header className="border-b border-zinc-200 pb-5">
          <Link className="text-sm font-medium text-zinc-500" href="/">
            AI Investment Assistant
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Portfolio setup</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Configure PostgreSQL and apply migrations before using portfolio
            CRUD.
          </p>
        </header>
        <section className="rounded border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold uppercase text-amber-900">
            Database unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Set `DATABASE_URL`, run `npx prisma migrate dev`, then reload this
            page.
          </p>
          <pre className="mt-3 overflow-auto rounded border border-amber-200 bg-white p-3 text-xs text-zinc-700">
            {getErrorMessage(error)}
          </pre>
        </section>
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

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      maximumFractionDigits: 2,
      style: "currency",
    }).format(value);
  } catch {
    return `${formatNumber(value)} ${currency}`;
  }
}

function formatMaybeMoney(value: number | null, currency: string): string {
  return value === null ? "N/A" : formatMoney(value, currency);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 8,
  }).format(value);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown database error";
}
