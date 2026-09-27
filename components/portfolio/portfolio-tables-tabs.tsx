"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AssetType,
  InvestmentIntent,
  PortfolioActivityType,
} from "@prisma/client";
import { CashActionsMenu } from "@/components/portfolio/cash-actions-menu";
import { CashFormModal } from "@/components/portfolio/cash-form-modal";
import { PositionActionsMenu } from "@/components/portfolio/position-actions-menu";
import { PositionFormModal } from "@/components/portfolio/position-form-modal";

type PortfolioPosition = {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  assetCurrency: string;
  exchange: string | null;
  provider: string;
  providerSymbol: string;
  platformHoldings: PositionPlatformHolding[];
  quantity: number;
  averageCost: number;
  costCurrency: string;
  investmentIntent: InvestmentIntent;
  openedAt: Date | null;
  notes: string | null;
  latestPrice: {
    price: number;
    currency: string;
    observedAt: Date;
  } | null;
};

type PositionPlatformHolding = {
  id: string;
  platform: string;
  quantity: number;
  averageCost: number;
  costCurrency: string;
  openedAt: Date | null;
  notes: string | null;
};

type PositionValuation = {
  id: string;
  marketValue: number | null;
  unrealizedPnl: number | null;
  weight: number | null;
};

type CashBalance = {
  id: string;
  platform: string;
  currency: string;
  amount: number;
};

type PortfolioExchange = {
  id: string;
  name: string;
  type: "CRYPTO" | "STOCK";
};

type PortfolioActivityLog = {
  id: string;
  type: PortfolioActivityType;
  platform: string | null;
  currency: string | null;
  amount: number | null;
  description: string;
  createdAt: Date;
};

type ActiveTab = "CRYPTO" | "STOCK" | "CASH" | "ACTIVITY";

const tabs: Array<{ id: ActiveTab; label: string }> = [
  { id: "CRYPTO", label: "Crypto" },
  { id: "STOCK", label: "Stocks" },
  { id: "CASH", label: "Cash" },
  { id: "ACTIVITY", label: "Activity" },
];

export function PortfolioTablesTabs({
  positions,
  valuationPositions,
  cashBalances,
  exchanges,
  activityLogs,
  baseCurrency,
  createPositionAction,
  updatePositionAction,
  deletePositionAction,
  sellPositionAction,
  upsertCashBalanceAction,
  withdrawCashBalanceAction,
  deleteCashBalanceAction,
  deleteActivityLogAction,
}: {
  positions: PortfolioPosition[];
  valuationPositions: PositionValuation[];
  cashBalances: CashBalance[];
  exchanges: PortfolioExchange[];
  activityLogs: PortfolioActivityLog[];
  baseCurrency: string;
  createPositionAction: (formData: FormData) => Promise<void>;
  updatePositionAction: (formData: FormData) => Promise<void>;
  deletePositionAction: (formData: FormData) => Promise<void>;
  sellPositionAction: (formData: FormData) => Promise<void>;
  upsertCashBalanceAction: (formData: FormData) => Promise<void>;
  withdrawCashBalanceAction: (formData: FormData) => Promise<void>;
  deleteCashBalanceAction: (formData: FormData) => Promise<void>;
  deleteActivityLogAction: (formData: FormData) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("CRYPTO");
  const cryptoExchangeOptions = getExchangeOptions(exchanges, "CRYPTO");
  const stockExchangeOptions = getExchangeOptions(exchanges, "STOCK");
  const cashExchangeOptions = getExchangeOptions(exchanges);

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap gap-2 border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            className={`border-b-2 px-4 py-3 text-sm font-medium ${
              activeTab === tab.id
                ? "border-zinc-950 text-zinc-950"
                : "border-transparent text-zinc-500 hover:text-zinc-950"
            } ${tab.id === "ACTIVITY" ? "ml-auto" : ""}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "CRYPTO" && (
        <PositionsTable
          addButton={
            <PositionFormModal
              action={createPositionAction}
              assetType="CRYPTO"
              baseCurrency={baseCurrency}
              cashBalances={cashBalances}
              exchangeOptions={cryptoExchangeOptions}
              mode="create"
            />
          }
          baseCurrency={baseCurrency}
          cashBalances={cashBalances}
          deleteAction={deletePositionAction}
          emptyText="No crypto positions yet."
          exchangeOptions={cryptoExchangeOptions}
          positions={positions.filter((position) => position.assetType === "CRYPTO")}
          title="Crypto"
          updateAction={updatePositionAction}
          sellAction={sellPositionAction}
          valuationPositions={valuationPositions}
        />
      )}

      {activeTab === "STOCK" && (
        <PositionsTable
          addButton={
            <PositionFormModal
              action={createPositionAction}
              assetType="STOCK"
              baseCurrency={baseCurrency}
              cashBalances={cashBalances}
              exchangeOptions={stockExchangeOptions}
              mode="create"
            />
          }
          baseCurrency={baseCurrency}
          cashBalances={cashBalances}
          deleteAction={deletePositionAction}
          emptyText="No stock or ETF positions yet."
          exchangeOptions={stockExchangeOptions}
          positions={positions.filter((position) =>
            ["STOCK", "ETF"].includes(position.assetType),
          )}
          title="Stocks & ETF"
          updateAction={updatePositionAction}
          sellAction={sellPositionAction}
          valuationPositions={valuationPositions}
        />
      )}

      {activeTab === "CASH" && (
        <CashTable
          baseCurrency={baseCurrency}
          cashBalances={cashBalances}
          deleteAction={deleteCashBalanceAction}
          exchangeOptions={cashExchangeOptions}
          upsertAction={upsertCashBalanceAction}
          withdrawAction={withdrawCashBalanceAction}
        />
      )}

      {activeTab === "ACTIVITY" && (
        <ActivityTable
          activityLogs={activityLogs}
          deleteAction={deleteActivityLogAction}
        />
      )}
    </section>
  );
}

function PositionsTable({
  title,
  positions,
  valuationPositions,
  baseCurrency,
  cashBalances,
  exchangeOptions,
  emptyText,
  addButton,
  updateAction,
  deleteAction,
  sellAction,
}: {
  title: string;
  positions: PortfolioPosition[];
  valuationPositions: PositionValuation[];
  baseCurrency: string;
  cashBalances: CashBalance[];
  exchangeOptions: string[];
  emptyText: string;
  addButton: React.ReactNode;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  sellAction: (formData: FormData) => Promise<void>;
}) {
  const [selectedPosition, setSelectedPosition] =
    useState<PortfolioPosition | null>(null);

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
                <th className="w-12 px-4 py-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {positions.map((position) => {
                const valuation = valuationPositions.find(
                  (item) => item.id === position.id,
                );

                return (
                  <tr
                    className="group cursor-pointer hover:bg-zinc-50"
                    key={position.id}
                    onClick={() => setSelectedPosition(position)}
                  >
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
                        baseCurrency,
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {formatMaybeMoney(
                        valuation?.unrealizedPnl ?? null,
                        baseCurrency,
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
                    <td
                      className="px-4 py-3 align-top"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <PositionActionsMenu
                        baseCurrency={baseCurrency}
                        cashBalances={cashBalances}
                        deleteAction={deleteAction}
                        exchangeOptions={exchangeOptions}
                        position={position}
                        sellAction={sellAction}
                        updateAction={updateAction}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {selectedPosition ? (
        <PositionPlatformHoldingsModal
          onClose={() => setSelectedPosition(null)}
          position={selectedPosition}
        />
      ) : null}
    </section>
  );
}

function PositionPlatformHoldingsModal({
  position,
  onClose,
}: {
  position: PortfolioPosition;
  onClose: () => void;
}) {
  const holdings = position.platformHoldings;
  const totalQuantity = holdings.reduce(
    (total, holding) => total + holding.quantity,
    0,
  );
  const hasBreakdownMismatch =
    holdings.length > 0 && Math.abs(totalQuantity - position.quantity) > 1e-8;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 px-4 py-6">
      <div className="max-h-full w-full max-w-3xl overflow-auto rounded border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">
              {position.symbol} platform breakdown
            </h2>
            <p className="mt-1 text-sm text-zinc-600">{position.name}</p>
          </div>
          <button
            className="rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailMetric
              label="Total quantity"
              value={formatNumber(position.quantity)}
            />
            <DetailMetric
              label="Average cost"
              value={formatMoney(position.averageCost, position.costCurrency)}
            />
            <DetailMetric
              label="Cost basis"
              value={formatMoney(
                position.quantity * position.averageCost,
                position.costCurrency,
              )}
            />
          </div>

          {hasBreakdownMismatch ? (
            <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Platform rows total {formatNumber(totalQuantity)}, while the
              aggregate position total is {formatNumber(position.quantity)}.
              Edit the position to reconcile the breakdown.
            </p>
          ) : null}

          {holdings.length === 0 ? (
            <p className="rounded border border-zinc-200 bg-zinc-50 px-3 py-6 text-sm text-zinc-600">
              No platform breakdown has been recorded for this position yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded border border-zinc-200">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Exchange</th>
                    <th className="px-4 py-3 font-semibold">Quantity</th>
                    <th className="px-4 py-3 font-semibold">Avg cost</th>
                    <th className="px-4 py-3 font-semibold">Cost basis</th>
                    <th className="px-4 py-3 font-semibold">Opened</th>
                    <th className="px-4 py-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {holdings.map((holding) => (
                    <tr key={holding.id}>
                      <td className="px-4 py-3 font-medium">
                        {holding.platform}
                      </td>
                      <td className="px-4 py-3">
                        {formatNumber(holding.quantity)}
                      </td>
                      <td className="px-4 py-3">
                        {formatMoney(
                          holding.averageCost,
                          holding.costCurrency,
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {formatMoney(
                          holding.quantity * holding.averageCost,
                          holding.costCurrency,
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {formatDisplayDate(holding.openedAt)}
                      </td>
                      <td className="max-w-52 truncate px-4 py-3 text-zinc-600">
                        {holding.notes ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-zinc-200 bg-zinc-50 font-medium">
                  <tr>
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3">{formatNumber(totalQuantity)}</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function CashTable({
  cashBalances,
  baseCurrency,
  exchangeOptions,
  upsertAction,
  withdrawAction,
  deleteAction,
}: {
  cashBalances: CashBalance[];
  baseCurrency: string;
  exchangeOptions: string[];
  upsertAction: (formData: FormData) => Promise<void>;
  withdrawAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
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
        <CashFormModal
          action={upsertAction}
          baseCurrency={baseCurrency}
          exchangeOptions={exchangeOptions}
          mode="create"
        />
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
                <th className="px-4 py-3 font-semibold">Exchange</th>
                <th className="px-4 py-3 font-semibold">Currency</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="w-12 px-4 py-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {cashBalances.map((cashBalance) => (
                <tr className="group hover:bg-zinc-50" key={cashBalance.id}>
                  <td className="px-4 py-3 font-medium">
                    {cashBalance.platform}
                  </td>
                  <td className="px-4 py-3">{cashBalance.currency}</td>
                  <td className="px-4 py-3">
                    {formatMoney(cashBalance.amount, cashBalance.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <CashActionsMenu
                      baseCurrency={baseCurrency}
                      cashBalance={cashBalance}
                      cashBalances={cashBalances}
                      deleteAction={deleteAction}
                      exchangeOptions={exchangeOptions}
                      updateAction={upsertAction}
                      withdrawAction={withdrawAction}
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

function ActivityTable({
  activityLogs,
  deleteAction,
}: {
  activityLogs: PortfolioActivityLog[];
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [activityLogToDelete, setActivityLogToDelete] =
    useState<PortfolioActivityLog | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), type === "success" ? 3500 : 5000);
  }

  return (
    <section className="rounded border border-zinc-200 bg-white">
      {toast ? <Toast message={toast.message} type={toast.type} /> : null}
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase text-zinc-500">
          Activity
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          {activityLogs.length} log entries
        </p>
      </div>
      {activityLogs.length === 0 ? (
        <p className="px-4 py-8 text-sm text-zinc-600">
          No portfolio activity yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Exchange</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Details</th>
                <th className="w-12 px-4 py-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {activityLogs.map((activityLog) => (
                <tr className="group hover:bg-zinc-50" key={activityLog.id}>
                  <td className="px-4 py-3 align-top">
                    {formatDisplayDateTime(activityLog.createdAt)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {formatEnum(activityLog.type)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {activityLog.platform ?? "N/A"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {activityLog.amount !== null && activityLog.currency
                      ? formatMoney(activityLog.amount, activityLog.currency)
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-600">
                    {activityLog.description}
                  </td>
                  <td className="px-4 py-2 align-top">
                    <button
                      aria-label="Delete activity log"
                      className="grid size-8 place-items-center rounded border border-red-200 text-red-700 opacity-0 transition hover:bg-red-50 group-hover:opacity-100 focus:opacity-100"
                      onClick={() => setActivityLogToDelete(activityLog)}
                      title="Delete"
                      type="button"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {activityLogToDelete ? (
        <ActivityLogDeleteModal
          action={deleteAction}
          activityLog={activityLogToDelete}
          onClose={() => setActivityLogToDelete(null)}
          onDeleted={() => showToast("Activity log deleted.", "success")}
          onError={(message) => showToast(message, "error")}
        />
      ) : null}
    </section>
  );
}

function ActivityLogDeleteModal({
  activityLog,
  action,
  onClose,
  onDeleted,
  onError,
}: {
  activityLog: PortfolioActivityLog;
  action: (formData: FormData) => Promise<void>;
  onClose: () => void;
  onDeleted: () => void;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);

    try {
      await action(formData);
      onClose();
      onDeleted();
      router.refresh();
    } catch (error) {
      onError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-zinc-950/40 px-4 py-6">
      <div className="w-full max-w-md rounded border border-zinc-200 bg-white shadow-xl">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-base font-semibold">Delete activity log?</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            This removes the selected history entry from the activity table.
          </p>
          <p className="mt-3 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {activityLog.description}
          </p>
        </div>
        <form className="flex justify-end gap-2 px-5 py-4" onSubmit={handleSubmit}>
          <input
            name="activityLogId"
            type="hidden"
            value={activityLog.id}
          />
          <button
            className="h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-9 rounded bg-red-700 px-3 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Toast({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) {
  return (
    <div
      className={`fixed right-5 top-5 z-[60] rounded border px-4 py-3 text-sm font-medium shadow-lg ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      {message}
    </div>
  );
}

function TrashIcon() {
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to delete activity log.";
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

function formatDisplayDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getExchangeOptions(
  exchanges: PortfolioExchange[],
  type?: PortfolioExchange["type"],
): string[] {
  return exchanges
    .filter((exchange) => !type || exchange.type === type)
    .map((exchange) => exchange.name)
    .sort((left, right) => left.localeCompare(right));
}
