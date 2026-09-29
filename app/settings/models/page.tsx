import Link from "next/link";
import { updateModelTier } from "@/app/settings/models/actions";
import {
  type SearchableModelOption,
} from "@/components/model-router/searchable-model-select";
import {
  ModelSettingsTabs,
  type ModelCatalogRow,
} from "@/components/model-router/model-settings-tabs";
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
  const modelRows: ModelCatalogRow[] = modelOptions.map((model) => ({
    ...model,
    promptPricePerMillionLabel: model.promptPricePerMillionLabel,
    completionPricePerMillionLabel: model.completionPricePerMillionLabel,
  }));
  const tierSettings = modelTiers.map((tier) => {
    const setting = settings.find((item) => item.tier === tier);

    return {
      tier,
      selectedModel: setting?.selectedModel ?? "",
      envModel: setting?.envModel ?? null,
    };
  });

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

        <ModelSettingsTabs
          modelOptions={modelOptions}
          models={modelRows}
          settings={tierSettings}
          updateModelTierAction={updateModelTier}
        />
      </div>
    </main>
  );
}
