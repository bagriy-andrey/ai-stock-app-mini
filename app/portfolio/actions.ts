"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { calculateWeightedAverageCost } from "@/lib/portfolio/calculations";
import {
  getOrCreateDefaultPortfolio,
  upsertManualAsset,
} from "@/lib/portfolio/repository";
import {
  cashBalanceDeleteFormSchema,
  cashBalanceFormSchema,
  portfolioBaseCurrencyFormSchema,
  positionDeleteFormSchema,
  positionFormSchema,
  positionUpdateFormSchema,
} from "@/lib/portfolio/validation";

const PORTFOLIO_PATH = "/portfolio";

export async function createPosition(formData: FormData) {
  const input = positionFormSchema.parse(Object.fromEntries(formData));
  const portfolio = await getOrCreateDefaultPortfolio();
  const asset = await upsertManualAsset({
    symbol: input.symbol,
    name: input.name,
    assetType: input.assetType,
    currency: input.assetCurrency,
    exchange: input.exchange,
    provider: input.provider,
    providerSymbol: input.providerSymbol,
  });

  const existingPosition = await prisma.position.findUnique({
    where: {
      portfolioId_assetId: {
        portfolioId: portfolio.id,
        assetId: asset.id,
      },
    },
  });

  if (!existingPosition) {
    await prisma.position.create({
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

    revalidatePath(PORTFOLIO_PATH);
    return;
  }

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

  await prisma.position.update({
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

  revalidatePath(PORTFOLIO_PATH);
}

export async function updatePosition(formData: FormData) {
  const input = positionUpdateFormSchema.parse(Object.fromEntries(formData));
  const asset = await upsertManualAsset({
    symbol: input.symbol,
    name: input.name,
    assetType: input.assetType,
    currency: input.assetCurrency,
    exchange: input.exchange,
    provider: input.provider,
    providerSymbol: input.providerSymbol,
  });

  await prisma.position.update({
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

  await prisma.cashBalance.upsert({
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
