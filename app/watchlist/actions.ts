"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import {
  watchlistItemDeleteFormSchema,
  watchlistItemFormSchema,
  watchlistItemUpdateFormSchema,
} from "@/lib/watchlist/validation";

const WATCHLIST_PATH = "/watchlist";

export async function createWatchlistItem(formData: FormData) {
  const input = watchlistItemFormSchema.parse(Object.fromEntries(formData));

  await prisma.$transaction(async (tx) => {
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

    const existingItem = await tx.watchlistItem.findUnique({
      where: {
        assetId: asset.id,
      },
    });

    if (existingItem) {
      throw new Error(`${input.symbol} is already on the watchlist.`);
    }

    await tx.watchlistItem.create({
      data: {
        assetId: asset.id,
        investmentIntent: input.investmentIntent,
        priority: input.priority,
        targetEntryPrice: input.targetEntryPrice,
        notes: input.notes,
      },
    });
  });

  revalidatePath(WATCHLIST_PATH);
  revalidatePath("/");
}

export async function updateWatchlistItem(formData: FormData) {
  const input = watchlistItemUpdateFormSchema.parse(Object.fromEntries(formData));

  await prisma.$transaction(async (tx) => {
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

    await tx.watchlistItem.update({
      where: {
        id: input.watchlistItemId,
      },
      data: {
        assetId: asset.id,
        investmentIntent: input.investmentIntent,
        priority: input.priority,
        targetEntryPrice: input.targetEntryPrice,
        notes: input.notes,
      },
    });
  });

  revalidatePath(WATCHLIST_PATH);
}

export async function deleteWatchlistItem(formData: FormData) {
  const input = watchlistItemDeleteFormSchema.parse(Object.fromEntries(formData));

  await prisma.watchlistItem.delete({
    where: {
      id: input.watchlistItemId,
    },
  });

  revalidatePath(WATCHLIST_PATH);
  revalidatePath("/");
}
