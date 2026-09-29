import Link from "next/link";
import { updateModelTier } from "@/app/settings/models/actions";
import {
  SearchableModelSelect,
  type SearchableModelOption,
} from "@/components/model-router/searchable-model-select";
import {
  estimatedModelCallTokens,
  estimateModelCallCost,
  formatPricePerMillionTokens,
  formatUsd,
} from "@/lib/model-router/pricing";
import { HomeIcon } from "@/components/ui/icons";
import { Tooltip } from "@/components/ui/tooltip";
import {
  getModelTierSettings,
  listOpenRouterModels,
  modelTiers,
} from "@/lib/model-router/settings";

export const dynamic = "force-dynamic";

export default async function ModelSettingsPage() {
  let models: Awaited<ReturnType<typeof listOpenRouterModels>> = [];
  let settings: Awaited<ReturnType<typeof getModelTierSettings>> = [];
  let errorMessage: string | null = null;

  try {
    [models, settings] = await Promise.all([
      listOpenRouterModels(),
      getModelTierSettings(),
    ]);
  } catch (error) {
    settings = await getModelTierSettings().catch(() => []);
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }
  const modelOptions: SearchableModelOption[] = models.map((model) => ({
    id: model.id,
    name: model.name,
    contextLength: model.context_length ?? null,
    estimatedCallCostLabel: formatUsd(estimateModelCallCost(model)),
    promptPricePerMillionLabel: formatPricePerMillionTokens(
      model.pricing?.prompt,
    ),
    completionPricePerMillionLabel: formatPricePerMillionTokens(
      model.pricing?.completion,
    ),
  }));

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link className="text-sm font-medium text-zinc-500" href="/">
              AI Investment Assistant
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Model settings</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-600">
              Choose OpenRouter models for logical tiers used by Deep Analysis.
              Cost per call is an estimate for {estimatedModelCallTokens.input}{" "}
              input tokens and {estimatedModelCallTokens.output} output tokens.
            </p>
          </div>
          <Tooltip label="Home">
            <Link
              aria-label="Home"
              className="grid size-9 place-items-center rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
              href="/"
            >
              <HomeIcon className="size-4" />
            </Link>
          </Tooltip>
        </header>

        {errorMessage ? (
          <section className="rounded border border-amber-300 bg-amber-50 p-4">
            <h2 className="text-sm font-semibold uppercase text-amber-900">
              OpenRouter catalog unavailable
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              {errorMessage}. Check `OPENROUTER_API_KEY` and network access.
            </p>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-3">
          {modelTiers.map((tier) => {
            const setting = settings.find((item) => item.tier === tier);
            const selectedModel = setting?.selectedModel ?? "";

            return (
              <form
                action={updateModelTier}
                className="grid gap-4 rounded border border-zinc-200 bg-white p-4"
                key={tier}
              >
                <input name="tier" type="hidden" value={tier} />
                <div>
                  <h2 className="text-sm font-semibold uppercase text-zinc-500">
                    {tier}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Current: {selectedModel || "Not configured"}
                  </p>
                  {setting?.envModel && setting.envModel !== selectedModel ? (
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

        <section className="rounded border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase text-zinc-500">
            Catalog
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {models.length} text models loaded from OpenRouter.
          </p>
          <div className="mt-4 max-h-[520px] overflow-auto">
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
                {models.slice(0, 200).map((model) => (
                  <tr key={model.id}>
                    <td className="px-3 py-2 font-medium text-zinc-950">
                      {model.name}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">
                      {model.id}
                    </td>
                    <td className="px-3 py-2">
                      {formatPricePerMillionTokens(model.pricing?.prompt)}
                    </td>
                    <td className="px-3 py-2">
                      {formatPricePerMillionTokens(model.pricing?.completion)}
                    </td>
                    <td className="px-3 py-2">
                      {formatUsd(estimateModelCallCost(model))}
                    </td>
                    <td className="px-3 py-2">
                      {model.context_length
                        ? model.context_length.toLocaleString("en-US")
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {models.length > 200 ? (
            <p className="mt-3 text-xs text-zinc-500">
              Showing first 200 models. Use the tier dropdowns to access the
              full loaded list.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
