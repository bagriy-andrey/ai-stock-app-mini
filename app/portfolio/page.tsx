import Link from "next/link";
import {
  createPortfolioExchange,
  createPosition,
  deleteActivityLog,
  deleteCashBalance,
  deletePosition,
  updateBaseCurrency,
  updatePosition,
  upsertCashBalance,
  withdrawCashBalance,
} from "@/app/portfolio/actions";
import { BaseCurrencySelect } from "@/components/portfolio/base-currency-select";
import { ExchangeFormModal } from "@/components/portfolio/exchange-form-modal";
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
          <div className="flex flex-wrap items-end gap-3">
            <BaseCurrencySelect
              action={updateBaseCurrency}
              baseCurrency={portfolio.baseCurrency}
            />
            <ExchangeFormModal action={createPortfolioExchange} />
            <Link
              aria-label="Exit to home"
              className="grid size-9 place-items-center rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
              href="/"
              title="Exit to home"
            >
              <HomeIcon />
            </Link>
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
            label="Holdings value"
            value={formatMoney(
              portfolio.valuation.pricedPositionValue,
              portfolio.baseCurrency,
            )}
            detail={
              portfolio.valuation.hasMissingPrices
                ? `${portfolio.positions.length} positions, missing prices estimated`
                : `${portfolio.positions.length} positions`
            }
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
                ? "Some assets have no market price; cost basis is used as a fallback."
                : portfolio.valuation.hasUnsupportedCurrencies
                  ? "FX rate is missing for one or more currencies."
                  : "Prices and FX rates are available for valuation."
            }
          />
        </section>

        <PortfolioTablesTabs
          activityLogs={portfolio.activityLogs}
          baseCurrency={portfolio.baseCurrency}
          cashBalances={portfolio.cashBalances}
          exchanges={portfolio.exchanges}
          createPositionAction={createPosition}
          deleteActivityLogAction={deleteActivityLog}
          deleteCashBalanceAction={deleteCashBalance}
          deletePositionAction={deletePosition}
          positions={portfolio.positions}
          upsertCashBalanceAction={upsertCashBalance}
          updatePositionAction={updatePosition}
          valuationPositions={portfolio.valuation.positions}
          withdrawCashBalanceAction={withdrawCashBalance}
        />
      </div>
    </main>
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

function PortfolioSetupState({ error }: { error: unknown }) {
  const guidance = getPortfolioSetupGuidance(error);

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
            {guidance}
          </p>
          <pre className="mt-3 max-h-96 overflow-auto rounded border border-amber-200 bg-white p-3 text-xs text-zinc-700">
            {getErrorMessage(error)}
          </pre>
        </section>
      </div>
    </main>
  );
}

function getPortfolioSetupGuidance(error: unknown): string {
  const message = getErrorMessage(error);

  if (message.includes("activityLogs")) {
    return "Portfolio activity history requires the latest Prisma client and database migration. Run `npm run prisma:generate`, restart the dev server, run `npm run prisma:migrate`, then reload this page.";
  }

  if (message.includes("Can't reach database server")) {
    return "PostgreSQL is not reachable. Start the local database, check `DATABASE_URL`, run `npm run prisma:migrate`, then reload this page.";
  }

  return "Set `DATABASE_URL`, run `npm run prisma:migrate`, then reload this page.";
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
