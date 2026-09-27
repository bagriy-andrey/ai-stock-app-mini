"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { PortfolioActivityType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  calculatePurchaseCost,
  calculateWeightedAverageCost,
} from "@/lib/portfolio/calculations";
import {
  getOrCreateDefaultPortfolio,
  upsertManualAsset,
} from "@/lib/portfolio/repository";
import {
  activityLogDeleteFormSchema,
  cashBalanceDeleteFormSchema,
  cashBalanceFormSchema,
  cashWithdrawalFormSchema,
  portfolioBaseCurrencyFormSchema,
  portfolioExchangeFormSchema,
  positionDeleteFormSchema,
  positionFormSchema,
  positionUpdateFormSchema,
} from "@/lib/portfolio/validation";

const PORTFOLIO_PATH = "/portfolio";

export async function createPosition(formData: FormData) {
  const input = positionFormSchema.parse(Object.fromEntries(formData));
  const portfolio = await getOrCreateDefaultPortfolio();
  const purchaseCost = calculatePurchaseCost({
    quantity: input.quantity,
    averageCost: input.averageCost,
  });

  await prisma.$transaction(async (tx) => {
    await assertPortfolioExchangeExists(tx, {
      portfolioId: portfolio.id,
      name: input.exchange,
      type: getExchangeTypeForAsset(input.assetType),
    });

    const cashBalance = await tx.cashBalance.findUnique({
      where: {
        portfolioId_platform_currency: {
          portfolioId: portfolio.id,
          platform: input.exchange,
          currency: input.costCurrency,
        },
      },
    });

    if (cashBalance && cashBalance.amount.toNumber() < purchaseCost) {
      throw new Error(
        `Insufficient ${input.costCurrency} cash on ${input.exchange}. Available: ${cashBalance.amount.toNumber()}, required: ${purchaseCost}.`,
      );
    }

    const asset = await tx.asset.upsert({
      where: {
        provider_providerSymbol: {
          provider: input.provider,
          providerSymbol: input.providerSymbol,
        },
      },
      create: {
        symbol: input.symbol,
        name: input.name,
        assetType: input.assetType,
        currency: input.assetCurrency,
        exchange: input.exchange,
        provider: input.provider,
        providerSymbol: input.providerSymbol,
      },
      update: {
        name: input.name,
        assetType: input.assetType,
        currency: input.assetCurrency,
        exchange: input.exchange,
      },
    });

    const existingPosition = await tx.position.findUnique({
      where: {
        portfolioId_assetId: {
          portfolioId: portfolio.id,
          assetId: asset.id,
        },
      },
    });

    if (!existingPosition) {
      const createdPosition = await tx.position.create({
        data: {
          portfolioId: portfolio.id,
          assetId: asset.id,
          quantity: input.quantity,
          averageCost: input.averageCost,
          costCurrency: input.costCurrency,
          investmentIntent: input.investmentIntent,
          notes: input.notes,
          openedAt: input.openedAt,
        },
      });

      await upsertPositionPlatformHolding(tx, {
        positionId: createdPosition.id,
        platform: input.exchange,
        quantity: input.quantity,
        averageCost: input.averageCost,
        costCurrency: input.costCurrency,
        openedAt: input.openedAt,
        notes: input.notes,
      });
    } else {
      if (existingPosition.costCurrency !== input.costCurrency) {
        throw new Error(
          `Existing ${input.symbol} position uses ${existingPosition.costCurrency}. Edit the position manually before adding ${input.costCurrency} lots.`,
        );
      }

      const existingQuantity = existingPosition.quantity.toNumber();
      const existingAverageCost = existingPosition.averageCost.toNumber();
      const totalQuantity = existingQuantity + input.quantity;
      const weightedAverageCost = calculateWeightedAverageCost({
        existingQuantity,
        existingAverageCost,
        addedQuantity: input.quantity,
        addedAverageCost: input.averageCost,
      });

      await tx.position.update({
        where: {
          id: existingPosition.id,
        },
        data: {
          portfolioId: portfolio.id,
          assetId: asset.id,
          quantity: totalQuantity,
          averageCost: weightedAverageCost,
          costCurrency: input.costCurrency,
          updatedAt: new Date(),
        },
      });

      await upsertPositionPlatformHolding(tx, {
        positionId: existingPosition.id,
        platform: input.exchange,
        quantity: input.quantity,
        averageCost: input.averageCost,
        costCurrency: input.costCurrency,
        openedAt: input.openedAt,
        notes: input.notes,
      });
    }

    if (cashBalance) {
      const cashUpdate = await tx.cashBalance.updateMany({
        where: {
          id: cashBalance.id,
          amount: {
            gte: purchaseCost,
          },
        },
        data: {
          amount: {
            decrement: purchaseCost,
          },
        },
      });

      if (cashUpdate.count !== 1) {
        throw new Error(
          `Insufficient ${input.costCurrency} cash on ${input.exchange}. Refresh and try again.`,
        );
      }
    }
  });

  revalidatePath(PORTFOLIO_PATH);
}

export async function updatePosition(formData: FormData) {
  const input = positionUpdateFormSchema.parse(Object.fromEntries(formData));
  const portfolio = await getOrCreateDefaultPortfolio();

  await assertPortfolioExchangeExists(prisma, {
    portfolioId: portfolio.id,
    name: input.exchange,
    type: getExchangeTypeForAsset(input.assetType),
  });

  const asset = await upsertManualAsset({
    symbol: input.symbol,
    name: input.name,
    assetType: input.assetType,
    currency: input.assetCurrency,
    exchange: input.exchange,
    provider: input.provider,
    providerSymbol: input.providerSymbol,
  });

  await prisma.$transaction(async (tx) => {
    await tx.position.update({
      where: {
        id: input.positionId,
      },
      data: {
        assetId: asset.id,
        quantity: input.quantity,
        averageCost: input.averageCost,
        costCurrency: input.costCurrency,
        investmentIntent: input.investmentIntent,
        notes: input.notes,
        openedAt: input.openedAt,
      },
    });

    await tx.positionPlatformHolding.deleteMany({
      where: {
        positionId: input.positionId,
      },
    });

    await tx.positionPlatformHolding.create({
      data: {
        positionId: input.positionId,
        platform: input.exchange,
        quantity: input.quantity,
        averageCost: input.averageCost,
        costCurrency: input.costCurrency,
        openedAt: input.openedAt,
        notes: input.notes,
      },
    });
  });

  revalidatePath(PORTFOLIO_PATH);
}

export async function deletePosition(formData: FormData) {
  const input = positionDeleteFormSchema.parse(Object.fromEntries(formData));

  await prisma.position.delete({
    where: {
      id: input.positionId,
    },
  });

  revalidatePath(PORTFOLIO_PATH);
}

export async function upsertCashBalance(formData: FormData) {
  const input = cashBalanceFormSchema.parse(Object.fromEntries(formData));
  const portfolio = await getOrCreateDefaultPortfolio();

  await assertPortfolioExchangeExists(prisma, {
    portfolioId: portfolio.id,
    name: input.platform,
  });

  if (input.cashBalanceId) {
    await prisma.cashBalance.update({
      where: {
        id: input.cashBalanceId,
      },
      data: {
        platform: input.platform,
        currency: input.currency,
        amount: input.amount,
      },
    });

    revalidatePath(PORTFOLIO_PATH);
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.cashBalance.upsert({
      where: {
        portfolioId_platform_currency: {
          portfolioId: portfolio.id,
          platform: input.platform,
          currency: input.currency,
        },
      },
      create: {
        portfolioId: portfolio.id,
        platform: input.platform,
        currency: input.currency,
        amount: input.amount,
      },
      update: {
        amount: {
          increment: input.amount,
        },
      },
    });

    await createPortfolioActivityLog(tx, {
      portfolioId: portfolio.id,
      type: "CASH_DEPOSIT",
      platform: input.platform,
      currency: input.currency,
      amount: input.amount,
      description: `Deposited ${input.amount} ${input.currency} to ${input.platform}.`,
    });
  });

  revalidatePath(PORTFOLIO_PATH);
}

export async function withdrawCashBalance(formData: FormData) {
  const input = cashWithdrawalFormSchema.parse(Object.fromEntries(formData));
  const portfolio = await getOrCreateDefaultPortfolio();

  await prisma.$transaction(async (tx) => {
    const cashBalance = await tx.cashBalance.findUnique({
      where: {
        id: input.cashBalanceId,
      },
    });

    if (
      !cashBalance ||
      cashBalance.portfolioId !== portfolio.id ||
      cashBalance.platform !== input.platform ||
      cashBalance.currency !== input.currency
    ) {
      throw new Error("Selected cash balance is no longer available.");
    }

    if (cashBalance.amount.toNumber() < input.amount) {
      throw new Error(
        `Insufficient ${input.currency} cash on ${input.platform}. Available: ${cashBalance.amount.toNumber()}, requested: ${input.amount}.`,
      );
    }

    const cashUpdate = await tx.cashBalance.updateMany({
      where: {
        id: cashBalance.id,
        amount: {
          gte: input.amount,
        },
      },
      data: {
        amount: {
          decrement: input.amount,
        },
      },
    });

    if (cashUpdate.count !== 1) {
      throw new Error(
        `Insufficient ${input.currency} cash on ${input.platform}. Refresh and try again.`,
      );
    }

    await createPortfolioActivityLog(tx, {
      portfolioId: portfolio.id,
      type: "CASH_WITHDRAWAL",
      platform: input.platform,
      currency: input.currency,
      amount: input.amount,
      description: `Withdrew ${input.amount} ${input.currency} from ${input.platform}.`,
    });
  });

  revalidatePath(PORTFOLIO_PATH);
}

export async function deleteCashBalance(formData: FormData) {
  const input = cashBalanceDeleteFormSchema.parse(Object.fromEntries(formData));

  await prisma.cashBalance.delete({
    where: {
      id: input.cashBalanceId,
    },
  });

  revalidatePath(PORTFOLIO_PATH);
}

export async function deleteActivityLog(formData: FormData) {
  const input = activityLogDeleteFormSchema.parse(Object.fromEntries(formData));
  const portfolio = await getOrCreateDefaultPortfolio();

  await prisma.portfolioActivityLog.delete({
    where: {
      id: input.activityLogId,
      portfolioId: portfolio.id,
    },
  });

  revalidatePath(PORTFOLIO_PATH);
}

export async function updateBaseCurrency(formData: FormData) {
  const input = portfolioBaseCurrencyFormSchema.parse(Object.fromEntries(formData));
  const portfolio = await getOrCreateDefaultPortfolio();

  await prisma.portfolio.update({
    where: {
      id: portfolio.id,
    },
    data: {
      baseCurrency: input.baseCurrency,
    },
  });

  revalidatePath(PORTFOLIO_PATH);
}

export async function createPortfolioExchange(formData: FormData) {
  const input = portfolioExchangeFormSchema.parse(Object.fromEntries(formData));
  const portfolio = await getOrCreateDefaultPortfolio();

  await prisma.portfolioExchange.upsert({
    where: {
      portfolioId_name: {
        portfolioId: portfolio.id,
        name: input.name,
      },
    },
    create: {
      portfolioId: portfolio.id,
      name: input.name,
      type: input.type,
    },
    update: {
      type: input.type,
    },
  });

  revalidatePath(PORTFOLIO_PATH);
}

async function createPortfolioActivityLog(
  tx: Prisma.TransactionClient,
  input: {
    portfolioId: string;
    type: PortfolioActivityType;
    platform: string;
    currency: string;
    amount: number;
    description: string;
  },
) {
  const txWithActivityLog = tx as Prisma.TransactionClient & {
    portfolioActivityLog?: {
      create: (args: {
        data: {
          portfolioId: string;
          type: PortfolioActivityType;
          platform: string;
          currency: string;
          amount: number;
          description: string;
        };
      }) => Promise<unknown>;
    };
  };

  if (txWithActivityLog.portfolioActivityLog) {
    await txWithActivityLog.portfolioActivityLog.create({
      data: input,
    });
    return;
  }

  try {
    const activityLogId = randomUUID();

    await tx.$executeRaw`
      INSERT INTO "PortfolioActivityLog"
        ("id", "portfolioId", "type", "platform", "currency", "amount", "description", "createdAt")
      VALUES
        (${activityLogId}, ${input.portfolioId}, ${input.type}::"PortfolioActivityType", ${input.platform}, ${input.currency}, ${input.amount}, ${input.description}, CURRENT_TIMESTAMP)
    `;
  } catch (error) {
    throw new Error(
      `Portfolio activity log storage is not ready. Run npm run prisma:generate, npm run prisma:migrate, restart the dev server, then try again. ${getErrorMessage(error)}`,
    );
  }
}

async function upsertPositionPlatformHolding(
  tx: Prisma.TransactionClient,
  input: {
    positionId: string;
    platform: string;
    quantity: number;
    averageCost: number;
    costCurrency: string;
    openedAt: Date;
    notes: string | null;
  },
) {
  const existingHolding = await tx.positionPlatformHolding.findUnique({
    where: {
      positionId_platform: {
        positionId: input.positionId,
        platform: input.platform,
      },
    },
  });

  if (!existingHolding) {
    await tx.positionPlatformHolding.create({
      data: {
        positionId: input.positionId,
        platform: input.platform,
        quantity: input.quantity,
        averageCost: input.averageCost,
        costCurrency: input.costCurrency,
        openedAt: input.openedAt,
        notes: input.notes,
      },
    });
    return;
  }

  if (existingHolding.costCurrency !== input.costCurrency) {
    throw new Error(
      `Existing ${input.platform} holding uses ${existingHolding.costCurrency}. Edit the position manually before adding ${input.costCurrency} lots.`,
    );
  }

  const existingQuantity = existingHolding.quantity.toNumber();
  const totalQuantity = existingQuantity + input.quantity;
  const weightedAverageCost = calculateWeightedAverageCost({
    existingQuantity,
    existingAverageCost: existingHolding.averageCost.toNumber(),
    addedQuantity: input.quantity,
    addedAverageCost: input.averageCost,
  });

  await tx.positionPlatformHolding.update({
    where: {
      id: existingHolding.id,
    },
    data: {
      quantity: totalQuantity,
      averageCost: weightedAverageCost,
      openedAt: existingHolding.openedAt ?? input.openedAt,
      notes: input.notes ?? existingHolding.notes,
    },
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function getExchangeTypeForAsset(assetType: string): "CRYPTO" | "STOCK" {
  return assetType === "CRYPTO" ? "CRYPTO" : "STOCK";
}

async function assertPortfolioExchangeExists(
  db: Prisma.TransactionClient | typeof prisma,
  input: {
    portfolioId: string;
    name: string;
    type?: "CRYPTO" | "STOCK";
  },
) {
  const exchange = await db.portfolioExchange.findFirst({
    where: {
      portfolioId: input.portfolioId,
      name: input.name,
      ...(input.type ? { type: input.type } : {}),
    },
  });

  if (!exchange) {
    throw new Error(
      input.type
        ? `Add ${input.name} as a ${input.type.toLowerCase()} exchange before using it.`
        : `Add ${input.name} as an exchange before using it.`,
    );
  }
}
