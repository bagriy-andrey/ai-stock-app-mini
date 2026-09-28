import type {
  Asset,
  AssetType,
  InvestmentIntent,
  WatchlistItem,
  WatchlistPriority,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type WatchlistSummary = {
  items: WatchlistItemSummary[];
};

export type WatchlistItemSummary = {
  id: string;
  assetId: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  assetCurrency: string;
  exchange: string | null;
  provider: string;
  providerSymbol: string;
  investmentIntent: InvestmentIntent;
  priority: WatchlistPriority;
  targetEntryPrice: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  isOwned: boolean;
  latestPrice: {
    price: number;
    currency: string;
    observedAt: Date;
  } | null;
};

export async function getWatchlistSummary(): Promise<WatchlistSummary> {
  const items = await prisma.watchlistItem.findMany({
    orderBy: [
      {
        priority: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    include: {
      asset: {
        include: {
          marketPrices: {
            orderBy: {
              observedAt: "desc",
            },
            take: 1,
          },
          positions: {
            select: {
              id: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  return {
    items: items.map(toWatchlistItemSummary),
  };
}

function toWatchlistItemSummary(
  item: WatchlistItem & {
    asset: Asset & {
      marketPrices: Array<{
        price: { toNumber: () => number };
        currency: string;
        observedAt: Date;
      }>;
      positions: Array<{
        id: string;
      }>;
    };
  },
): WatchlistItemSummary {
  const latestPrice = item.asset.marketPrices[0];

  return {
    id: item.id,
    assetId: item.assetId,
    symbol: item.asset.symbol,
    name: item.asset.name,
    assetType: item.asset.assetType,
    assetCurrency: item.asset.currency,
    exchange: item.asset.exchange,
    provider: item.asset.provider,
    providerSymbol: item.asset.providerSymbol,
    investmentIntent: item.investmentIntent,
    priority: item.priority,
    targetEntryPrice: item.targetEntryPrice?.toNumber() ?? null,
    notes: item.notes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    isOwned: item.asset.positions.length > 0,
    latestPrice: latestPrice
      ? {
          price: latestPrice.price.toNumber(),
          currency: latestPrice.currency,
          observedAt: latestPrice.observedAt,
        }
      : null,
  };
}
