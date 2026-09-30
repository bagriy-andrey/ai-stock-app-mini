"use client";

import { useState } from "react";
import { AssetSearchFields } from "@/components/portfolio/asset-search-fields";
import type { DiscoveryUniverseSummary } from "@/lib/scanners/repository";

type Action = (formData: FormData) => Promise<void>;

export function DiscoveryUniverseManager({
  universes,
  createUniverseAction,
  toggleUniverseAction,
  deleteUniverseAction,
  addAssetAction,
  removeAssetAction,
}: {
  universes: DiscoveryUniverseSummary[];
  createUniverseAction: Action;
  toggleUniverseAction: Action;
  deleteUniverseAction: Action;
  addAssetAction: Action;
  removeAssetAction: Action;
}) {
  const [selectedUniverseId, setSelectedUniverseId] = useState(
    universes[0]?.id ?? "",
  );
  const selectedUniverse =
    universes.find((universe) => universe.id === selectedUniverseId) ??
    universes[0] ??
    null;

  return (
    <section className="grid gap-4 rounded border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-base font-semibold">Discovery universes</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Scoped candidate lists for opportunity and provider-backed scans.
          </p>
        </div>
        <form action={createUniverseAction} className="grid gap-2 md:w-80">
          <input
            className={inputClassName}
            maxLength={80}
            name="name"
            placeholder="Universe name"
            required
          />
          <input
            className={inputClassName}
            maxLength={160}
            name="description"
            placeholder="Description"
          />
          <button
            className="h-9 rounded bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800"
            type="submit"
          >
            Create universe
          </button>
        </form>
      </div>

      {universes.length === 0 ? (
        <div className="rounded border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-600">
          No discovery universes yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="grid content-start gap-2">
            {universes.map((universe) => (
              <button
                className={`rounded border px-3 py-2 text-left text-sm ${
                  selectedUniverse?.id === universe.id
                    ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
                key={universe.id}
                onClick={() => setSelectedUniverseId(universe.id)}
                type="button"
              >
                <span className="block font-medium">{universe.name}</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  {universe.assetCount} assets ·{" "}
                  {universe.isActive ? "active" : "inactive"}
                </span>
              </button>
            ))}
          </div>

          {selectedUniverse ? (
            <div className="grid gap-4">
              <div className="flex flex-col gap-2 border-b border-zinc-200 pb-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">
                    {selectedUniverse.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    {selectedUniverse.description ?? "No description"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={toggleUniverseAction}>
                    <input
                      name="universeId"
                      type="hidden"
                      value={selectedUniverse.id}
                    />
                    <input
                      name="isActive"
                      type="hidden"
                      value={String(!selectedUniverse.isActive)}
                    />
                    <button
                      className="h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                      type="submit"
                    >
                      {selectedUniverse.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                  <form action={deleteUniverseAction}>
                    <input
                      name="universeId"
                      type="hidden"
                      value={selectedUniverse.id}
                    />
                    <button
                      className="h-9 rounded border border-red-300 px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                      type="submit"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>

              <form action={addAssetAction} className="grid gap-3 rounded border border-zinc-200 bg-zinc-50 p-3">
                <input
                  name="universeId"
                  type="hidden"
                  value={selectedUniverse.id}
                />
                <AssetSearchFields
                  allowManualExchange
                  defaultAssetCurrency="USD"
                  defaultAssetType="STOCK"
                  isExchangeRequired={false}
                />
                <div className="grid gap-3 md:grid-cols-[160px_1fr_auto]">
                  <label className="grid gap-1 text-xs font-medium text-zinc-500">
                    Priority
                    <input
                      className={inputClassName}
                      defaultValue={50}
                      max={100}
                      min={1}
                      name="priority"
                      required
                      type="number"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-zinc-500">
                    Notes
                    <input className={inputClassName} name="notes" />
                  </label>
                  <button
                    className="self-end rounded bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                    type="submit"
                  >
                    Add asset
                  </button>
                </div>
              </form>

              {selectedUniverse.assets.length === 0 ? (
                <div className="rounded border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-600">
                  No assets in this universe.
                </div>
              ) : (
                <div className="overflow-hidden rounded border border-zinc-200">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                      <tr>
                        <th className="px-3 py-2">Asset</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Provider</th>
                        <th className="px-3 py-2">Priority</th>
                        <th className="px-3 py-2">Notes</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {selectedUniverse.assets.map((asset) => (
                        <tr key={asset.universeAssetId}>
                          <td className="px-3 py-2">
                            <span className="font-medium">{asset.symbol}</span>
                            <span className="block text-xs text-zinc-500">
                              {asset.name}
                            </span>
                          </td>
                          <td className="px-3 py-2">{asset.assetType}</td>
                          <td className="px-3 py-2">
                            {asset.provider}:{asset.providerSymbol}
                          </td>
                          <td className="px-3 py-2">{asset.priority}</td>
                          <td className="px-3 py-2">{asset.notes ?? "N/A"}</td>
                          <td className="px-3 py-2 text-right">
                            <form action={removeAssetAction}>
                              <input
                                name="universeAssetId"
                                type="hidden"
                                value={asset.universeAssetId}
                              />
                              <button
                                className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                                type="submit"
                              >
                                Remove
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

const inputClassName =
  "h-9 rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-950 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";
