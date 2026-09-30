"use client";

import { useState } from "react";
import type { ScannerType } from "@prisma/client";
import type { DiscoveryUniverseSummary } from "@/lib/scanners/repository";

type ScannerButton = {
  type: ScannerType;
  label: string;
};

export function ScannerRunCard({
  scanner,
  universes,
  action,
}: {
  scanner: ScannerButton;
  universes: DiscoveryUniverseSummary[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [showControls, setShowControls] = useState(false);
  const supportsUniverse =
    scanner.type === "OPPORTUNITY" ||
    scanner.type === "CRYPTO" ||
    scanner.type === "NEWS_EVENT";
  const supportsHighPriority =
    scanner.type === "WATCHLIST" || scanner.type === "OPPORTUNITY";

  return (
    <form action={action} className="rounded border border-zinc-200 bg-white p-4">
      <input name="scannerType" type="hidden" value={scanner.type} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            {scanner.label} scanner
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Manual scoped run
          </p>
        </div>
        <button
          className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
          onClick={() => setShowControls((value) => !value)}
          type="button"
        >
          Controls
        </button>
      </div>

      {showControls ? (
        <div className="mt-3 grid gap-2 border-t border-zinc-200 pt-3">
          {supportsUniverse ? (
            <label className="grid gap-1 text-xs font-medium text-zinc-500">
              Universe
              <select
                className="h-9 rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-950"
                name="universeId"
              >
                <option value="">All active universes</option>
                {universes
                  .filter((universe) => universe.isActive)
                  .map((universe) => (
                    <option key={universe.id} value={universe.id}>
                      {universe.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
            <input className="size-4" name="staleDataOnly" type="checkbox" />
            Stale or missing price only
          </label>
          {supportsHighPriority ? (
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
              <input className="size-4" name="highPriorityOnly" type="checkbox" />
              High priority only
            </label>
          ) : null}
          <label className="grid gap-1 text-xs font-medium text-zinc-500">
            Max assets
            <input
              className="h-9 rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-950"
              min="1"
              name="maxAssets"
              placeholder="No limit"
              type="number"
            />
          </label>
        </div>
      ) : null}

      <button
        className="mt-3 w-full rounded border border-emerald-700 bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        type="submit"
      >
        Run manually
      </button>
    </form>
  );
}
