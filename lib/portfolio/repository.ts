import { prisma } from "@/lib/db/prisma";
import { getLatestPortfolioFxRates } from "@/lib/market-data/fx-rates";
import {
  calculatePortfolioValuation,
  type PortfolioValuation,
} from "@/lib/portfolio/calculations";
import type {
  CashBalance,
  InvestmentIntent,
  Asset,
  AssetType,
  Position,
  PositionPlatformHolding,
  PortfolioActivityLog,
  PortfolioActivityType,
  PortfolioExchange,
} from "@prisma/client";

const DEFAULT_PORTFOLIO_NAME = "Real Portfolio";
const DEFAULT_BASE_CURRENCY = "USD";
const MANUAL_PROVIDER = "manual";

export type PortfolioSummary = {
  id: string;
  name: string;
  baseCurrency: string;
  positions: PortfolioPositionSummary[];
  cashBalances: CashBalanceSummary[];
  exchanges: PortfolioExchangeSummary[];
  activityLogs: PortfolioActivityLogSummary[];
  valuation: PortfolioValuation;
};

export type PortfolioPositionSummary = {
  id: string;
  assetId: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  assetCurrency: string;
  exchange: string | null;
  quantity: number;
  averageCost: number;
  costCurrency: string;
  investmentIntent: InvestmentIntent;
  notes: string | null;
  openedAt: Date | null;
  provider: string;
  providerSymbol: string;
  platformHoldings: PositionPlatformHoldingSummary[];
  latestPrice: {
    price: number;
    currency: string;
    observedAt: Date;
  } | null;
  hasActiveAnalysis: boolean;
};

export type CashBalanceSummary = {
  id: string;
  platform: string;
  currency: string;
  amount: number;
};

export type PortfolioExchangeSummary = {
  id: string;
  name: string;
  type: "CRYPTO" | "STOCK";
};

export type PositionPlatformHoldingSummary = {
  id: string;
  platform: string;
  quantity: number;
  averageCost: number;
  costCurrency: string;
  openedAt: Date | null;
  notes: string | null;
};

export type PortfolioActivityLogSummary = {
  id: string;
  type: PortfolioActivityType;
  platform: string | null;
  currency: string | null;
  amount: number | null;
  description: string;
  createdAt: Date;
};

export async function getOrCreateDefaultPortfolio() {
  const existingPortfolio = await prisma.portfolio.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existingPortfolio) {
    return existingPortfolio;
  }

  return prisma.portfolio.create({
    data: {
      name: DEFAULT_PORTFOLIO_NAME,
      baseCurrency: DEFAULT_BASE_CURRENCY,
    },
  });
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const portfolio = await getOrCreateDefaultPortfolio();
  const portfolioWithData = await prisma.portfolio.findUniqueOrThrow({
    where: {
      id: portfolio.id,
    },
    include: {
      positions: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          platformHoldings: {
            orderBy: {
              platform: "asc",
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
            },
          },
        },
      },
      cashBalances: {
        orderBy: {
          platform: "asc",
        },
      },
      exchanges: {
        orderBy: [
          {
            type: "asc",
          },
          {
            name: "asc",
          },
        ],
      },
    },
  });

  const positions = portfolioWithData.positions.map(toPositionSummary);
  const activeAnalysisAssetIds = await getActiveAnalysisAssetIds(
    positions.map((position) => position.assetId),
  );
  const positionsWithAnalysisState = positions.map((position) => ({
    ...position,
    hasActiveAnalysis: activeAnalysisAssetIds.has(position.assetId),
  }));
  const cashBalances = portfolioWithData.cashBalances.map(toCashBalanceSummary);
  const exchanges = portfolioWithData.exchanges.map(toPortfolioExchangeSummary);
  const activityLogs = await getPortfolioActivityLogs(portfolioWithData.id);
  const fxRates = await getLatestPortfolioFxRates(
    portfolioWithData.baseCurrency,
  );
  const valuation = calculatePortfolioValuation({
    baseCurrency: portfolioWithData.baseCurrency,
    fxRates,
    positions: positionsWithAnalysisState.map((position) => ({
      id: position.id,
      quantity: position.quantity,
      averageCost: position.averageCost,
      costCurrency: position.costCurrency,
      latestPrice: position.latestPrice,
    })),
    cashBalances,
  });

  return {
    id: portfolioWithData.id,
    name: portfolioWithData.name,
    baseCurrency: portfolioWithData.baseCurrency,
    positions: positionsWithAnalysisState,
    cashBalances,
    exchanges,
    activityLogs,
    valuation,
  };
}

export async function upsertManualAsset(input: {
  symbol: string;
  name: string;
  assetType: AssetType;
  currency: string;
  exchange: string | null;
  provider?: string;
  providerSymbol?: string;
}) {
  const provider = input.provider ?? MANUAL_PROVIDER;
  const providerSymbol = input.providerSymbol ?? input.symbol;

  return prisma.asset.upsert({
    where: {
      provider_providerSymbol: {
        provider,
        providerSymbol,
      },
    },
    create: {
      symbol: input.symbol,
      name: input.name,
      assetType: input.assetType,
      currency: input.currency,
      exchange: input.exchange,
      provider,
      providerSymbol,
    },
    update: {
      name: input.name,
      assetType: input.assetType,
      currency: input.currency,
      exchange: input.exchange,
    },
  });
}

function toPositionSummary(
  position: Position & {
    platformHoldings: PositionPlatformHolding[];
    asset: Asset & {
      marketPrices: Array<{
        price: { toNumber: () => number };
        currency: string;
        observedAt: Date;
      }>;
    };
  },
): PortfolioPositionSummary {
  const latestPrice = position.asset.marketPrices[0];

  return {
    id: position.id,
    assetId: position.assetId,
    symbol: position.asset.symbol,
    name: position.asset.name,
    assetType: position.asset.assetType,
    assetCurrency: position.asset.currency,
    exchange: position.asset.exchange,
    quantity: position.quantity.toNumber(),
    averageCost: position.averageCost.toNumber(),
    costCurrency: position.costCurrency,
    investmentIntent: position.investmentIntent,
    notes: position.notes,
    openedAt: position.openedAt,
    provider: position.asset.provider,
    providerSymbol: position.asset.providerSymbol,
    platformHoldings: position.platformHoldings.map(
      toPositionPlatformHoldingSummary,
    ),
    latestPrice: latestPrice
      ? {
          price: latestPrice.price.toNumber(),
          currency: latestPrice.currency,
          observedAt: latestPrice.observedAt,
        }
      : null,
    hasActiveAnalysis: false,
  };
}

async function getActiveAnalysisAssetIds(assetIds: string[]): Promise<Set<string>> {
  if (assetIds.length === 0) {
    return new Set();
  }

  const runs = await prisma.agentRun.findMany({
    where: {
      assetId: {
        in: assetIds,
      },
      status: {
        in: ["PENDING", "RUNNING"],
      },
    },
    select: {
      assetId: true,
    },
  });

  return new Set(runs.map((run) => run.assetId));
}

function toPositionPlatformHoldingSummary(
  platformHolding: PositionPlatformHolding,
): PositionPlatformHoldingSummary {
  return {
    id: platformHolding.id,
    platform: platformHolding.platform,
    quantity: platformHolding.quantity.toNumber(),
    averageCost: platformHolding.averageCost.toNumber(),
    costCurrency: platformHolding.costCurrency,
    openedAt: platformHolding.openedAt,
    notes: platformHolding.notes,
  };
}

function toCashBalanceSummary(cashBalance: CashBalance): CashBalanceSummary {
  return {
    id: cashBalance.id,
    platform: cashBalance.platform,
    currency: cashBalance.currency,
    amount: cashBalance.amount.toNumber(),
  };
}

function toPortfolioExchangeSummary(
  exchange: PortfolioExchange,
): PortfolioExchangeSummary {
  return {
    id: exchange.id,
    name: exchange.name,
    type: exchange.type,
  };
}

function toPortfolioActivityLogSummary(
  activityLog: PortfolioActivityLog,
): PortfolioActivityLogSummary {
  return {
    id: activityLog.id,
    type: activityLog.type,
    platform: activityLog.platform,
    currency: activityLog.currency,
    amount: activityLog.amount?.toNumber() ?? null,
    description: activityLog.description,
    createdAt: activityLog.createdAt,
  };
}

async function getPortfolioActivityLogs(
  portfolioId: string,
): Promise<PortfolioActivityLogSummary[]> {
  try {
    const activityLogs = await prisma.portfolioActivityLog.findMany({
      where: {
        portfolioId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return activityLogs.map(toPortfolioActivityLogSummary);
  } catch (error) {
    if (isMissingActivityLogStorageError(error)) {
      return [];
    }

    throw error;
  }
}

function isMissingActivityLogStorageError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("portfolioActivityLog") ||
    error.message.includes("PortfolioActivityLog") ||
    error.message.includes("activityLogs") ||
    error.message.includes("findMany")
  );
}
