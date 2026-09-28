import { prisma } from "@/lib/db/prisma";
import { normalizeCurrency } from "@/lib/portfolio/currencies";

export const MANUAL_PRICE_PROVIDER = "manual";

export function createManualPriceSnapshot(input: {
  assetId: string;
  price: number;
  currency: string;
  observedAt: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const asset = await tx.asset.findUniqueOrThrow({
      where: {
        id: input.assetId,
      },
      select: {
        providerSymbol: true,
      },
    });

    return tx.marketPrice.create({
      data: {
        assetId: input.assetId,
        price: input.price,
        currency: normalizeCurrency(input.currency),
        provider: MANUAL_PRICE_PROVIDER,
        providerSymbol: asset.providerSymbol,
        observedAt: input.observedAt,
      },
    });
  });
}
