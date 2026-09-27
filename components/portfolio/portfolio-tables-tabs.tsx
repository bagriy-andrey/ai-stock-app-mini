"use client";

import { useState } from "react";
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

type PortfolioActivityLog = {
  id: string;
  type: PortfolioActivityType;
  platform: string | null;
  currency: string | null;
  amount: number | null;
  description: string;
  createdAt: Date;
};

type ActiveTab = "CRYPTO" | "STOCK" | "ETF" | "CASH" | "ACTIVITY";

const tabs: Array<{ id: ActiveTab; label: string }> = [
  { id: "CRYPTO", label: "Crypto" },
  { id: "STOCK", label: "Stocks" },
  { id: "ETF", label: "ETF" },
  { id: "CASH", label: "Cash" },
  { id: "ACTIVITY", label: "Activity" },
];

export function PortfolioTablesTabs({
  positions,
  valuationPositions,
  cashBalances,
  activityLogs,
  baseCurrency,
  createPositionAction,
  updatePositionAction,
  deletePositionAction,
  upsertCashBalanceAction,
  withdrawCashBalanceAction,
  deleteCashBalanceAction,
}: {
  positions: PortfolioPosition[];
  valuationPositions: PositionValuation[];
  cashBalances: CashBalance[];
  activityLogs: PortfolioActivityLog[];
  baseCurrency: string;
  createPositionAction: (formData: FormData) => Promise<void>;
  updatePositionAction: (formData: FormData) => Promise<void>;
  deletePositionAction: (formData: FormData) => Promise<void>;
  upsertCashBalanceAction: (formData: FormData) => Promise<void>;
  withdrawCashBalanceAction: (formData: FormData) => Promise<void>;
  deleteCashBalanceAction: (formData: FormData) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("CRYPTO");
  const exchangeOptions = getExchangeOptions(positions, cashBalances);

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
              exchangeOptions={exchangeOptions}
              mode="create"
            />
          }
          baseCurrency={baseCurrency}
          cashBalances={cashBalances}
          deleteAction={deletePositionAction}
          emptyText="No crypto positions yet."
          exchangeOptions={exchangeOptions}
          positions={positions.filter((position) => position.assetType === "CRYPTO")}
          title="Crypto"
          updateAction={updatePositionAction}
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
              exchangeOptions={exchangeOptions}
              mode="create"
            />
          }
          baseCurrency={baseCurrency}
          cashBalances={cashBalances}
          deleteAction={deletePositionAction}
          emptyText="No stock positions yet."
          exchangeOptions={exchangeOptions}
          positions={positions.filter((position) => position.assetType === "STOCK")}
          title="Stocks"
          updateAction={updatePositionAction}
          valuationPositions={valuationPositions}
        />
      )}

      {activeTab === "ETF" && (
        <PositionsTable
          addButton={
            <PositionFormModal
              action={createPositionAction}
              assetType="ETF"
              baseCurrency={baseCurrency}
              cashBalances={cashBalances}
              exchangeOptions={exchangeOptions}
              mode="create"
            />
          }
          baseCurrency={baseCurrency}
          cashBalances={cashBalances}
          deleteAction={deletePositionAction}
          emptyText="No ETF positions yet."
          exchangeOptions={exchangeOptions}
          positions={positions.filter((position) => position.assetType === "ETF")}
          title="ETF"
          updateAction={updatePositionAction}
          valuationPositions={valuationPositions}
        />
      )}

      {activeTab === "CASH" && (
        <CashTable
          baseCurrency={baseCurrency}
          cashBalances={cashBalances}
          deleteAction={deleteCashBalanceAction}
          exchangeOptions={exchangeOptions}
          upsertAction={upsertCashBalanceAction}
          withdrawAction={withdrawCashBalanceAction}
        />
      )}

      {activeTab === "ACTIVITY" && (
        <ActivityTable activityLogs={activityLogs} />
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
                    <td className="px-4 py-3 align-top">
                      <PositionActionsMenu
                        baseCurrency={baseCurrency}
                        cashBalances={cashBalances}
                        deleteAction={deleteAction}
                        exchangeOptions={exchangeOptions}
                        position={position}
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
    </section>
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
}: {
  activityLogs: PortfolioActivityLog[];
}) {
  return (
    <section className="rounded border border-zinc-200 bg-white">
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
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Exchange</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {activityLogs.map((activityLog) => (
                <tr key={activityLog.id}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
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

function formatDisplayDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getExchangeOptions(
  positions: PortfolioPosition[],
  cashBalances: CashBalance[],
): string[] {
  return Array.from(
    new Set(
      [
        ...positions.map((position) => position.exchange ?? ""),
        ...cashBalances.map((cashBalance) => cashBalance.platform),
      ]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));
}
