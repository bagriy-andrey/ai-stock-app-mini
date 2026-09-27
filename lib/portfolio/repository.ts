import { prisma } from "@/lib/db/prisma";
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
  latestPrice: {
    price: number;
    currency: string;
    observedAt: Date;
  } | null;
};

export type CashBalanceSummary = {
  id: string;
  platform: string;
  currency: string;
  amount: number;
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
    },
  });

  const positions = portfolioWithData.positions.map(toPositionSummary);
  const cashBalances = portfolioWithData.cashBalances.map(toCashBalanceSummary);
  const valuation = calculatePortfolioValuation({
    baseCurrency: portfolioWithData.baseCurrency,
    positions: positions.map((position) => ({
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
    positions,
    cashBalances,
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
    latestPrice: latestPrice
      ? {
          price: latestPrice.price.toNumber(),
          currency: latestPrice.currency,
          observedAt: latestPrice.observedAt,
        }
      : null,
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
