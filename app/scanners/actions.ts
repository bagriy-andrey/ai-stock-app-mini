"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ScannerType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  runCryptoScanner,
  runNewsEventScanner,
  runOpportunityScanner,
  runPortfolioScanner,
  runWatchlistScanner,
} from "@/lib/scanners/scanners";

const SCANNERS_PATH = "/scanners";

export async function runScannerAction(formData: FormData) {
  const scannerType = String(formData.get("scannerType") ?? "") as ScannerType;
  let scannerRunId: string;

  if (scannerType === "PORTFOLIO") {
    scannerRunId = await runPortfolioScanner();
  } else if (scannerType === "WATCHLIST") {
    scannerRunId = await runWatchlistScanner();
  } else if (scannerType === "OPPORTUNITY") {
    scannerRunId = await runOpportunityScanner();
  } else if (scannerType === "NEWS_EVENT") {
    scannerRunId = await runNewsEventScanner();
  } else if (scannerType === "CRYPTO") {
    scannerRunId = await runCryptoScanner();
  } else {
    throw new Error(`Unsupported scanner type: ${scannerType}`);
  }

  revalidatePath(SCANNERS_PATH);
  redirect(`${SCANNERS_PATH}/${scannerRunId}`);
}

export async function addOpportunitySignalToWatchlist(formData: FormData) {
  const scannerSignalId = String(formData.get("scannerSignalId") ?? "");

  if (!scannerSignalId) {
    throw new Error("Missing scanner signal id.");
  }

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
