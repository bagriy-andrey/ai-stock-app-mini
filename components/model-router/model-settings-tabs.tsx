"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  SearchableModelSelect,
  type SearchableModelOption,
} from "@/components/model-router/searchable-model-select";

type ModelSettingsTab = "tiers" | "catalog";

type ModelTierSettingView = {
  tier: string;
  selectedModel: string;
  envModel: string | null;
};

export type ModelCatalogRow = SearchableModelOption & {
  promptPricePerMillionLabel: string;
  completionPricePerMillionLabel: string;
};

const tabs: Array<{ id: ModelSettingsTab; label: string }> = [
  { id: "tiers", label: "Model selection" },
  { id: "catalog", label: "All models" },
];
const activeTabStorageKey = "modelSettings.activeTab";
const catalogSearchStorageKey = "modelSettings.catalogSearch";

function isModelSettingsTab(value: string | null): value is ModelSettingsTab {
  return tabs.some((tab) => tab.id === value);
}

function useStoredValue(
  storageKey: string,
  fallbackValue: string,
  validate: (value: string | null) => string,
): [string | null, (value: string) => void] {
  const changeEventName = `${storageKey}:change`;
  const value = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(changeEventName, onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(changeEventName, onStoreChange);
      };
    },
    () => validate(window.localStorage.getItem(storageKey)) || fallbackValue,
    () => null,
  );

  function setValue(nextValue: string) {
    window.localStorage.setItem(storageKey, nextValue);
    window.dispatchEvent(new Event(changeEventName));
  }

  return [value, setValue];
}

export function ModelSettingsTabs({
  modelOptions,
  models,
  settings,
  updateModelTierAction,
}: {
  modelOptions: SearchableModelOption[];
  models: ModelCatalogRow[];
  settings: ModelTierSettingView[];
  updateModelTierAction: (formData: FormData) => Promise<void>;
}) {
  const [activeTabValue, selectActiveTab] = useStoredValue(
    activeTabStorageKey,
    "tiers",
    (value) => (isModelSettingsTab(value) ? value : "tiers"),
  );
  const [catalogSearchValue, setCatalogSearch] = useStoredValue(
    catalogSearchStorageKey,
    "",
    (value) => value ?? "",
  );
  const activeTab = isModelSettingsTab(activeTabValue)
    ? activeTabValue
    : null;
  const catalogSearch = catalogSearchValue ?? "";
  const normalizedSearch = catalogSearch.trim().toLowerCase();
  const filteredModels = useMemo(() => {
    if (!normalizedSearch) {
      return models;
    }

    return models.filter((model) =>
      model.name.toLowerCase().includes(normalizedSearch),
    );
  }, [models, normalizedSearch]);

  if (activeTab === null) {
    return (
      <section className="grid gap-4" aria-label="Loading model settings tabs">
        <div className="h-12 animate-pulse rounded border border-zinc-200 bg-white" />
        <div className="h-64 animate-pulse rounded border border-zinc-200 bg-white" />
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap gap-2 border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            className={`border-b-2 px-4 py-3 text-sm font-medium ${
              activeTab === tab.id
                ? "border-zinc-950 text-zinc-950"
                : "border-transparent text-zinc-500 hover:text-zinc-950"
            }`}
            key={tab.id}
            onClick={() => selectActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "tiers" ? (
        <section className="grid gap-4 lg:grid-cols-3">
          {settings.map((setting) => {
            const selectedModel = setting.selectedModel;

            return (
              <form
                action={updateModelTierAction}
                className="grid gap-4 rounded border border-zinc-200 bg-white p-4"
                key={setting.tier}
              >
                <input name="tier" type="hidden" value={setting.tier} />
                <div>
                  <h2 className="text-sm font-semibold uppercase text-zinc-500">
                    {setting.tier}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Current: {selectedModel || "Not configured"}
                  </p>
                  {setting.envModel && setting.envModel !== selectedModel ? (
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Env fallback: {setting.envModel}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2 text-sm font-medium text-zinc-700">
                  <span>OpenRouter model</span>
                  <SearchableModelSelect
                    disabled={models.length === 0}
                    initialModelId={selectedModel}
                    models={modelOptions}
                    name="modelId"
                  />
                </div>

                <button
                  className="h-10 rounded border border-emerald-700 bg-emerald-700 px-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500"
                  disabled={models.length === 0 && !selectedModel}
                  type="submit"
                >
                  Save model
                </button>
              </form>
            );
          })}
        </section>
      ) : null}

      {activeTab === "catalog" ? (
        <section className="rounded border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase text-zinc-500">
                Catalog
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {filteredModels.length} of {models.length} text models loaded
                from OpenRouter.
              </p>
            </div>
            <label className="grid gap-1 text-sm font-medium text-zinc-700 sm:w-80">
              <span>Search by model name</span>
              <input
                aria-label="Search models by name"
                className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-950"
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Type model name"
                type="search"
                value={catalogSearch}
              />
            </label>
          </div>

          <div className="mt-4 max-h-[620px] overflow-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="sticky top-0 border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Model</th>
                  <th className="px-3 py-2 font-semibold">ID</th>
                  <th className="px-3 py-2 font-semibold">Prompt / 1M</th>
                  <th className="px-3 py-2 font-semibold">Output / 1M</th>
                  <th className="px-3 py-2 font-semibold">Est. call</th>
                  <th className="px-3 py-2 font-semibold">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredModels.map((model) => (
                  <tr key={model.id}>
                    <td className="px-3 py-2 font-medium text-zinc-950">
                      {model.name}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">
                      {model.id}
                    </td>
                    <td className="px-3 py-2">
                      {model.promptPricePerMillionLabel}
                    </td>
                    <td className="px-3 py-2">
                      {model.completionPricePerMillionLabel}
                    </td>
                    <td className="px-3 py-2">
                      {model.estimatedCallCostLabel}
                    </td>
                    <td className="px-3 py-2">
                      {model.contextLength
                        ? model.contextLength.toLocaleString("en-US")
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredModels.length === 0 ? (
            <p className="mt-3 rounded border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500">
              No models match this name.
            </p>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
