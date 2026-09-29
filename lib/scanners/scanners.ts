import type {
  AssetType,
  Prisma,
  ScannerType,
  SignalDirection,
  SignalSeverity,
  WatchlistPriority,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { fetchFmpNewsEvents } from "@/lib/scanners/news-provider";
import {
  calculateCandidateScore,
  getCandidateAction,
  rankCandidates,
} from "@/lib/scanners/ranking";
import {
  completeScannerRun,
  createScannerRun,
  failScannerRun,
  upsertMarketEvent,
  type ScannerSignalInput,
} from "@/lib/scanners/repository";
import {
  getPortfolioWeightPercent,
  getScannerPriceState,
  isHighConcentration,
  isNearTargetEntry,
  scannerThresholds,
} from "@/lib/scanners/thresholds";

type LatestPrice = {
  price: number;
  currency: string;
  observedAt: Date;
} | null;

type SignalDraft = Omit<ScannerSignalInput, "score" | "suggestedAction"> & {
  scoreInput: Parameters<typeof calculateCandidateScore>[0];
  isOpportunity?: boolean;
  hasSufficientData?: boolean;
};

export async function runPortfolioScanner() {
  return runScannerWithPersistence("PORTFOLIO", async (runId) => {
    const positions = await prisma.position.findMany({
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
      orderBy: {
        createdAt: "asc",
      },
    });

    const totalEstimatedValue = positions.reduce((sum, position) => {
      const latestPrice = toLatestPrice(position.asset.marketPrices[0]);
      const price = latestPrice?.price ?? position.averageCost.toNumber();

      return sum + position.quantity.toNumber() * price;
    }, 0);

    const signals = positions.flatMap((position) => {
      const latestPrice = toLatestPrice(position.asset.marketPrices[0]);
      const estimatedPrice = latestPrice?.price ?? position.averageCost.toNumber();
      const positionValue = position.quantity.toNumber() * estimatedPrice;
      const weightPercent = getPortfolioWeightPercent({
        positionValue,
        totalPortfolioValue: totalEstimatedValue,
      });

      return buildPortfolioSignals({
        assetId: position.assetId,
        symbol: position.asset.symbol,
        assetType: position.asset.assetType,
        quantity: position.quantity.toNumber(),
        averageCost: position.averageCost.toNumber(),
        latestPrice,
        weightPercent,
      });
    });

    const inputScope = {
      scannerRunId: runId,
      positionCount: positions.length,
      assetIds: positions.map((position) => position.assetId),
      thresholds: scannerThresholds,
      warnings:
        positions.length === 0
          ? ["No active portfolio positions were available to scan."]
          : [],
    };

    return {
      inputScope,
      signals: finalizeSignals(signals),
    };
  });
}

export async function runWatchlistScanner() {
  return runScannerWithPersistence("WATCHLIST", async (runId) => {
    const items = await prisma.watchlistItem.findMany({
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
      orderBy: [
        {
          priority: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    const signals = items.flatMap((item) =>
      buildWatchlistSignals({
        assetId: item.assetId,
        symbol: item.asset.symbol,
        priority: item.priority,
        targetEntryPrice: item.targetEntryPrice?.toNumber() ?? null,
        latestPrice: toLatestPrice(item.asset.marketPrices[0]),
      }),
    );

    const inputScope = {
      scannerRunId: runId,
      watchlistItemCount: items.length,
      assetIds: items.map((item) => item.assetId),
      thresholds: scannerThresholds,
      warnings:
        items.length === 0 ? ["No watchlist items were available to scan."] : [],
    };

    return {
      inputScope,
      signals: finalizeSignals(signals),
    };
  });
}

export async function runOpportunityScanner() {
  return runScannerWithPersistence("OPPORTUNITY", async (runId) => {
    const [ownedAssetIds, watchedAssetIds, universeAssets] = await Promise.all([
      prisma.position.findMany({
        select: {
          assetId: true,
        },
      }),
      prisma.watchlistItem.findMany({
        select: {
          assetId: true,
        },
      }),
      prisma.discoveryUniverseAsset.findMany({
        where: {
          discoveryUniverse: {
            isActive: true,
          },
        },
        include: {
          discoveryUniverse: true,
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
        orderBy: [
          {
            priority: "desc",
          },
          {
            createdAt: "asc",
          },
        ],
      }),
    ]);

    const excludedAssetIds = new Set([
      ...ownedAssetIds.map((position) => position.assetId),
      ...watchedAssetIds.map((item) => item.assetId),
    ]);

    const signals = universeAssets
      .filter((entry) => !excludedAssetIds.has(entry.assetId))
      .map((entry) =>
        buildOpportunitySignal({
          assetId: entry.assetId,
          symbol: entry.asset.symbol,
          assetType: entry.asset.assetType,
          priority: entry.priority,
          universeName: entry.discoveryUniverse.name,
          latestPrice: toLatestPrice(entry.asset.marketPrices[0]),
        }),
      );

    const inputScope = {
      scannerRunId: runId,
      universeAssetCount: universeAssets.length,
      excludedOwnedOrWatchedCount: universeAssets.length - signals.length,
      universeIds: [
        ...new Set(universeAssets.map((entry) => entry.discoveryUniverseId)),
      ],
      thresholds: scannerThresholds,
      warnings:
        universeAssets.length === 0
          ? [
              "No active discovery universe assets were available. Add assets to DiscoveryUniverseAsset before opportunity scanning.",
            ]
          : [],
    };

    return {
      inputScope,
      signals: finalizeSignals(signals),
    };
  });
}

export async function runCryptoScanner() {
  return runScannerWithPersistence("CRYPTO", async (runId) => {
    const assets = await prisma.asset.findMany({
      where: {
        assetType: "CRYPTO",
        OR: [
          {
            positions: {
              some: {},
            },
          },
          {
            watchlistItems: {
              some: {},
            },
          },
          {
            discoveryUniverseAssets: {
              some: {
                discoveryUniverse: {
                  isActive: true,
                },
              },
            },
          },
        ],
      },
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
        watchlistItems: {
          select: {
            id: true,
            priority: true,
          },
          take: 1,
        },
      },
      orderBy: {
        symbol: "asc",
      },
    });

    const signals = assets.flatMap((asset) => {
      const latestPrice = toLatestPrice(asset.marketPrices[0]);
      const priceState = getScannerPriceState(latestPrice?.observedAt ?? null);
      const isOwned = asset.positions.length > 0;
      const watchlistPriority = asset.watchlistItems[0]?.priority ?? "MEDIUM";
      const relevance = isOwned ? 0.8 : watchlistPriorityScore(watchlistPriority);

      if (priceState === "fresh") {
        return [];
      }

      return [
        createSignalDraft({
          assetId: asset.id,
          signalType: "crypto_price_freshness",
          severity: priceState === "missing" ? "MEDIUM" : "LOW",
          direction: "UNKNOWN",
          confidence: 0.85,
          title: `${asset.symbol} crypto price needs refresh`,
          summary:
            "Crypto scanner found stale or missing spot price coverage for a tracked crypto asset.",
          reasons: [
            {
              kind: "crypto_price_freshness",
              state: priceState,
              isOwned,
              isWatchlisted: asset.watchlistItems.length > 0,
            },
          ],
          risks: ["Crypto scanner does not use paid derivatives, on-chain, or social feeds in this MVP."],
          sourceRefs: [{ provider: "marketPrices", assetId: asset.id }],
          dataFreshness: { priceState },
          scoreInput: {
            severity: priceState === "missing" ? "MEDIUM" : "LOW",
            confidence: 0.85,
            portfolioRelevance: isOwned ? relevance : 0,
            watchlistPriority: isOwned ? 0 : relevance,
            dataFreshnessPenalty: priceState === "missing" ? 1 : 0.6,
          },
          hasSufficientData: priceState !== "missing",
        }),
      ];
    });

    const inputScope = {
      scannerRunId: runId,
      cryptoAssetCount: assets.length,
      assetIds: assets.map((asset) => asset.id),
      thresholds: scannerThresholds,
      warnings:
        assets.length === 0
          ? [
              "No crypto assets were found in portfolio, watchlist, or active discovery universes.",
            ]
          : [
              "Crypto scanner MVP uses only latest spot price freshness and does not ingest paid on-chain or derivatives data.",
            ],
    };

    return {
      inputScope,
      signals: finalizeSignals(signals),
    };
  });
}

export async function runNewsEventScanner() {
  return runScannerWithPersistence("NEWS_EVENT", async (runId) => {
    const assets = await prisma.asset.findMany({
      where: {
        assetType: {
          not: "CRYPTO",
        },
        OR: [
          {
            positions: {
              some: {},
            },
          },
          {
            watchlistItems: {
              some: {},
            },
          },
          {
            discoveryUniverseAssets: {
              some: {
                discoveryUniverse: {
                  isActive: true,
                },
              },
            },
          },
        ],
      },
      orderBy: {
        symbol: "asc",
      },
      take: 25,
    });

    if (!process.env.FMP_API_KEY) {
      const inputScope = {
        scannerRunId: runId,
        providerConfigured: false,
        provider: "fmp",
        scannedAssetCount: assets.length,
        thresholds: scannerThresholds,
        warnings: [
          "FMP_API_KEY is not configured. Add it to .env to enable provider-backed news/event scanning.",
        ],
      };

      return {
        inputScope,
        signals: [],
        status: "PARTIAL" as const,
        errorMessage: "FMP news provider is not configured.",
      };
    }

    const providerEvents = await fetchFmpNewsEvents(assets);
    const materialEvents = providerEvents.filter(
      (event) => event.severity !== "LOW" || event.confidence >= 0.6,
    );
    const persistedEvents = await Promise.all(
      materialEvents.map((event) => upsertMarketEvent(event)),
    );
    const signals = finalizeSignals(
      materialEvents.map((event, index) =>
        createSignalDraft({
          assetId: event.affectedAssetId ?? "",
          signalType: event.eventType,
          severity: event.severity,
          direction: event.direction,
          confidence: event.confidence,
          title: event.sourceTitle,
          summary: event.summary,
          reasons: [
            {
              kind: "provider_news_event",
              eventType: event.eventType,
              sourceProvider: event.sourceProvider,
              occurredAt: event.occurredAt.toISOString(),
            },
          ],
          risks: [
            "News classification is deterministic keyword normalization, not full AI analysis.",
          ],
          sourceRefs: [
            {
              provider: event.sourceProvider,
              url: event.sourceUrl,
              marketEventId: persistedEvents[index]?.id,
            },
          ],
          dataFreshness: {
            eventOccurredAt: event.occurredAt.toISOString(),
            provider: event.sourceProvider,
          },
          scoreInput: {
            severity: event.severity,
            confidence: event.confidence,
            eventRecency: getEventRecencyScore(event.occurredAt),
          },
          hasSufficientData: Boolean(event.affectedAssetId),
        }),
      ),
    );

    const inputScope = {
      scannerRunId: runId,
      providerConfigured: true,
      provider: "fmp",
      scannedAssetCount: assets.length,
      providerEventCount: providerEvents.length,
      persistedMaterialEventCount: persistedEvents.length,
      thresholds: scannerThresholds,
      warnings:
        assets.length === 0
          ? ["No stock/ETF assets were available for FMP news scanning."]
          : providerEvents.length === 0
            ? ["FMP returned no news events for the scanned assets."]
            : [],
    };

    return {
      inputScope,
      signals,
      status: "SUCCEEDED" as const,
    };
  });
}

async function runScannerWithPersistence(
  scannerType: ScannerType,
  build: (runId: string) => Promise<{
    inputScope: Prisma.InputJsonValue;
    signals: ScannerSignalInput[];
    status?: "SUCCEEDED" | "PARTIAL";
    errorMessage?: string | null;
  }>,
) {
  const run = await createScannerRun({
    scannerType,
    inputScope: {
      scannerType,
      thresholds: scannerThresholds,
    },
  });

  try {
    const result = await build(run.id);

    await completeScannerRun({
      scannerRunId: run.id,
      status: result.status ?? "SUCCEEDED",
      signals: result.signals,
      inputScope: result.inputScope,
      errorMessage: result.errorMessage ?? null,
    });
  } catch (error) {
    await failScannerRun({
      scannerRunId: run.id,
      errorMessage:
        error instanceof Error ? error.message : "Unknown scanner failure.",
    });

    throw error;
  }

  return run.id;
}

function buildPortfolioSignals(input: {
  assetId: string;
  symbol: string;
  assetType: AssetType;
  quantity: number;
  averageCost: number;
  latestPrice: LatestPrice;
  weightPercent: number;
}): SignalDraft[] {
  const priceState = getScannerPriceState(
    input.latestPrice?.observedAt ?? null,
  );
  const signals: SignalDraft[] = [];

  if (priceState === "missing" || priceState === "stale") {
    signals.push(
      createSignalDraft({
        assetId: input.assetId,
        signalType: priceState === "missing" ? "missing_latest_price" : "stale_latest_price",
        severity: priceState === "missing" ? "MEDIUM" : "LOW",
        direction: "UNKNOWN",
        confidence: 0.95,
        title:
          priceState === "missing"
            ? `${input.symbol} has no latest price`
            : `${input.symbol} price is stale`,
        summary:
          priceState === "missing"
            ? "Owned assets need a latest price before valuation and scanner ranking are reliable."
            : "The latest price is older than the scanner freshness threshold.",
        reasons: [
          {
            kind: "price_freshness",
            state: priceState,
            staleAfterHours: scannerThresholds.priceStaleAfterHours,
          },
        ],
        risks: ["Portfolio value and P&L may be incomplete."],
        sourceRefs: [{ provider: "marketPrices", assetId: input.assetId }],
        dataFreshness: { priceState },
        scoreInput: {
          severity: priceState === "missing" ? "MEDIUM" : "LOW",
          confidence: 0.95,
          portfolioRelevance: portfolioRelevance(input.weightPercent),
          dataFreshnessPenalty: priceState === "missing" ? 1 : 0.6,
        },
        hasSufficientData: priceState !== "missing",
      }),
    );
  }

  if (isHighConcentration(input.weightPercent)) {
    signals.push(
      createSignalDraft({
        assetId: input.assetId,
        signalType: "high_concentration",
        severity: "HIGH",
        direction: "NEUTRAL",
        confidence: 0.9,
        title: `${input.symbol} concentration is high`,
        summary: `${input.symbol} is estimated at ${input.weightPercent.toFixed(1)}% of scanned portfolio value.`,
        reasons: [
          {
            kind: "portfolio_weight",
            weightPercent: input.weightPercent,
            thresholdPercent: scannerThresholds.portfolioConcentrationPercent,
          },
        ],
        risks: ["Single-asset concentration can dominate portfolio risk."],
        sourceRefs: [{ provider: "portfolio", assetId: input.assetId }],
        dataFreshness: { priceState },
        scoreInput: {
          severity: "HIGH",
          confidence: 0.9,
          portfolioRelevance: portfolioRelevance(input.weightPercent),
          dataFreshnessPenalty: priceState === "fresh" ? 0 : 0.4,
        },
      }),
    );
  }

  const latestPrice = input.latestPrice?.price;
  if (latestPrice && input.averageCost > 0) {
    const pnlPercent = ((latestPrice - input.averageCost) / input.averageCost) * 100;
    if (Math.abs(pnlPercent) >= 20) {
      signals.push(
        createSignalDraft({
          assetId: input.assetId,
          signalType: "large_unrealized_move",
          severity: Math.abs(pnlPercent) >= 40 ? "HIGH" : "MEDIUM",
          direction: pnlPercent >= 0 ? "POSITIVE" : "NEGATIVE",
          confidence: 0.8,
          title: `${input.symbol} moved ${pnlPercent >= 0 ? "above" : "below"} cost basis`,
          summary: `Latest price implies approximately ${pnlPercent.toFixed(1)}% unrealized move versus average cost.`,
          reasons: [
            {
              kind: "cost_basis_move",
              pnlPercent,
              averageCost: input.averageCost,
              latestPrice,
            },
          ],
          risks: ["Manual cost basis and price snapshots may be stale or incomplete."],
          sourceRefs: [{ provider: "marketPrices", assetId: input.assetId }],
          dataFreshness: { priceState },
          scoreInput: {
            severity: Math.abs(pnlPercent) >= 40 ? "HIGH" : "MEDIUM",
            confidence: 0.8,
            portfolioRelevance: portfolioRelevance(input.weightPercent),
            dataFreshnessPenalty: priceState === "fresh" ? 0 : 0.4,
          },
        }),
      );
    }
  }

  if (input.assetType === "CRYPTO" && priceState !== "fresh") {
    signals.push(
      createSignalDraft({
        assetId: input.assetId,
        signalType: "crypto_price_freshness",
        severity: "MEDIUM",
        direction: "UNKNOWN",
        confidence: 0.85,
        title: `${input.symbol} crypto price needs refresh`,
        summary: "Crypto assets can move continuously, so stale or missing prices reduce scanner usefulness.",
        reasons: [{ kind: "crypto_price_freshness", state: priceState }],
        risks: ["Volatile crypto exposure may be under-monitored."],
        sourceRefs: [{ provider: "marketPrices", assetId: input.assetId }],
        dataFreshness: { priceState },
        scoreInput: {
          severity: "MEDIUM",
          confidence: 0.85,
          portfolioRelevance: portfolioRelevance(input.weightPercent),
          dataFreshnessPenalty: priceState === "missing" ? 1 : 0.6,
        },
        hasSufficientData: priceState !== "missing",
      }),
    );
  }

  return signals;
}

function buildWatchlistSignals(input: {
  assetId: string;
  symbol: string;
  priority: WatchlistPriority;
  targetEntryPrice: number | null;
  latestPrice: LatestPrice;
}): SignalDraft[] {
  const priceState = getScannerPriceState(
    input.latestPrice?.observedAt ?? null,
  );
  const priorityScore = watchlistPriorityScore(input.priority);
  const signals: SignalDraft[] = [];

  if (priceState === "missing" || priceState === "stale") {
    const severity: SignalSeverity =
      input.priority === "HIGH" && priceState === "missing" ? "MEDIUM" : "LOW";
    signals.push(
      createSignalDraft({
        assetId: input.assetId,
        signalType: priceState === "missing" ? "missing_latest_price" : "stale_latest_price",
        severity,
        direction: "UNKNOWN",
        confidence: 0.9,
        title:
          priceState === "missing"
            ? `${input.symbol} has no watchlist price`
            : `${input.symbol} watchlist price is stale`,
        summary: "Watchlist scanning needs a fresh latest price to compare targets and material moves.",
        reasons: [
          {
            kind: "price_freshness",
            state: priceState,
            priority: input.priority,
          },
        ],
        risks: ["Entry-target checks may be unavailable."],
        sourceRefs: [{ provider: "marketPrices", assetId: input.assetId }],
        dataFreshness: { priceState },
        scoreInput: {
          severity,
          confidence: 0.9,
          watchlistPriority: priorityScore,
          dataFreshnessPenalty: priceState === "missing" ? 1 : 0.5,
        },
        hasSufficientData: priceState !== "missing",
      }),
    );
  }

  if (
    input.latestPrice &&
    input.targetEntryPrice &&
    isNearTargetEntry({
      currentPrice: input.latestPrice.price,
      targetEntryPrice: input.targetEntryPrice,
    })
  ) {
    const belowTarget = input.latestPrice.price <= input.targetEntryPrice;
    signals.push(
      createSignalDraft({
        assetId: input.assetId,
        signalType: "near_target_entry",
        severity: belowTarget ? "HIGH" : "MEDIUM",
        direction: "POSITIVE",
        confidence: 0.85,
        title: `${input.symbol} is near target entry`,
        summary: belowTarget
          ? "Latest price is at or below the watchlist target entry."
          : `Latest price is within ${scannerThresholds.targetEntryProximityPercent}% of the target entry.`,
        reasons: [
          {
            kind: "target_entry",
            currentPrice: input.latestPrice.price,
            targetEntryPrice: input.targetEntryPrice,
            thresholdPercent: scannerThresholds.targetEntryProximityPercent,
          },
        ],
        risks: ["Target entry alone is not a buy recommendation."],
        sourceRefs: [{ provider: "watchlist", assetId: input.assetId }],
        dataFreshness: { priceState },
        scoreInput: {
          severity: belowTarget ? "HIGH" : "MEDIUM",
          confidence: 0.85,
          watchlistPriority: priorityScore,
          dataFreshnessPenalty: priceState === "fresh" ? 0 : 0.4,
        },
      }),
    );
  }

  return signals;
}

function buildOpportunitySignal(input: {
  assetId: string;
  symbol: string;
  assetType: AssetType;
  priority: number;
  universeName: string;
  latestPrice: LatestPrice;
}): SignalDraft {
  const priceState = getScannerPriceState(
    input.latestPrice?.observedAt ?? null,
  );
  const normalizedPriority = Math.max(0, Math.min(1, input.priority / 100));
  const hasPrice = Boolean(input.latestPrice);
  const severity: SignalSeverity =
    normalizedPriority >= 0.75 && hasPrice ? "MEDIUM" : "LOW";
  const opportunityType =
    input.assetType === "CRYPTO" ? "TACTICAL" : "LONG_TERM";

  return createSignalDraft({
    assetId: input.assetId,
    signalType: "discovery_universe_candidate",
    severity,
    direction: "POSITIVE",
    confidence: hasPrice ? 0.65 : 0.45,
    title: `${input.symbol} is an unowned discovery candidate`,
    summary: `${input.symbol} is in ${input.universeName} and is not currently owned or watchlisted. Opportunity type: ${opportunityType}.`,
    reasons: [
      {
        kind: "discovery_universe",
        universeName: input.universeName,
        priority: input.priority,
        opportunityType,
      },
    ],
    risks: hasPrice
      ? ["Discovery-universe membership is only a triage signal."]
      : ["No latest price is available, so scoring confidence is lower."],
    sourceRefs: [{ provider: "discoveryUniverse", assetId: input.assetId }],
    dataFreshness: { priceState },
    scoreInput: {
      severity,
      confidence: hasPrice ? 0.65 : 0.45,
      opportunity: normalizedPriority,
      dataFreshnessPenalty: hasPrice ? 0 : 0.8,
    },
    isOpportunity: true,
    hasSufficientData: hasPrice,
  });
}

function createSignalDraft(input: {
  assetId: string;
  signalType: string;
  severity: SignalSeverity;
  direction: SignalDirection;
  confidence: number;
  title: string;
  summary: string;
  reasons: Prisma.InputJsonValue[];
  risks: Prisma.InputJsonValue[];
  sourceRefs: Prisma.InputJsonValue[];
  dataFreshness: Prisma.InputJsonValue;
  scoreInput: SignalDraft["scoreInput"];
  isOpportunity?: boolean;
  hasSufficientData?: boolean;
}): SignalDraft {
  const score = calculateCandidateScore(input.scoreInput);
  const suggestedAction = getCandidateAction({
    score,
    isOpportunity: input.isOpportunity,
    hasSufficientData: input.hasSufficientData,
  });

  return {
    assetId: input.assetId,
    signalType: input.signalType,
    severity: input.severity,
    direction: input.direction,
    confidence: input.confidence,
    title: input.title,
    summary: input.summary,
    reasons: input.reasons,
    risks: input.risks,
    sourceRefs: input.sourceRefs,
    dataFreshness: input.dataFreshness,
    scoreInput: input.scoreInput,
    isOpportunity: input.isOpportunity,
    hasSufficientData: input.hasSufficientData,
    isDeepAnalysisCandidate: suggestedAction === "RUN_DEEP_ANALYSIS",
  };
}

function finalizeSignals(signals: SignalDraft[]): ScannerSignalInput[] {
  return rankCandidates(
    signals.map((signal) => {
      const score = calculateCandidateScore(signal.scoreInput);
      const suggestedAction = getCandidateAction({
        score,
        isOpportunity: signal.isOpportunity,
        hasSufficientData: signal.hasSufficientData,
      });

      return {
        assetId: signal.assetId,
        signalType: signal.signalType,
        severity: signal.severity,
        direction: signal.direction,
        score,
        confidence: signal.confidence,
        title: signal.title,
        summary: signal.summary,
        reasons: signal.reasons,
        risks: signal.risks,
        sourceRefs: signal.sourceRefs,
        dataFreshness: signal.dataFreshness,
        isDeepAnalysisCandidate: suggestedAction === "RUN_DEEP_ANALYSIS",
        suggestedAction,
      };
    }),
  );
}

function toLatestPrice(
  price:
    | {
        price: { toNumber: () => number };
        currency: string;
        observedAt: Date;
      }
    | undefined,
): LatestPrice {
  if (!price) {
    return null;
  }

  return {
    price: price.price.toNumber(),
    currency: price.currency,
    observedAt: price.observedAt,
  };
}

function portfolioRelevance(weightPercent: number): number {
  return Math.max(0.1, Math.min(1, weightPercent / 50));
}

function watchlistPriorityScore(priority: WatchlistPriority): number {
  const scores: Record<WatchlistPriority, number> = {
    LOW: 0.25,
    MEDIUM: 0.55,
    HIGH: 1,
  };

  return scores[priority];
}

function getEventRecencyScore(occurredAt: Date): number {
  const ageHours = Math.max(0, Date.now() - occurredAt.getTime()) / 3_600_000;

  if (ageHours <= 24) {
    return 1;
  }

  if (ageHours <= 72) {
    return 0.7;
  }

  if (ageHours <= 168) {
    return 0.4;
  }

  return 0.15;
}
