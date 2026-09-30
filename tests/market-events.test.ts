import { describe, expect, it } from "vitest";
import {
  findDuplicateEvent,
  normalizeMarketEvent,
} from "@/lib/scanners/events";
import { normalizeEventType } from "@/lib/scanners/taxonomy";

describe("market event taxonomy and normalization", () => {
  it("normalizes unknown event types to the fallback taxonomy entry", () => {
    expect(normalizeEventType("unmapped_provider_category")).toBe(
      "unknown_material_event",
    );
  });

  it("builds stable duplicate keys for repeated source coverage", () => {
    const event = normalizeMarketEvent({
      eventType: "analyst_upgrade",
      occurredAt: new Date("2026-09-29T10:00:00.000Z"),
      sourceProvider: "demo",
      sourceTitle: "ACME upgraded after earnings",
      affectedAssetId: "asset_1",
      confidence: 0.8,
    });
    const duplicate = normalizeMarketEvent({
      eventType: "analyst_upgrade",
      occurredAt: new Date("2026-09-29T22:00:00.000Z"),
      sourceProvider: "demo",
      sourceTitle: "ACME upgraded after earnings",
      affectedAssetId: "asset_1",
      confidence: 0.7,
    });

    expect(duplicate.dedupeKey).toBe(event.dedupeKey);
    expect(findDuplicateEvent([event], duplicate)).toBe(event);
  });

  it("clamps provider confidence into a valid range", () => {
    const event = normalizeMarketEvent({
      eventType: "lawsuit",
      occurredAt: new Date("2026-09-29T10:00:00.000Z"),
      sourceProvider: "demo",
      sourceTitle: "ACME faces lawsuit",
      confidence: 2,
    });

    expect(event.confidence).toBe(1);
  });
});
