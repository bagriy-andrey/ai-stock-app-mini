"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ManualPriceFormModal } from "@/components/market-data/manual-price-form-modal";
import { PositionFormModal } from "@/components/portfolio/position-form-modal";
import { PositionSellModal } from "@/components/portfolio/position-sell-modal";
import {
  PositionPlatformHoldingsModal,
  type PortfolioPosition,
} from "@/components/portfolio/portfolio-tables-tabs";
import {
  getPriceFreshness,
  type PriceFreshness,
} from "@/lib/market-data/price-freshness";
import { WatchlistItemFormModal } from "@/components/watchlist/watchlist-item-form-modal";
import type { WatchlistItemSummary } from "@/lib/watchlist/repository";

type WatchlistTab = "STOCKS" | "CRYPTO";

type AssetProfilePrice = {
  currentPrice: number | null;
  priceCurrency: string;
};

type AssetProfilePriceCacheEntry = {
  expiresAt: number;
  request: Promise<AssetProfilePrice | null>;
};

const tabs: Array<{ id: WatchlistTab; label: string }> = [
  { id: "STOCKS", label: "Stocks" },
  { id: "CRYPTO", label: "Crypto" },
];
const watchlistActiveTabStorageKey = "watchlist.activeTab";
const assetProfilePriceCacheTtlMs = 30 * 1000;
const assetProfilePriceCache = new Map<string, AssetProfilePriceCacheEntry>();

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

function isWatchlistTab(value: string | null): value is WatchlistTab {
  return tabs.some((tab) => tab.id === value);
}

function useStoredWatchlistTab(): [WatchlistTab | null, (tab: WatchlistTab) => void] {
  const changeEventName = `${watchlistActiveTabStorageKey}:change`;
  const activeTab = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(changeEventName, onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(changeEventName, onStoreChange);
      };
    },
    () => {
      const savedTab = window.localStorage.getItem(watchlistActiveTabStorageKey);

      return isWatchlistTab(savedTab) ? savedTab : "STOCKS";
    },
    () => null,
  );

  function selectTab(tab: WatchlistTab) {
    window.localStorage.setItem(watchlistActiveTabStorageKey, tab);
    window.dispatchEvent(new Event(changeEventName));
  }

  return [activeTab, selectTab];
}

export function WatchlistTable({
  items,
  createAction,
  deleteAction,
  baseCurrency,
  cashBalances,
  exchanges,
  portfolioPositions,
  createPositionAction,
  sellPositionAction,
  updatePriceAction,
}: {
  items: WatchlistItemSummary[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  baseCurrency: string;
  cashBalances: CashBalance[];
  exchanges: PortfolioExchange[];
  portfolioPositions: PortfolioPosition[];
  createPositionAction: (formData: FormData) => Promise<void>;
  sellPositionAction: (formData: FormData) => Promise<void>;
  updatePriceAction: (formData: FormData) => Promise<void>;
}) {
  const [activeTab, selectActiveTab] = useStoredWatchlistTab();
  const [selectedItem, setSelectedItem] = useState<WatchlistItemSummary | null>(
    null,
  );
  const [positionToAdd, setPositionToAdd] = useState<PortfolioPosition | null>(
    null,
  );
  const [positionToSell, setPositionToSell] =
    useState<PortfolioPosition | null>(null);
  const [priceItem, setPriceItem] = useState<WatchlistItemSummary | null>(null);
  const stocks = useMemo(
    () => items.filter((item) => item.assetType !== "CRYPTO"),
    [items],
  );
  const crypto = useMemo(
    () => items.filter((item) => item.assetType === "CRYPTO"),
    [items],
  );
  const visibleItems = activeTab === "CRYPTO" ? crypto : stocks;
  const selectedOwnedPosition = selectedItem
    ? getOwnedPosition(selectedItem, portfolioPositions)
    : null;
  const selectedPosition = selectedItem
    ? selectedOwnedPosition ?? toPortfolioPosition(selectedItem)
    : null;

  if (activeTab === null) {
    return <WatchlistTabsLoadingState />;
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Watchlist</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Assets monitored separately from real portfolio holdings.
          </p>
        </div>
        <WatchlistItemFormModal action={createAction} mode="create" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded border border-zinc-200 bg-white p-1">
          {tabs.map((tab) => {
            const count = tab.id === "CRYPTO" ? crypto.length : stocks.length;

            return (
              <button
                className={`h-9 rounded px-3 text-sm font-medium ${
                  activeTab === tab.id
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
                key={tab.id}
                onClick={() => selectActiveTab(tab.id)}
                type="button"
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
          <p className="text-sm font-medium text-zinc-700">
            No {activeTab === "CRYPTO" ? "crypto" : "stock"} assets yet
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Add assets you want to monitor without adding them to the portfolio.
          </p>
        </div>
      ) : (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleItems.map((item) => (
            <WatchlistWidget
              deleteAction={deleteAction}
              item={item}
              key={item.id}
              onOpen={setSelectedItem}
              onUpdatePrice={setPriceItem}
            />
          ))}
        </div>
      )}

      {selectedItem ? (
        <PositionPlatformHoldingsModal
          activityLogs={[]}
          buyActionLabel="Add"
          onClose={() => setSelectedItem(null)}
          onBuy={() => {
            if (selectedPosition) {
              setSelectedItem(null);
              setPositionToAdd(toPortfolioPosition(selectedItem));
            }
          }}
          onSell={
            selectedOwnedPosition
              ? () => {
                  setSelectedItem(null);
                  setPositionToSell(selectedOwnedPosition);
                }
              : undefined
          }
          position={selectedPosition ?? toPortfolioPosition(selectedItem)}
          showSellAction={Boolean(selectedOwnedPosition)}
          showTradeActions
        />
      ) : null}

      {positionToAdd ? (
        <PositionFormModal
          action={createPositionAction}
          assetType={positionToAdd.assetType}
          baseCurrency={baseCurrency}
          cashBalances={cashBalances}
          exchangeOptions={getExchangeOptions(exchanges, positionToAdd.assetType)}
          initialAsset={positionToAdd}
          isOpen
          mode="create"
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setPositionToAdd(null);
            }
          }}
          showTrigger={false}
        />
      ) : null}

      {positionToSell ? (
        <PositionSellModal
          action={sellPositionAction}
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

      {priceItem ? (
        <ManualPriceFormModal
          action={updatePriceAction}
          asset={{
            assetId: priceItem.assetId,
            assetCurrency: priceItem.assetCurrency,
            latestPrice: priceItem.latestPrice,
            name: priceItem.name,
            symbol: priceItem.symbol,
          }}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setPriceItem(null);
            }
          }}
          showTrigger={false}
        />
      ) : null}
    </section>
  );
}

function WatchlistTabsLoadingState() {
  return (
    <section className="grid gap-4" aria-label="Loading watchlist tabs">
      <div className="h-11 w-48 animate-pulse rounded border border-zinc-200 bg-white" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <WatchlistWidgetSkeleton />
        <WatchlistWidgetSkeleton />
        <WatchlistWidgetSkeleton />
        <WatchlistWidgetSkeleton />
      </div>
    </section>
  );
}

function WatchlistWidget({
  item,
  deleteAction,
  onOpen,
  onUpdatePrice,
}: {
  item: WatchlistItemSummary;
  deleteAction: (formData: FormData) => Promise<void>;
  onOpen: (item: WatchlistItemSummary) => void;
  onUpdatePrice: (item: WatchlistItemSummary) => void;
}) {
  return (
    <div
      className="group grid min-h-44 min-w-0 overflow-hidden rounded border border-zinc-200 bg-white p-4 text-left transition hover:border-emerald-600 hover:shadow-sm"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item);
        }
      }}
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="min-w-0 truncate text-base font-semibold text-zinc-950">
              {item.symbol}
            </p>
            {item.isOwned ? <Badge>Owned</Badge> : null}
          </div>
          <p className="mt-1 min-w-0 truncate text-xs text-zinc-500">
            {item.name}
          </p>
        </div>
        <form
          action={deleteAction}
          className="shrink-0"
          onClick={(event) => event.stopPropagation()}
        >
          <input name="watchlistItemId" type="hidden" value={item.id} />
          <button
            aria-label={`Remove ${item.symbol} from watchlist`}
            className="grid size-8 place-items-center rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            title="Remove from watchlist"
            type="submit"
          >
            <HeartIcon />
          </button>
        </form>
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase text-zinc-500">Price</p>
          <button
            className="rounded border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
            onClick={(event) => {
              event.stopPropagation();
              onUpdatePrice(item);
            }}
            type="button"
          >
            Update
          </button>
        </div>
        <WatchlistWidgetPrice item={item} />
      </div>

      <div className="flex min-w-0 flex-wrap gap-1 overflow-hidden">
        <Badge>{item.assetType}</Badge>
        <Badge>{formatEnum(item.investmentIntent)}</Badge>
        <Badge>{formatEnum(item.priority)}</Badge>
        {item.targetEntryPrice !== null ? (
          <Badge>
            Target {formatMoney(item.targetEntryPrice, item.assetCurrency)}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function WatchlistWidgetPrice({ item }: { item: WatchlistItemSummary }) {
  const [profilePrice, setProfilePrice] = useState<AssetProfilePrice | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(!item.latestPrice);
  const {
    assetType,
    latestPrice,
    name,
    provider,
    providerSymbol,
    symbol,
  } = item;

  useEffect(() => {
    if (latestPrice) {
      return;
    }

    let isActive = true;

    fetchCachedAssetProfilePrice({
      assetType,
      name,
      provider,
      providerSymbol,
      symbol,
    })
      .then((price) => {
        if (!isActive) {
          return;
        }

        setProfilePrice(price);
        setIsLoading(false);
      })
      .catch(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [assetType, latestPrice, name, provider, providerSymbol, symbol]);

  if (item.latestPrice) {
    const freshness = getPriceFreshness(item.latestPrice);

    return (
      <>
        <p className="mt-1 min-w-0 truncate text-2xl font-semibold text-zinc-950">
          {formatMoney(item.latestPrice.price, item.latestPrice.currency)}
        </p>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
          <p className="min-w-0 truncate text-xs text-zinc-500">
            {formatDate(item.latestPrice.observedAt)}
          </p>
          <PriceFreshnessBadge freshness={freshness} />
        </div>
      </>
    );
  }

  if (profilePrice?.currentPrice !== null && profilePrice?.currentPrice !== undefined) {
    return (
      <>
        <p className="mt-1 min-w-0 truncate text-2xl font-semibold text-zinc-950">
          {formatMoney(profilePrice.currentPrice, profilePrice.priceCurrency)}
        </p>
        <p className="mt-1 min-w-0 truncate text-xs text-zinc-500">
          Provider profile
        </p>
      </>
    );
  }

  return (
    <>
      {isLoading ? (
        <CardPriceLoader />
      ) : (
        <>
          <p className="mt-1 min-w-0 truncate text-2xl font-semibold text-zinc-950">
            N/A
          </p>
          <p className="mt-1 min-w-0 truncate text-xs text-zinc-500">
            No market snapshot
          </p>
        </>
      )}
    </>
  );
}

function fetchCachedAssetProfilePrice(
  item: Pick<
    WatchlistItemSummary,
    "assetType" | "name" | "provider" | "providerSymbol" | "symbol"
  >,
): Promise<AssetProfilePrice | null> {
  const cacheKey = [
    item.provider.toLowerCase(),
    item.providerSymbol.toUpperCase(),
    item.symbol.toUpperCase(),
    item.name.toLowerCase(),
    item.assetType,
  ].join(":");
  const cached = assetProfilePriceCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.request;
  }

  const params = new URLSearchParams({
    name: item.name,
    provider: item.provider,
    providerSymbol: item.providerSymbol,
    scope: "price",
    symbol: item.symbol,
    type: item.assetType,
  });
  const request = fetch(`/api/assets/profile?${params}`)
    .then((response) => (response.ok ? response.json() : { profile: null }))
    .then((data: { profile?: AssetProfilePrice | null }) => data.profile ?? null)
    .catch((error) => {
      assetProfilePriceCache.delete(cacheKey);
      throw error;
    });

  assetProfilePriceCache.set(cacheKey, {
    expiresAt: now + assetProfilePriceCacheTtlMs,
    request,
  });

  return request;
}

function PriceFreshnessBadge({ freshness }: { freshness: PriceFreshness }) {
  const className =
    freshness === "fresh"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : freshness === "stale"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-zinc-200 bg-zinc-50 text-zinc-600";

  return (
    <span
      className={`w-fit rounded border px-2 py-0.5 text-[11px] font-medium uppercase ${className}`}
    >
      {freshness}
    </span>
  );
}

function CardPriceLoader() {
  return (
    <div className="mt-2 grid gap-2">
      <div className="h-7 w-24 animate-pulse rounded bg-zinc-100" />
      <div className="h-3 w-32 animate-pulse rounded bg-zinc-100" />
    </div>
  );
}

function WatchlistWidgetSkeleton() {
  return (
    <div className="grid min-h-44 min-w-0 gap-4 rounded border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid flex-1 gap-2">
          <div className="h-5 w-20 animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-36 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="size-8 animate-pulse rounded-full bg-zinc-100" />
      </div>
      <CardPriceLoader />
      <div className="flex gap-1">
        <div className="h-6 w-14 animate-pulse rounded bg-zinc-100" />
        <div className="h-6 w-20 animate-pulse rounded bg-zinc-100" />
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-full min-w-0 truncate rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-xs font-medium text-zinc-600">
      {children}
    </span>
  );
}

function HeartIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 21s-7.2-4.4-9.7-8.4C.4 9.6 1 5.7 3.7 3.8c2.2-1.6 5.2-1.1 6.9 1L12 6.4l1.4-1.6c1.7-2.1 4.7-2.6 6.9-1 2.7 1.9 3.3 5.8 1.4 8.8C19.2 16.6 12 21 12 21Z" />
    </svg>
  );
}

function toPortfolioPosition(item: WatchlistItemSummary): PortfolioPosition {
  return {
    id: item.id,
    assetId: item.assetId,
    symbol: item.symbol,
    name: item.name,
    assetType: item.assetType,
    assetCurrency: item.assetCurrency,
    exchange: item.exchange,
    provider: item.provider,
    providerSymbol: item.providerSymbol,
    platformHoldings: [],
    quantity: 0,
    averageCost: item.targetEntryPrice ?? 0,
    costCurrency: item.assetCurrency,
    investmentIntent: item.investmentIntent,
    openedAt: item.createdAt,
    notes: item.notes,
    latestPrice: item.latestPrice,
  };
}

function getOwnedPosition(
  item: WatchlistItemSummary,
  portfolioPositions: PortfolioPosition[],
): PortfolioPosition | null {
  return (
    portfolioPositions.find((position) => position.assetId === item.assetId) ??
    null
  );
}

function getExchangeOptions(
  exchanges: PortfolioExchange[],
  assetType: "CRYPTO" | "STOCK" | "ETF",
): string[] {
  const exchangeType = assetType === "CRYPTO" ? "CRYPTO" : "STOCK";

  return exchanges
    .filter((exchange) => exchange.type === exchangeType)
    .map((exchange) => exchange.name);
}

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      maximumFractionDigits: 2,
      style: "currency",
    }).format(value);
  } catch {
    return `${new Intl.NumberFormat("en-US").format(value)} ${currency}`;
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
