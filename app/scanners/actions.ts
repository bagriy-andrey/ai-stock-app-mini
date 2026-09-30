"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AssetType, type ScannerType } from "@prisma/client";
import { z } from "zod";
import { startDeepAnalysis } from "@/lib/analysis/orchestrator";
import { prisma } from "@/lib/db/prisma";
import {
  runCryptoScanner,
  runNewsEventScanner,
  runOpportunityScanner,
  runPortfolioScanner,
  runWatchlistScanner,
  type ScannerRunOptions,
} from "@/lib/scanners/scanners";
import { SUPPORTED_PORTFOLIO_CURRENCIES } from "@/lib/portfolio/currencies";

const SCANNERS_PATH = "/scanners";

const checkboxBooleanSchema = z
  .union([z.literal("on"), z.literal("true"), z.literal("false")])
  .optional()
  .transform((value) => value === "on" || value === "true");

const scannerRunFormSchema = z.object({
  scannerType: z.enum([
    "PORTFOLIO",
    "WATCHLIST",
    "OPPORTUNITY",
    "CRYPTO",
    "NEWS_EVENT",
  ]),
  universeId: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .optional(),
  highPriorityOnly: checkboxBooleanSchema,
  staleDataOnly: checkboxBooleanSchema,
  maxAssets: z
    .union([z.literal(""), z.coerce.number().int().positive().max(500)])
    .transform((value) => (value === "" ? null : value))
    .optional(),
});

const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value));

const universeFormSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: optionalTextSchema,
});

const universeToggleSchema = z.object({
  universeId: z.string().min(1),
  isActive: checkboxBooleanSchema,
});

const universeDeleteSchema = z.object({
  universeId: z.string().min(1),
});

const universeAssetFormSchema = z.object({
  universeId: z.string().min(1),
  symbol: z.string().trim().min(1).max(24).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1).max(120),
  assetType: z.nativeEnum(AssetType),
  assetCurrency: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.enum(SUPPORTED_PORTFOLIO_CURRENCIES)),
  exchange: optionalTextSchema,
  provider: z.string().trim().min(1).max(40).transform((value) => value.toLowerCase()),
  providerSymbol: z.string().trim().min(1).max(120),
  priority: z.coerce.number().int().min(1).max(100),
  notes: optionalTextSchema,
});

const universeAssetDeleteSchema = z.object({
  universeAssetId: z.string().min(1),
});

const scannerSignalFormSchema = z.object({
  scannerSignalId: z.string().min(1),
});

export async function runScannerAction(formData: FormData) {
  const input = scannerRunFormSchema.parse(Object.fromEntries(formData));
  const scannerType = input.scannerType as ScannerType;
  const options: ScannerRunOptions = {
    universeId: input.universeId ?? null,
    highPriorityOnly: Boolean(input.highPriorityOnly),
    staleDataOnly: Boolean(input.staleDataOnly),
    maxAssets: input.maxAssets ?? null,
  };
  let scannerRunId: string;

  if (scannerType === "PORTFOLIO") {
    scannerRunId = await runPortfolioScanner(options);
  } else if (scannerType === "WATCHLIST") {
    scannerRunId = await runWatchlistScanner(options);
  } else if (scannerType === "OPPORTUNITY") {
    scannerRunId = await runOpportunityScanner(options);
  } else if (scannerType === "NEWS_EVENT") {
    scannerRunId = await runNewsEventScanner(options);
  } else if (scannerType === "CRYPTO") {
    scannerRunId = await runCryptoScanner(options);
  } else {
    throw new Error(`Unsupported scanner type: ${scannerType}`);
  }

  revalidatePath(SCANNERS_PATH);
  redirect(`${SCANNERS_PATH}/${scannerRunId}`);
}

export async function addOpportunitySignalToWatchlist(formData: FormData) {
  const { scannerSignalId } = scannerSignalFormSchema.parse(
    Object.fromEntries(formData),
  );

  await prisma.$transaction(async (tx) => {
    const signal = await tx.scannerSignal.findUnique({
      where: {
        id: scannerSignalId,
      },
      include: {
        asset: true,
      },
    });

    if (!signal?.assetId || !signal.asset) {
      throw new Error("Scanner signal is not linked to an asset.");
    }

    if (signal.suggestedAction !== "ADD_TO_WATCHLIST") {
      throw new Error("Only opportunity candidates can be added from scanners.");
    }

    const existingItem = await tx.watchlistItem.findUnique({
      where: {
        assetId: signal.assetId,
      },
    });

    if (existingItem) {
      return;
    }

    await tx.watchlistItem.create({
      data: {
        assetId: signal.assetId,
        investmentIntent:
          signal.asset.assetType === "CRYPTO" ? "TACTICAL" : "LONG_TERM",
        priority: signal.severity === "HIGH" ? "HIGH" : "MEDIUM",
        notes: `Added from scanner signal "${signal.title}". Advisory-only candidate, not a trade instruction.`,
      },
    });
  });

  revalidatePath(SCANNERS_PATH);
  revalidatePath("/watchlist");
}

export async function createDiscoveryUniverse(formData: FormData) {
  const input = universeFormSchema.parse(Object.fromEntries(formData));

  await prisma.discoveryUniverse.create({
    data: {
      name: input.name,
      description: input.description,
    },
  });

  revalidatePath(SCANNERS_PATH);
}

export async function toggleDiscoveryUniverse(formData: FormData) {
  const input = universeToggleSchema.parse(Object.fromEntries(formData));

  await prisma.discoveryUniverse.update({
    where: {
      id: input.universeId,
    },
    data: {
      isActive: input.isActive,
    },
  });

  revalidatePath(SCANNERS_PATH);
}

export async function deleteDiscoveryUniverse(formData: FormData) {
  const input = universeDeleteSchema.parse(Object.fromEntries(formData));

  await prisma.discoveryUniverse.delete({
    where: {
      id: input.universeId,
    },
  });

  revalidatePath(SCANNERS_PATH);
}

export async function addDiscoveryUniverseAsset(formData: FormData) {
  const input = universeAssetFormSchema.parse(Object.fromEntries(formData));

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
        symbol: input.symbol,
        name: input.name,
        assetType: input.assetType,
        currency: input.assetCurrency,
        exchange: input.exchange,
      },
    });

    await tx.discoveryUniverseAsset.upsert({
      where: {
        discoveryUniverseId_assetId: {
          discoveryUniverseId: input.universeId,
          assetId: asset.id,
        },
      },
      create: {
        discoveryUniverseId: input.universeId,
        assetId: asset.id,
        priority: input.priority,
        notes: input.notes,
      },
      update: {
        priority: input.priority,
        notes: input.notes,
      },
    });
  });

  revalidatePath(SCANNERS_PATH);
}

export async function removeDiscoveryUniverseAsset(formData: FormData) {
  const input = universeAssetDeleteSchema.parse(Object.fromEntries(formData));

  await prisma.discoveryUniverseAsset.delete({
    where: {
      id: input.universeAssetId,
    },
  });

  revalidatePath(SCANNERS_PATH);
}

export async function runDeepAnalysisFromScannerSignal(formData: FormData) {
  const { scannerSignalId } = scannerSignalFormSchema.parse(
    Object.fromEntries(formData),
  );
  const result = await startDeepAnalysis({
    source: "scanner",
    scannerSignalId,
  });
  const toast = result.status === "SUCCEEDED" ? "success" : "error";

  revalidatePath("/analysis");
  revalidatePath(`/analysis/${result.agentRunId}`);
  redirect(`/analysis/${result.agentRunId}?analysisToast=${toast}`);
}
