import Link from "next/link";
import {
  createPosition,
  deleteCashBalance,
  deletePosition,
  updatePosition,
  upsertCashBalance,
} from "@/app/portfolio/actions";
import { PositionFormModal } from "@/components/portfolio/position-form-modal";
import { getPortfolioSummary } from "@/lib/portfolio/repository";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  let portfolio: Awaited<ReturnType<typeof getPortfolioSummary>>;

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

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            <section className="rounded border border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                <h2 className="text-sm font-semibold uppercase text-zinc-500">
                  Holdings
                </h2>
                <PositionFormModal
                  action={createPosition}
                  baseCurrency={portfolio.baseCurrency}
                  mode="create"
                />
              </div>
              {portfolio.positions.length === 0 ? (
                <p className="px-4 py-8 text-sm text-zinc-600">
                  No positions yet. Add the first holding from the button above.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                    <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Asset</th>
                        <th className="px-4 py-3 font-semibold">Type</th>
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
                      {portfolio.positions.map((position) => {
                        const valuation = portfolio.valuation.positions.find(
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
                                {position.exchange
                                  ? ` / ${position.exchange}`
                                  : ""}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              {position.assetType}
                            </td>
                            <td className="px-4 py-3 align-top">
                              {formatNumber(position.quantity)}
                            </td>
                            <td className="px-4 py-3 align-top">
                              {formatMoney(
                                position.averageCost,
                                position.costCurrency,
                              )}
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
                                position.latestPrice?.currency ??
                                  position.costCurrency,
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
                              <div className="flex gap-2">
                                <PositionFormModal
                                  action={updatePosition}
                                  baseCurrency={portfolio.baseCurrency}
                                  mode="edit"
                                  position={position}
                                />
                                <form action={deletePosition}>
                                  <input
                                    name="positionId"
                                    type="hidden"
                                    value={position.id}
                                  />
                                  <button
                                    className={secondaryButtonClassName}
                                    type="submit"
                                  >
                                    Delete
                                  </button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-5">
            <section className="rounded border border-zinc-200 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase text-zinc-500">
                Cash
              </h2>
              <form action={upsertCashBalance} className="mt-4 grid gap-3">
                <div className="grid grid-cols-[1fr_1.4fr] gap-3">
                  <Field label="Currency">
                    <input
                      className={inputClassName}
                      defaultValue={portfolio.baseCurrency}
                      maxLength={3}
                      minLength={3}
                      name="currency"
                      required
                    />
                  </Field>
                  <Field label="Amount">
                    <input
                      className={inputClassName}
                      min="0"
                      name="amount"
                      required
                      step="any"
                      type="number"
                    />
                  </Field>
                </div>
                <button className={primaryButtonClassName} type="submit">
                  Save cash
                </button>
              </form>

              <div className="mt-4 divide-y divide-zinc-200 border-t border-zinc-200">
                {portfolio.cashBalances.length === 0 ? (
                  <p className="py-4 text-sm text-zinc-600">
                    No cash balances yet.
                  </p>
                ) : (
                  portfolio.cashBalances.map((cashBalance) => (
                    <div
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                      key={cashBalance.id}
                    >
                      <div>
                        <p className="font-medium">{cashBalance.currency}</p>
                        <p className="text-zinc-600">
                          {formatMoney(cashBalance.amount, cashBalance.currency)}
                        </p>
                      </div>
                      <DeleteButton
                        action={deleteCashBalance}
                        hiddenName="cashBalanceId"
                        hiddenValue={cashBalance.id}
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-zinc-500">
      {label}
      {children}
    </label>
  );
}

function DeleteButton({
  action,
  hiddenName,
  hiddenValue,
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenName: string;
  hiddenValue: string;
}) {
  return (
    <form action={action}>
      <input name={hiddenName} type="hidden" value={hiddenValue} />
      <button className={secondaryButtonClassName} type="submit">
        Delete
      </button>
    </form>
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

const inputClassName =
  "h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-950 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

const primaryButtonClassName =
  "h-9 rounded bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800";

const secondaryButtonClassName =
  "h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100";
