import type {
  ScannerDirection,
  ScannerSeverity,
} from "@/lib/scanners/ranking";
import {
  normalizeEventType,
  type MarketEventType,
} from "@/lib/scanners/taxonomy";

export type RawMarketEventInput = {
  eventType: string;
  occurredAt: Date;
  sourceProvider: string;
  sourceUrl?: string | null;
  sourceTitle: string;
  affectedAssetId?: string | null;
  affectedEntity?: string | null;
  assetClass?: string | null;
  sector?: string | null;
  country?: string | null;
  direction?: ScannerDirection;
  severity?: ScannerSeverity;
  confidence?: number;
  summary?: string;
  rawPayload?: unknown;
};

export type NormalizedMarketEvent = {
  eventType: MarketEventType;
  occurredAt: Date;
  sourceProvider: string;
  sourceUrl: string | null;
  sourceTitle: string;
  affectedAssetId: string | null;
  affectedEntity: string | null;
  assetClass: string | null;
  sector: string | null;
  country: string | null;
  direction: ScannerDirection;
  severity: ScannerSeverity;
  confidence: number;
  summary: string;
  rawPayload: unknown;
  dedupeKey: string;
};

export function normalizeMarketEvent(
  input: RawMarketEventInput,
): NormalizedMarketEvent {
  const sourceTitle = input.sourceTitle.trim();
  const affectedEntity = input.affectedEntity?.trim() || null;
  const eventType = normalizeEventType(input.eventType);
  const occurredAt = input.occurredAt;

  return {
    eventType,
    occurredAt,
    sourceProvider: input.sourceProvider.trim() || "unknown",
    sourceUrl: input.sourceUrl?.trim() || null,
    sourceTitle,
    affectedAssetId: input.affectedAssetId ?? null,
    affectedEntity,
    assetClass: input.assetClass?.trim() || null,
    sector: input.sector?.trim() || null,
    country: input.country?.trim() || null,
    direction: input.direction ?? "UNKNOWN",
    severity: input.severity ?? "MEDIUM",
    confidence: clampConfidence(input.confidence ?? 0.5),
    summary: input.summary?.trim() || sourceTitle,
    rawPayload: input.rawPayload ?? input,
    dedupeKey: buildEventDedupeKey({
      eventType,
      occurredAt,
      sourceProvider: input.sourceProvider,
      sourceTitle,
      affectedAssetId: input.affectedAssetId ?? null,
      affectedEntity,
    }),
  };
}

export function buildEventDedupeKey(input: {
  eventType: string;
  occurredAt: Date;
  sourceProvider: string;
  sourceTitle: string;
  affectedAssetId?: string | null;
  affectedEntity?: string | null;
}): string {
  const day = input.occurredAt.toISOString().slice(0, 10);
  const entity = input.affectedAssetId ?? input.affectedEntity ?? "unknown";
  const titleSlug = input.sourceTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return [
    input.sourceProvider.toLowerCase(),
    input.eventType,
    day,
    entity,
    titleSlug,
  ].join(":");
}

export function findDuplicateEvent<T extends { dedupeKey: string }>(
  events: T[],
  candidate: T,
): T | null {
  return events.find((event) => event.dedupeKey === candidate.dedupeKey) ?? null;
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0.5;
  }

  return Math.max(0, Math.min(1, value));
}
