import Link from "next/link";
import {
  createPosition,
  deleteCashBalance,
  deletePosition,
  updatePosition,
  upsertCashBalance,
} from "@/app/portfolio/actions";
import { CashActionsMenu } from "@/components/portfolio/cash-actions-menu";
import { CashFormModal } from "@/components/portfolio/cash-form-modal";
import { PositionActionsMenu } from "@/components/portfolio/position-actions-menu";
import { PositionFormModal } from "@/components/portfolio/position-form-modal";
import { getPortfolioSummary } from "@/lib/portfolio/repository";

export const dynamic = "force-dynamic";

type PortfolioSummary = Awaited<ReturnType<typeof getPortfolioSummary>>;
type PortfolioPosition = PortfolioSummary["positions"][number];
type PositionValuation = PortfolioSummary["valuation"]["positions"][number];
type CashBalance = PortfolioSummary["cashBalances"][number];

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

        <section className="grid gap-5">
          <div className="flex flex-col gap-4">
            <PositionsTable
              addButton={
                <PositionFormModal
                  action={createPosition}
                  assetType="CRYPTO"
                  baseCurrency={portfolio.baseCurrency}
                  mode="create"
                />
              }
              baseCurrency={portfolio.baseCurrency}
              emptyText="No crypto positions yet."
              positions={portfolio.positions.filter(
                (position) => position.assetType === "CRYPTO",
              )}
              title="Crypto"
              valuationPositions={portfolio.valuation.positions}
            />
            <PositionsTable
              addButton={
                <PositionFormModal
                  action={createPosition}
                  assetType="STOCK"
                  baseCurrency={portfolio.baseCurrency}
                  mode="create"
                />
              }
              baseCurrency={portfolio.baseCurrency}
              emptyText="No stock positions yet."
              positions={portfolio.positions.filter(
                (position) => position.assetType === "STOCK",
              )}
              title="Stocks"
              valuationPositions={portfolio.valuation.positions}
            />
            <PositionsTable
              addButton={
                <PositionFormModal
                  action={createPosition}
                  assetType="ETF"
                  baseCurrency={portfolio.baseCurrency}
                  mode="create"
                />
              }
              baseCurrency={portfolio.baseCurrency}
              emptyText="No ETF positions yet."
              positions={portfolio.positions.filter(
                (position) => position.assetType === "ETF",
              )}
              title="ETFs"
              valuationPositions={portfolio.valuation.positions}
            />
            <CashTable cashBalances={portfolio.cashBalances} />
          </div>
        </section>
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

function PositionsTable({
  title,
  positions,
  valuationPositions,
  baseCurrency,
  emptyText,
  addButton,
}: {
  title: string;
  positions: PortfolioPosition[];
  valuationPositions: PositionValuation[];
  baseCurrency: string;
  emptyText: string;
  addButton?: React.ReactNode;
}) {
  return (
    <section className="rounded border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold uppercase text-zinc-500">
            {title}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {positions.length} positions
          </p>
        </div>
        {addButton}
      </div>
      {positions.length === 0 ? (
        <p className="px-4 py-8 text-sm text-zinc-600">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Asset</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Avg cost</th>
                <th className="px-4 py-3 font-semibold">Latest price</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold">P&L</th>
                <th className="px-4 py-3 font-semibold">Weight</th>
                <th className="px-4 py-3 font-semibold">Intent</th>
                <th className="px-4 py-3 font-semibold">Operation</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {positions.map((position) => {
                const valuation = valuationPositions.find(
                  (item) => item.id === position.id,
                );

                return (
                  <tr key={position.id}>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-zinc-950">
                        {position.symbol}
                      </div>
                      <div className="max-w-56 truncate text-xs text-zinc-500">
                        {position.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {position.provider} / {position.assetCurrency}
                        {position.exchange ? ` / ${position.exchange}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {formatNumber(position.quantity)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {formatMoney(position.averageCost, position.costCurrency)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {position.latestPrice
                        ? formatMoney(
                            position.latestPrice.price,
                            position.latestPrice.currency,
                          )
                        : "Missing"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {formatMaybeMoney(
                        valuation?.marketValue ?? null,
                        position.latestPrice?.currency ?? position.costCurrency,
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {formatMaybeMoney(
                        valuation?.unrealizedPnl ?? null,
                        position.costCurrency,
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {formatMaybePercent(valuation?.weight ?? null)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {formatEnum(position.investmentIntent)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {formatDisplayDate(position.openedAt)}
                    </td>
                    <td className="max-w-48 truncate px-4 py-3 align-top text-zinc-600">
                      {position.notes ?? ""}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <PositionActionsMenu
                        baseCurrency={baseCurrency}
                        deleteAction={deletePosition}
                        position={position}
                        updateAction={updatePosition}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CashTable({ cashBalances }: { cashBalances: CashBalance[] }) {
  return (
    <section className="rounded border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold uppercase text-zinc-500">
            Free Cash
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {cashBalances.length} balances
          </p>
        </div>
        <CashFormModal action={upsertCashBalance} mode="create" />
      </div>
      {cashBalances.length === 0 ? (
        <p className="px-4 py-8 text-sm text-zinc-600">
          No free cash balances yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Platform</th>
                <th className="px-4 py-3 font-semibold">Currency</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {cashBalances.map((cashBalance) => (
                <tr key={cashBalance.id}>
                  <td className="px-4 py-3 font-medium">
                    {cashBalance.platform}
                  </td>
                  <td className="px-4 py-3">{cashBalance.currency}</td>
                  <td className="px-4 py-3">
                    {formatMoney(cashBalance.amount, cashBalance.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <CashActionsMenu
                      cashBalance={cashBalance}
                      deleteAction={deleteCashBalance}
                      updateAction={upsertCashBalance}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
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

function formatMaybePercent(value: number | null): string {
  if (value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    style: "percent",
  }).format(value);
}

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 8,
  }).format(value);
}

function formatDisplayDate(value: Date | null): string {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-GB").format(value);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown database error";
}
