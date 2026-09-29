import type {
  Prisma,
  ScannerRunStatus,
  ScannerRunTrigger,
  ScannerType,
  SignalDirection,
  SignalSeverity,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { NormalizedMarketEvent } from "@/lib/scanners/events";
import { SCANNER_CONFIGURATION_VERSION } from "@/lib/scanners/thresholds";

export type ScannerSignalInput = {
  assetId?: string | null;
  signalType: string;
  severity: SignalSeverity;
  direction: SignalDirection;
  score: number;
  confidence: number;
  title: string;
  summary: string;
  reasons: Prisma.InputJsonValue[];
  risks: Prisma.InputJsonValue[];
  sourceRefs: Prisma.InputJsonValue[];
  dataFreshness: Prisma.InputJsonValue;
  isDeepAnalysisCandidate: boolean;
  suggestedAction: string;
};

export type ScannerRunSummary = {
  id: string;
  scannerType: ScannerType;
  status: ScannerRunStatus;
  trigger: ScannerRunTrigger;
  configurationVersion: string;
  inputScope: Prisma.JsonValue;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  signalCount: number;
  candidateCount: number;
};

export type ScannerSignalSummary = {
  id: string;
  scannerRunId: string;
  assetId: string | null;
  symbol: string | null;
  name: string | null;
  assetType: string | null;
  signalType: string;
  severity: SignalSeverity;
  direction: SignalDirection;
  score: number;
  confidence: number;
  title: string;
  summary: string;
  reasons: Prisma.JsonValue;
  risks: Prisma.JsonValue;
  sourceRefs: Prisma.JsonValue;
  dataFreshness: Prisma.JsonValue;
  isDeepAnalysisCandidate: boolean;
  suggestedAction: string;
  createdAt: Date;
};

export type ScannerRunDetail = ScannerRunSummary & {
  signals: ScannerSignalSummary[];
};

export async function createScannerRun(input: {
  scannerType: ScannerType;
  trigger?: ScannerRunTrigger;
  inputScope: Prisma.InputJsonValue;
}) {
  return prisma.scannerRun.create({
    data: {
      scannerType: input.scannerType,
      trigger: input.trigger ?? "MANUAL",
      status: "RUNNING",
      configurationVersion: SCANNER_CONFIGURATION_VERSION,
      inputScope: input.inputScope,
      startedAt: new Date(),
    },
  });
}

export async function completeScannerRun(input: {
  scannerRunId: string;
  status: Exclude<ScannerRunStatus, "PENDING" | "RUNNING">;
  signals: ScannerSignalInput[];
  inputScope?: Prisma.InputJsonValue;
  errorMessage?: string | null;
}) {
  return prisma.scannerRun.update({
    where: {
      id: input.scannerRunId,
    },
    data: {
      status: input.status,
      inputScope: input.inputScope,
      completedAt: new Date(),
      errorMessage: input.errorMessage ?? null,
      signals: {
        create: input.signals.map((signal) => ({
          assetId: signal.assetId ?? null,
          signalType: signal.signalType,
          severity: signal.severity,
          direction: signal.direction,
          score: signal.score,
          confidence: signal.confidence,
          title: signal.title,
          summary: signal.summary,
          reasons: signal.reasons,
          risks: signal.risks,
          sourceRefs: signal.sourceRefs,
          dataFreshness: signal.dataFreshness,
          isDeepAnalysisCandidate: signal.isDeepAnalysisCandidate,
          suggestedAction: signal.suggestedAction,
        })),
      },
    },
  });
}

export async function failScannerRun(input: {
  scannerRunId: string;
  errorMessage: string;
  inputScope?: Prisma.InputJsonValue;
}) {
  return prisma.scannerRun.update({
    where: {
      id: input.scannerRunId,
    },
    data: {
      status: "FAILED",
      inputScope: input.inputScope,
      completedAt: new Date(),
      errorMessage: input.errorMessage,
    },
  });
}

export async function getScannerDashboard(): Promise<ScannerRunSummary[]> {
  const runs = await prisma.scannerRun.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    include: {
      signals: {
        select: {
          isDeepAnalysisCandidate: true,
        },
      },
    },
  });

  return runs.map((run) => ({
    id: run.id,
    scannerType: run.scannerType,
    status: run.status,
    trigger: run.trigger,
    configurationVersion: run.configurationVersion,
    inputScope: run.inputScope,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    errorMessage: run.errorMessage,
    createdAt: run.createdAt,
    signalCount: run.signals.length,
    candidateCount: run.signals.filter((signal) => signal.isDeepAnalysisCandidate)
      .length,
  }));
}

export async function getScannerRunDetail(
  scannerRunId: string,
): Promise<ScannerRunDetail | null> {
  const run = await prisma.scannerRun.findUnique({
    where: {
      id: scannerRunId,
    },
    include: {
      signals: {
        orderBy: [
          {
            score: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        include: {
          asset: true,
        },
      },
    },
  });

  if (!run) {
    return null;
  }

  return {
    id: run.id,
    scannerType: run.scannerType,
    status: run.status,
    trigger: run.trigger,
    configurationVersion: run.configurationVersion,
    inputScope: run.inputScope,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    errorMessage: run.errorMessage,
    createdAt: run.createdAt,
    signalCount: run.signals.length,
    candidateCount: run.signals.filter((signal) => signal.isDeepAnalysisCandidate)
      .length,
    signals: run.signals.map((signal) => ({
      id: signal.id,
      scannerRunId: signal.scannerRunId,
      assetId: signal.assetId,
      symbol: signal.asset?.symbol ?? null,
      name: signal.asset?.name ?? null,
      assetType: signal.asset?.assetType ?? null,
      signalType: signal.signalType,
      severity: signal.severity,
      direction: signal.direction,
      score: signal.score.toNumber(),
      confidence: signal.confidence.toNumber(),
      title: signal.title,
      summary: signal.summary,
      reasons: signal.reasons,
      risks: signal.risks,
      sourceRefs: signal.sourceRefs,
      dataFreshness: signal.dataFreshness,
      isDeepAnalysisCandidate: signal.isDeepAnalysisCandidate,
      suggestedAction: signal.suggestedAction,
      createdAt: signal.createdAt,
    })),
  };
}

export async function upsertMarketEvent(event: NormalizedMarketEvent) {
  return prisma.marketEvent.upsert({
    where: {
      dedupeKey: event.dedupeKey,
    },
    create: {
      dedupeKey: event.dedupeKey,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
      sourceProvider: event.sourceProvider,
      sourceUrl: event.sourceUrl,
      sourceTitle: event.sourceTitle,
      affectedAssetId: event.affectedAssetId,
      affectedEntity: event.affectedEntity,
      assetClass: event.assetClass,
      sector: event.sector,
      country: event.country,
      direction: event.direction,
      severity: event.severity,
      confidence: event.confidence,
      summary: event.summary,
      rawPayload: toJsonValue(event.rawPayload),
    },
    update: {
      confidence: event.confidence,
      severity: event.severity,
      summary: event.summary,
      rawPayload: toJsonValue(event.rawPayload),
      detectedAt: new Date(),
    },
  });
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
