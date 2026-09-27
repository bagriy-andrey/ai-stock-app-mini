"use client";

import { useEffect, useState } from "react";
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
import { PositionSellModal } from "@/components/portfolio/position-sell-modal";

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
          createAction={createPositionAction}
          activityLogs={activityLogs}
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
          createAction={createPositionAction}
          activityLogs={activityLogs}
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
  createAction,
  activityLogs,
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
  createAction: (formData: FormData) => Promise<void>;
  activityLogs: PortfolioActivityLog[];
}) {
  const [selectedPosition, setSelectedPosition] =
    useState<PortfolioPosition | null>(null);
  const [positionToSell, setPositionToSell] =
    useState<PortfolioPosition | null>(null);
  const [positionToBuy, setPositionToBuy] =
    useState<PortfolioPosition | null>(null);

  function openSellModal(position: PortfolioPosition) {
    setSelectedPosition(null);
    setPositionToSell(position);
  }

  function openBuyModal(position: PortfolioPosition) {
    setSelectedPosition(null);
    setPositionToBuy(position);
  }

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
          activityLogs={activityLogs}
          onClose={() => setSelectedPosition(null)}
          onBuy={openBuyModal}
          onSell={openSellModal}
          position={selectedPosition}
        />
      ) : null}
      {positionToSell ? (
        <PositionSellModal
          action={sellAction}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setPositionToSell(null);
            }
          }}
          position={positionToSell}
          showTrigger={false}
        />
      ) : null}
      {positionToBuy ? (
        <PositionFormModal
          action={createAction}
          assetType={positionToBuy.assetType}
          baseCurrency={baseCurrency}
          cashBalances={cashBalances}
          exchangeOptions={exchangeOptions}
          initialAsset={positionToBuy}
          isOpen
          mode="create"
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setPositionToBuy(null);
            }
          }}
          showTrigger={false}
        />
      ) : null}
    </section>
  );
}

function PositionPlatformHoldingsModal({
  position,
  onClose,
  activityLogs,
  onBuy,
  onSell,
}: {
  position: PortfolioPosition;
  onClose: () => void;
  activityLogs: PortfolioActivityLog[];
  onBuy: (position: PortfolioPosition) => void;
  onSell: (position: PortfolioPosition) => void;
}) {
  const [activeTab, setActiveTab] = useState<AssetModalTab>("INFO");
  const holdings = position.platformHoldings;
  const totalQuantity = holdings.reduce(
    (total, holding) => total + holding.quantity,
    0,
  );
  const hasBreakdownMismatch =
    holdings.length > 0 && Math.abs(totalQuantity - position.quantity) > 1e-8;
  const relatedActivityLogs = activityLogs.filter((activityLog) =>
    activityLog.description.toUpperCase().includes(position.symbol.toUpperCase()),
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 px-4 py-6">
      <div className="flex h-[min(760px,calc(100vh-3rem))] w-[min(960px,calc(100vw-2rem))] flex-col overflow-hidden rounded border border-zinc-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">
              {position.symbol} platform breakdown
            </h2>
            <p className="mt-1 text-sm text-zinc-600">{position.name}</p>
          </div>
          <button
            aria-label="Close asset modal"
            className="grid size-8 shrink-0 place-items-center rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
            onClick={onClose}
            title="Close"
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="shrink-0 border-b border-zinc-200 px-5">
          <div className="flex flex-wrap gap-2">
            {assetModalTabs.map((tab) => (
              <button
                className={`border-b-2 px-3 py-3 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-zinc-950 text-zinc-950"
                    : "border-transparent text-zinc-500 hover:text-zinc-950"
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
          <div className="grid gap-4">
          {activeTab === "INFO" ? (
            <AssetInfoTab
              hasBreakdownMismatch={hasBreakdownMismatch}
              holdings={holdings}
              position={position}
              totalQuantity={totalQuantity}
            />
          ) : null}

          {activeTab === "IMPORTANT" ? (
            <AssetImportantInfoTab position={position} />
          ) : null}

          {activeTab === "CHART" ? (
            <AssetPlatformChartTab holdings={holdings} totalQuantity={totalQuantity} />
          ) : null}

          {activeTab === "LOGS" ? (
            <AssetLogsTab activityLogs={relatedActivityLogs} />
          ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4">
          <button
            className={secondaryButtonClassName}
            onClick={onClose}
            type="button"
          >
            Close
          </button>
          <div className="flex gap-2">
            <button
              className={secondaryButtonClassName}
              onClick={() => onSell(position)}
              type="button"
            >
              Sell
            </button>
            <button
              className={primaryButtonClassName}
              onClick={() => onBuy(position)}
              type="button"
            >
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type AssetModalTab = "INFO" | "IMPORTANT" | "CHART" | "LOGS";

const assetModalTabs: Array<{ id: AssetModalTab; label: string }> = [
  { id: "INFO", label: "Information" },
  { id: "IMPORTANT", label: "Important info" },
  { id: "CHART", label: "Platform chart" },
  { id: "LOGS", label: "Logs" },
];

function AssetInfoTab({
  position,
  holdings,
  totalQuantity,
  hasBreakdownMismatch,
}: {
  position: PortfolioPosition;
  holdings: PositionPlatformHolding[];
  totalQuantity: number;
  hasBreakdownMismatch: boolean;
}) {
  return (
    <>
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
        <PlatformHoldingsTable
          holdings={holdings}
          totalQuantity={totalQuantity}
        />
      )}
    </>
  );
}

type AssetProfile = {
  source: string;
  summary: string | null;
  website: string | null;
  sector: string | null;
  industry: string | null;
  country: string | null;
  currentPrice: number | null;
  priceCurrency: string;
  priceChange24hPercent: number | null;
  priceChange7dPercent: number | null;
  priceChange30dPercent: number | null;
  marketCap: number | null;
  fullyDilutedValuation: number | null;
  totalVolume24h: number | null;
  rank: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  ath: number | null;
  athChangePercent: number | null;
  atl: number | null;
  atlChangePercent: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  beta: number | null;
  peRatio: number | null;
  eps: number | null;
  volume: number | null;
  averageVolume: number | null;
};

function AssetImportantInfoTab({ position }: { position: PortfolioPosition }) {
  const [profile, setProfile] = useState<AssetProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    let isActive = true;
    const params = new URLSearchParams({
      name: position.name,
      provider: position.provider,
      providerSymbol: position.providerSymbol,
      symbol: position.symbol,
      type: position.assetType,
    });

    fetch(`/api/assets/profile?${params}`)
      .then((response) => (response.ok ? response.json() : { profile: null }))
      .then((data: { profile?: AssetProfile | null }) => {
        if (!isActive) {
          return;
        }

        setProfile(data.profile ?? null);
        setStatus(data.profile ? "ready" : "empty");
      })
      .catch(() => {
        if (isActive) {
          setStatus("empty");
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    position.assetType,
    position.name,
    position.provider,
    position.providerSymbol,
    position.symbol,
  ]);

  if (status === "loading") {
    return (
      <p className="rounded border border-zinc-200 bg-zinc-50 px-3 py-6 text-sm text-zinc-600">
        Loading asset information...
      </p>
    );
  }

  if (!profile) {
    return (
      <p className="rounded border border-zinc-200 bg-zinc-50 px-3 py-6 text-sm text-zinc-600">
        No provider profile is available for this asset yet.
      </p>
    );
  }

  return position.assetType === "CRYPTO" ? (
    <CryptoImportantInfo position={position} profile={profile} />
  ) : (
    <EquityImportantInfo position={position} profile={profile} />
  );
}

function CryptoImportantInfo({
  position,
  profile,
}: {
  position: PortfolioPosition;
  profile: AssetProfile;
}) {
  return (
    <div className="grid gap-5">
      <MarketSnapshot
        profile={profile}
        subtitle={`${profile.source}${profile.rank === null ? "" : ` / market cap rank #${profile.rank}`}`}
        title="Crypto market snapshot"
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InsightMetric
          label="Market cap"
          value={formatMaybeLargeMoney(profile.marketCap, "USD")}
        />
        <InsightMetric
          detail={getFdvDetail(profile)}
          label="FDV"
          value={formatMaybeLargeMoney(profile.fullyDilutedValuation, "USD")}
        />
        <InsightMetric
          detail={getVolumeDetail(profile)}
          label="24h volume"
          value={formatMaybeLargeMoney(profile.totalVolume24h, "USD")}
        />
        <InsightMetric
          label="Category"
          value={profile.sector ?? "N/A"}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <SupplyPanel profile={profile} symbol={position.symbol} />
        <AthPanel profile={profile} />
      </section>

      <ImportantDetails
        rows={[
          ["Source", profile.source],
          ["Website", getWebsiteLink(profile.website)],
        ]}
        takeaways={getCryptoTakeaways(profile, position)}
      />

      <SummaryDetails label="Project summary" profile={profile} />
    </div>
  );
}

function EquityImportantInfo({
  position,
  profile,
}: {
  position: PortfolioPosition;
  profile: AssetProfile;
}) {
  return (
    <div className="grid gap-5">
      <MarketSnapshot
        profile={profile}
        subtitle={`${profile.source}${profile.sector ? ` / ${profile.sector}` : ""}`}
        title={position.assetType === "ETF" ? "ETF market snapshot" : "Equity market snapshot"}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InsightMetric
          label="Market cap"
          value={formatMaybeLargeMoney(profile.marketCap, "USD")}
        />
        <InsightMetric
          label="P/E"
          value={formatMaybeNumber(profile.peRatio)}
        />
        <InsightMetric label="EPS" value={formatMaybeNumber(profile.eps)} />
        <InsightMetric
          label="Beta"
          value={formatMaybeNumber(profile.beta)}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <InsightMetric label="52w range" value={getYearRange(profile)} />
        <InsightMetric
          detail={getAverageVolumeDetail(profile)}
          label="Volume"
          value={formatMaybeLargeNumber(profile.volume)}
        />
        <InsightMetric
          label="Avg volume"
          value={formatMaybeLargeNumber(profile.averageVolume)}
        />
      </section>

      <ImportantDetails
        rows={[
          ["Sector", profile.sector],
          ["Industry", profile.industry],
          ["Country", profile.country],
          ["Website", getWebsiteLink(profile.website)],
        ]}
        takeaways={getEquityTakeaways(profile, position)}
      />

      <SummaryDetails label="Business summary" profile={profile} />
    </div>
  );
}

function MarketSnapshot({
  title,
  subtitle,
  profile,
}: {
  title: string;
  subtitle: string;
  profile: AssetProfile;
}) {
  return (
    <section className="grid gap-3 rounded border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-[1.2fr_2fr]">
      <div>
        <p className="text-xs font-medium uppercase text-zinc-500">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-zinc-950">
          {profile.currentPrice === null
            ? "N/A"
            : formatMoney(profile.currentPrice, profile.priceCurrency)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <ChangeMetric label="24h" value={profile.priceChange24hPercent} />
        <ChangeMetric label="7d" value={profile.priceChange7dPercent} />
        <ChangeMetric label="30d" value={profile.priceChange30dPercent} />
      </div>
    </section>
  );
}

function ImportantDetails({
  rows,
  takeaways,
}: {
  rows: Array<[string, React.ReactNode]>;
  takeaways: string[];
}) {
  return (
    <section className="grid gap-3 md:grid-cols-[1fr_1.4fr]">
      <div className="overflow-hidden rounded border border-zinc-200">
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-zinc-200">
            {rows.map(([label, value]) => (
              <ProfileRow key={label} label={label} value={value} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-3">
        <p className="text-xs font-medium uppercase text-zinc-500">
          What matters
        </p>
        <ul className="mt-2 grid gap-2 text-sm leading-6 text-zinc-700">
          {takeaways.map((takeaway) => (
            <li key={takeaway}>{takeaway}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SummaryDetails({
  label,
  profile,
}: {
  label: string;
  profile: AssetProfile;
}) {
  return (
    <details className="rounded border border-zinc-200 bg-white px-3 py-3">
      <summary className="cursor-pointer text-xs font-medium uppercase text-zinc-500">
        {label}
      </summary>
      <p className="mt-2 max-h-36 overflow-auto text-sm leading-6 text-zinc-700">
        {profile.summary ?? "No summary available."}
      </p>
    </details>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <tr>
      <th className="w-36 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase text-zinc-500">
        {label}
      </th>
      <td className="px-4 py-3 text-zinc-700">{value ?? "N/A"}</td>
    </tr>
  );
}

function ChangeMetric({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded border border-zinc-200 bg-white px-3 py-2">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${getChangeClassName(value)}`}>
        {formatSignedPercent(value)}
      </p>
    </div>
  );
}

function InsightMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded border border-zinc-200 bg-white px-3 py-3">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-zinc-950">{value}</p>
      {detail ? <p className="mt-1 text-xs text-zinc-500">{detail}</p> : null}
    </div>
  );
}

function SupplyPanel({
  profile,
  symbol,
}: {
  profile: AssetProfile;
  symbol: string;
}) {
  const supplyCap = profile.maxSupply ?? profile.totalSupply;
  const supplyProgress =
    profile.circulatingSupply !== null && supplyCap
      ? Math.min(profile.circulatingSupply / supplyCap, 1)
      : null;

  return (
    <div className="rounded border border-zinc-200 bg-white px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">Supply</p>
          <p className="mt-1 text-base font-semibold text-zinc-950">
            {formatMaybeLargeNumber(profile.circulatingSupply)} {symbol}
          </p>
        </div>
        <p className="text-right text-xs text-zinc-500">
          cap {formatMaybeLargeNumber(supplyCap)}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded bg-zinc-100">
        <div
          className="h-full bg-emerald-600"
          style={{
            width:
              supplyProgress === null
                ? "0%"
                : `${Math.max(supplyProgress * 100, 2)}%`,
          }}
        />
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        {supplyProgress === null
          ? "Supply cap unavailable"
          : `${formatMaybePercent(supplyProgress)} circulating`}
      </p>
    </div>
  );
}

function AthPanel({ profile }: { profile: AssetProfile }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <InsightMetric
        detail={formatSignedPercent(profile.athChangePercent)}
        label="ATH"
        value={formatMaybeLargeMoney(profile.ath, profile.priceCurrency)}
      />
      <InsightMetric
        detail={formatSignedPercent(profile.atlChangePercent)}
        label="ATL"
        value={formatMaybeLargeMoney(profile.atl, profile.priceCurrency)}
      />
    </div>
  );
}

function getCryptoTakeaways(
  profile: AssetProfile,
  position: PortfolioPosition,
): string[] {
  const takeaways: string[] = [];

  if (profile.marketCap !== null) {
    takeaways.push(
      `${position.symbol} is a ${formatLargeMoney(profile.marketCap, "USD")} asset by market cap${profile.rank === null ? "." : `, ranked #${profile.rank}.`}`,
    );
  }

  if (profile.totalVolume24h !== null && profile.marketCap !== null) {
    takeaways.push(
      `24h turnover is ${formatMaybePercent(profile.totalVolume24h / profile.marketCap)} of market cap, useful as a liquidity signal.`,
    );
  }

  if (profile.fullyDilutedValuation !== null && profile.marketCap !== null) {
    takeaways.push(
      `FDV is ${formatMaybePercent(profile.fullyDilutedValuation / profile.marketCap)} of market cap, useful for dilution risk.`,
    );
  }

  if (profile.athChangePercent !== null) {
    takeaways.push(
      `Distance from all-time high is ${formatSignedPercent(profile.athChangePercent)}.`,
    );
  }

  if (profile.priceChange7dPercent !== null) {
    takeaways.push(
      `7d momentum is ${formatSignedPercent(profile.priceChange7dPercent)}.`,
    );
  }

  if (takeaways.length === 0) {
    takeaways.push(
      "Crypto market metrics are limited for this asset. Check liquidity, supply, and exchange risk before acting.",
    );
  }

  return takeaways;
}

function getEquityTakeaways(
  profile: AssetProfile,
  position: PortfolioPosition,
): string[] {
  const takeaways: string[] = [];

  if (profile.marketCap !== null) {
    takeaways.push(
      `${position.symbol} is a ${formatLargeMoney(profile.marketCap, "USD")} ${position.assetType === "ETF" ? "fund" : "company"} by market cap.`,
    );
  }

  if (profile.peRatio !== null) {
    takeaways.push(`Valuation: current P/E is ${formatNumber(profile.peRatio)}.`);
  }

  if (profile.beta !== null) {
    takeaways.push(
      `Market sensitivity: beta is ${formatNumber(profile.beta)}.`,
    );
  }

  if (profile.yearLow !== null && profile.yearHigh !== null && profile.currentPrice !== null) {
    const rangePosition =
      (profile.currentPrice - profile.yearLow) /
      (profile.yearHigh - profile.yearLow);

    if (Number.isFinite(rangePosition)) {
      takeaways.push(
        `Price sits around ${formatMaybePercent(rangePosition)} of its 52w range.`,
      );
    }
  }

  if (profile.volume !== null && profile.averageVolume !== null) {
    takeaways.push(
      `Current volume is ${formatMaybePercent(profile.volume / profile.averageVolume)} of average volume.`,
    );
  }

  if (takeaways.length === 0) {
    takeaways.push(
      "Equity metrics are limited for this asset. Add FMP_API_KEY or verify the ticker provider to load valuation and liquidity context.",
    );
  }

  return takeaways;
}

function getFdvDetail(profile: AssetProfile): string | undefined {
  if (profile.fullyDilutedValuation === null || profile.marketCap === null) {
    return undefined;
  }

  return `${formatMaybePercent(profile.fullyDilutedValuation / profile.marketCap - 1)} vs market cap`;
}

function getVolumeDetail(profile: AssetProfile): string | undefined {
  if (profile.totalVolume24h === null || profile.marketCap === null) {
    return undefined;
  }

  return `${formatMaybePercent(profile.totalVolume24h / profile.marketCap)} of market cap`;
}

function getAverageVolumeDetail(profile: AssetProfile): string | undefined {
  if (profile.volume === null || profile.averageVolume === null) {
    return undefined;
  }

  return `${formatMaybePercent(profile.volume / profile.averageVolume)} of average`;
}

function getYearRange(profile: AssetProfile): string {
  if (profile.yearLow === null || profile.yearHigh === null) {
    return "N/A";
  }

  return `${formatMoney(profile.yearLow, profile.priceCurrency)} - ${formatMoney(profile.yearHigh, profile.priceCurrency)}`;
}

function getWebsiteLink(website: string | null): React.ReactNode {
  if (!website) {
    return null;
  }

  return (
    <a
      className="text-emerald-700 hover:underline"
      href={website}
      rel="noreferrer"
      target="_blank"
    >
      {website}
    </a>
  );
}

function AssetPlatformChartTab({
  holdings,
  totalQuantity,
}: {
  holdings: PositionPlatformHolding[];
  totalQuantity: number;
}) {
  const [tooltip, setTooltip] = useState<{
    slice: PieSlice;
    x: number;
    y: number;
  } | null>(null);
  const slices = getPieSlices(holdings, totalQuantity);
  const chartBackground =
    slices.length === 0
      ? "#e4e4e7"
      : `conic-gradient(${slices
          .map((slice) => `${slice.color} ${slice.start}% ${slice.end}%`)
          .join(", ")})`;

  return (
    <div className="grid gap-5 md:grid-cols-[260px_1fr] md:items-center">
      <div
        className="relative mx-auto grid size-56 place-items-center rounded-full border border-zinc-200"
        onMouseLeave={() => setTooltip(null)}
        onMouseMove={(event) => {
          const slice = getSliceAtPointer(event, slices);

          if (!slice) {
            setTooltip(null);
            return;
          }

          setTooltip({
            slice,
            x: event.clientX,
            y: event.clientY,
          });
        }}
        style={{ background: chartBackground }}
      >
        <div className="grid size-28 place-items-center rounded-full bg-white text-center shadow-sm">
          <span className="text-xs font-medium uppercase text-zinc-500">
            Quantity
          </span>
          <span className="text-sm font-semibold text-zinc-950">
            {formatNumber(totalQuantity)}
          </span>
        </div>
        {tooltip ? (
          <div
            className="pointer-events-none fixed z-[80] rounded border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 shadow-lg"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y + 12,
            }}
          >
            <div className="font-semibold text-zinc-950">
              {tooltip.slice.label}
            </div>
            <div>{formatNumber(tooltip.slice.quantity)}</div>
            <div>{formatMaybePercent(tooltip.slice.share)}</div>
          </div>
        ) : null}
      </div>
      <div className="overflow-hidden rounded border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Exchange</th>
              <th className="px-4 py-3 font-semibold">Quantity</th>
              <th className="px-4 py-3 font-semibold">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {slices.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-600" colSpan={3}>
                  No platform quantity to chart.
                </td>
              </tr>
            ) : (
              slices.map((slice) => (
                <tr key={slice.label}>
                  <td className="px-4 py-3">
                    <span className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: slice.color }} />
                    {slice.label}
                  </td>
                  <td className="px-4 py-3">{formatNumber(slice.quantity)}</td>
                  <td className="px-4 py-3">{formatMaybePercent(slice.share)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssetLogsTab({
  activityLogs,
}: {
  activityLogs: PortfolioActivityLog[];
}) {
  if (activityLogs.length === 0) {
    return (
      <p className="rounded border border-zinc-200 bg-zinc-50 px-3 py-6 text-sm text-zinc-600">
        No activity logs are linked to this asset yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-zinc-200">
      <table className="w-full min-w-[720px] text-left text-sm">
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
  );
}

function PlatformHoldingsTable({
  holdings,
  totalQuantity,
}: {
  holdings: PositionPlatformHolding[];
  totalQuantity: number;
}) {
  return (
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
              <td className="px-4 py-3 font-medium">{holding.platform}</td>
              <td className="px-4 py-3">{formatNumber(holding.quantity)}</td>
              <td className="px-4 py-3">
                {formatMoney(holding.averageCost, holding.costCurrency)}
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
  );
}

function getPieSlices(
  holdings: PositionPlatformHolding[],
  totalQuantity: number,
): PieSlice[] {
  if (totalQuantity <= 0) {
    return [];
  }

  let cursor = 0;

  return holdings.map((holding, index) => {
    const share = holding.quantity / totalQuantity;
    const start = cursor;
    const end = index === holdings.length - 1 ? 100 : cursor + share * 100;

    cursor = end;

    return {
      label: holding.platform,
      quantity: holding.quantity,
      share,
      start,
      end,
      color: pieChartColors[index % pieChartColors.length],
    };
  });
}

type PieSlice = {
  label: string;
  quantity: number;
  share: number;
  start: number;
  end: number;
  color: string;
};

function getSliceAtPointer(
  event: React.MouseEvent<HTMLDivElement>,
  slices: PieSlice[],
): PieSlice | null {
  if (slices.length === 0) {
    return null;
  }

  const rect = event.currentTarget.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const offsetX = event.clientX - centerX;
  const offsetY = event.clientY - centerY;
  const radius = Math.sqrt(offsetX ** 2 + offsetY ** 2);
  const outerRadius = rect.width / 2;
  const innerRadius = outerRadius * 0.5;

  if (radius < innerRadius || radius > outerRadius) {
    return null;
  }

  const degrees = (Math.atan2(offsetY, offsetX) * 180) / Math.PI;
  const percent = ((degrees + 90 + 360) % 360) / 360 * 100;

  return (
    slices.find((slice) => percent >= slice.start && percent <= slice.end) ??
    null
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

function CloseIcon() {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
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

function formatLargeMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      maximumFractionDigits: 2,
      notation: "compact",
      style: "currency",
    }).format(value);
  } catch {
    return `${formatLargeNumber(value)} ${currency}`;
  }
}

function formatMaybeMoney(value: number | null, currency: string): string {
  return value === null ? "N/A" : formatMoney(value, currency);
}

function formatMaybeLargeMoney(
  value: number | null,
  currency: string,
): string {
  return value === null ? "N/A" : formatLargeMoney(value, currency);
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

function formatSignedPercent(value: number | null): string {
  if (value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
    style: "percent",
  }).format(value / 100);
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

function formatMaybeNumber(value: number | null): string {
  return value === null ? "N/A" : formatNumber(value);
}

function formatLargeNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    notation: "compact",
  }).format(value);
}

function formatMaybeLargeNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? "N/A" : formatLargeNumber(value);
}

function getChangeClassName(value: number | null): string {
  if (value === null || value === 0) {
    return "text-zinc-950";
  }

  return value > 0 ? "text-emerald-700" : "text-red-700";
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

const pieChartColors = [
  "#059669",
  "#2563eb",
  "#dc2626",
  "#ca8a04",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#52525b",
];

const primaryButtonClassName =
  "h-9 rounded bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400";

const secondaryButtonClassName =
  "h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60";
