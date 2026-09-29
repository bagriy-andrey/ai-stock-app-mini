"use client";

import { useMemo, useRef, useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";

export type SearchableModelOption = {
  id: string;
  name: string;
  contextLength: number | null;
  estimatedCallCostLabel: string;
  promptPricePerMillionLabel: string;
  completionPricePerMillionLabel: string;
};

export function SearchableModelSelect({
  disabled = false,
  initialModelId,
  models,
  name,
}: {
  disabled?: boolean;
  initialModelId: string;
  models: SearchableModelOption[];
  name: string;
}) {
  const [selectedModelId, setSelectedModelId] = useState(initialModelId);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedModel =
    models.find((model) => model.id === selectedModelId) ?? null;
  const visibleModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return models.slice(0, 80);
    }

    return models
      .filter((model) =>
        [model.name, model.id]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 80);
  }, [models, query]);

  function selectModel(model: SearchableModelOption) {
    setSelectedModelId(model.id);
    setQuery("");
    setIsOpen(false);
  }

  function clearSelection() {
    setSelectedModelId("");
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
      ref={containerRef}
    >
      <input name={name} type="hidden" value={selectedModelId} />
      <div className="grid gap-2">
        <div className="flex min-h-10 min-w-0 items-center gap-2 rounded border border-zinc-300 bg-white px-2 focus-within:border-emerald-700 focus-within:ring-1 focus-within:ring-emerald-700">
          <input
            aria-label="Search OpenRouter models"
            className="h-9 min-w-0 flex-1 bg-transparent px-1 text-sm text-zinc-950 outline-none placeholder:text-zinc-400"
            disabled={disabled}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={
              selectedModel
                ? `${selectedModel.name} (${selectedModel.id})`
                : "Search model by name or id"
            }
            type="text"
            value={query}
          />
          {selectedModel ? (
            <Tooltip label="Clear selected model">
              <button
                aria-label="Clear selected model"
                className="grid size-7 shrink-0 place-items-center rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                disabled={disabled}
                onClick={clearSelection}
                type="button"
              >
                <CloseIcon />
              </button>
            </Tooltip>
          ) : null}
          <Tooltip disabled={disabled} label="Toggle model list">
            <button
              aria-label="Toggle model list"
              className="grid size-7 shrink-0 place-items-center rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
              onClick={() => setIsOpen((value) => !value)}
              type="button"
            >
              <ChevronDownIcon />
            </button>
          </Tooltip>
        </div>

        {selectedModel ? <SelectedModelSummary model={selectedModel} /> : null}
      </div>

      {isOpen && !disabled ? (
        <div className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded border border-zinc-200 bg-white shadow-lg">
          {visibleModels.length === 0 ? (
            <p className="px-3 py-3 text-sm text-zinc-500">No models found.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {visibleModels.map((model) => (
                <button
                  className={`grid w-full min-w-0 gap-1 px-3 py-3 text-left text-sm hover:bg-zinc-50 ${
                    model.id === selectedModelId ? "bg-emerald-50" : "bg-white"
                  }`}
                  key={model.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectModel(model)}
                  type="button"
                >
                  <span className="truncate font-medium text-zinc-950">
                    {model.name}
                  </span>
                  <span className="truncate text-xs text-zinc-500">
                    {model.id}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {model.estimatedCallCostLabel}/call · Prompt{" "}
                    {model.promptPricePerMillionLabel}/1M · Output{" "}
                    {model.completionPricePerMillionLabel}/1M
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SelectedModelSummary({ model }: { model: SearchableModelOption }) {
  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
      <p className="truncate font-medium text-zinc-950">{model.name}</p>
      <p className="mt-1 truncate text-xs text-zinc-500">{model.id}</p>
      <div className="mt-2 grid gap-1 text-xs">
        <p>Estimated call: {model.estimatedCallCostLabel}</p>
        <p>Prompt: {model.promptPricePerMillionLabel} / 1M</p>
        <p>Output: {model.completionPricePerMillionLabel} / 1M</p>
        <p>
          Context:{" "}
          {model.contextLength
            ? model.contextLength.toLocaleString("en-US")
            : "N/A"}
        </p>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
