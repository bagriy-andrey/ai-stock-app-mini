import { prisma } from "@/lib/db/prisma";
import { getPriceFreshness } from "@/lib/market-data/price-freshness";
import type {
  AnalysisInputSnapshot,
  AnalysisStartInput,
} from "@/lib/analysis/types";

export async function buildAnalysisInputSnapshot(
  input: AnalysisStartInput,
): Promise<AnalysisInputSnapshot> {
  if (input.source === "portfolio") {
    if (!input.positionId) {
      throw new Error("positionId is required for portfolio analysis.");
    }

    return buildPortfolioSnapshot(input.positionId);
  }

  if (!input.watchlistItemId) {
    throw new Error("watchlistItemId is required for watchlist analysis.");
  }

  return buildWatchlistSnapshot(input.watchlistItemId);
}

async function buildPortfolioSnapshot(
  positionId: string,
): Promise<AnalysisInputSnapshot> {
  const position = await prisma.position.findUniqueOrThrow({
    where: {
      id: positionId,
    },
    include: {
      platformHoldings: {
        orderBy: {
          platform: "asc",
        },
      },
      portfolio: {
        include: {
          cashBalances: {
            orderBy: {
              platform: "asc",
            },
          },
        },
      },
      asset: {
        include: {
          marketPrices: {
            orderBy: {
              observedAt: "desc",
            },
            take: 1,
          },
          watchlistItems: {
            take: 1,
          },
        },
      },
    },
  });

  return normalizeSnapshot({
    asset: position.asset,
    createdAt: new Date(),
    latestPrice: position.asset.marketPrices[0] ?? null,
    portfolio: position.portfolio,
    position,
    requestedIntent: position.investmentIntent,
    source: "portfolio",
    watchlistItem: position.asset.watchlistItems[0] ?? null,
  });
}

async function buildWatchlistSnapshot(
  watchlistItemId: string,
): Promise<AnalysisInputSnapshot> {
  const watchlistItem = await prisma.watchlistItem.findUniqueOrThrow({
    where: {
      id: watchlistItemId,
    },
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
            take: 1,
            include: {
              platformHoldings: {
                orderBy: {
                  platform: "asc",
                },
              },
              portfolio: {
                include: {
                  cashBalances: {
                    orderBy: {
                      platform: "asc",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  const position = watchlistItem.asset.positions[0] ?? null;

  return normalizeSnapshot({
    asset: watchlistItem.asset,
    createdAt: new Date(),
    latestPrice: watchlistItem.asset.marketPrices[0] ?? null,
    portfolio: position?.portfolio ?? null,
    position,
    requestedIntent: watchlistItem.investmentIntent,
    source: "watchlist",
    watchlistItem,
  });
}

function normalizeSnapshot(input: {
  asset: {
    id: string;
    symbol: string;
    name: string;
    assetType: string;
    currency: string;
    exchange: string | null;
    provider: string;
    providerSymbol: string;
    sector: string | null;
    region: string | null;
  };
  createdAt: Date;
  latestPrice: {
    price: { toNumber: () => number };
    currency: string;
    provider: string;
    providerSymbol: string;
    observedAt: Date;
    ingestedAt: Date;
  } | null;
  portfolio: {
    id: string;
    name: string;
    baseCurrency: string;
    cashBalances: Array<{
      platform: string;
      currency: string;
      amount: { toNumber: () => number };
    }>;
  } | null;
  position: {
    id: string;
    quantity: { toNumber: () => number };
    averageCost: { toNumber: () => number };
    costCurrency: string;
    investmentIntent: "LONG_TERM" | "TACTICAL";
    notes: string | null;
    openedAt: Date | null;
    platformHoldings: Array<{
      platform: string;
      quantity: { toNumber: () => number };
      averageCost: { toNumber: () => number };
      costCurrency: string;
      openedAt: Date | null;
      notes: string | null;
    }>;
  } | null;
  requestedIntent: "LONG_TERM" | "TACTICAL";
  source: "portfolio" | "watchlist";
  watchlistItem: {
    id: string;
    investmentIntent: "LONG_TERM" | "TACTICAL";
    priority: string;
    targetEntryPrice: { toNumber: () => number } | null;
    notes: string | null;
  } | null;
}): AnalysisInputSnapshot {
  const priceFreshness = getPriceFreshness(
    input.latestPrice
      ? {
          observedAt: input.latestPrice.observedAt,
        }
      : null,
  );
  const missingDataWarnings = buildMissingDataWarnings({
    hasPortfolio: Boolean(input.portfolio),
    hasPosition: Boolean(input.position),
    latestPriceFreshness: priceFreshness,
  });

  return {
    schemaVersion: "phase2.input-snapshot.v1",
    createdAt: input.createdAt.toISOString(),
    requestedIntent: input.requestedIntent,
    source: input.source,
    asset: {
      id: input.asset.id,
      symbol: input.asset.symbol,
      name: input.asset.name,
      assetType: input.asset.assetType,
      currency: input.asset.currency,
      exchange: input.asset.exchange,
      provider: input.asset.provider,
      providerSymbol: input.asset.providerSymbol,
      sector: input.asset.sector,
      region: input.asset.region,
    },
    latestPrice: input.latestPrice
      ? {
          price: input.latestPrice.price.toNumber(),
          currency: input.latestPrice.currency,
          provider: input.latestPrice.provider,
          providerSymbol: input.latestPrice.providerSymbol,
          observedAt: input.latestPrice.observedAt.toISOString(),
          ingestedAt: input.latestPrice.ingestedAt.toISOString(),
          freshness: priceFreshness,
        }
      : null,
    portfolio: input.portfolio
      ? {
          id: input.portfolio.id,
          name: input.portfolio.name,
          baseCurrency: input.portfolio.baseCurrency,
          cashBalances: input.portfolio.cashBalances.map((balance) => ({
            platform: balance.platform,
            currency: balance.currency,
            amount: balance.amount.toNumber(),
          })),
        }
      : null,
    position: input.position
      ? {
          id: input.position.id,
          quantity: input.position.quantity.toNumber(),
          averageCost: input.position.averageCost.toNumber(),
          costCurrency: input.position.costCurrency,
          investmentIntent: input.position.investmentIntent,
          notes: input.position.notes,
          openedAt: input.position.openedAt?.toISOString() ?? null,
          platformHoldings: input.position.platformHoldings.map((holding) => ({
            platform: holding.platform,
            quantity: holding.quantity.toNumber(),
            averageCost: holding.averageCost.toNumber(),
            costCurrency: holding.costCurrency,
            openedAt: holding.openedAt?.toISOString() ?? null,
            notes: holding.notes,
          })),
        }
      : null,
    watchlistItem: input.watchlistItem
      ? {
          id: input.watchlistItem.id,
          investmentIntent: input.watchlistItem.investmentIntent,
          priority: input.watchlistItem.priority,
          targetEntryPrice:
            input.watchlistItem.targetEntryPrice?.toNumber() ?? null,
          notes: input.watchlistItem.notes,
        }
      : null,
    providerProvenance: [
      `asset:${input.asset.provider}:${input.asset.providerSymbol}`,
      input.latestPrice
        ? `price:${input.latestPrice.provider}:${input.latestPrice.providerSymbol}`
        : "price:missing",
    ],
    missingDataWarnings,
  };
}

function buildMissingDataWarnings(input: {
  hasPortfolio: boolean;
  hasPosition: boolean;
  latestPriceFreshness: "fresh" | "stale" | "missing";
}): string[] {
  const warnings: string[] = [
    "No durable news provider is integrated in Phase 2; news/sentiment agents must not invent recent news.",
    "No fundamentals ingestion pipeline is integrated in Phase 2; asset quality analysis is limited to stored metadata and user notes.",
  ];

  if (input.latestPriceFreshness === "missing") {
    warnings.push("No latest market price snapshot is available.");
  }

  if (input.latestPriceFreshness === "stale") {
    warnings.push("Latest market price snapshot is older than the 24 hour MVP freshness threshold.");
  }

  if (!input.hasPortfolio || !input.hasPosition) {
    warnings.push("No owned portfolio position was found; portfolio fit is watchlist-only.");
  }

  return warnings;
}
