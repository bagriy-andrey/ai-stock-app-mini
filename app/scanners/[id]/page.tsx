import Link from "next/link";
import { notFound } from "next/navigation";
import { addOpportunitySignalToWatchlist } from "@/app/scanners/actions";
import { HomeIcon } from "@/components/ui/icons";
import { Tooltip } from "@/components/ui/tooltip";
import { getScannerRunDetail } from "@/lib/scanners/repository";

export const dynamic = "force-dynamic";

export default async function ScannerRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await getScannerRunDetail(id);

  if (!run) {
    notFound();
  }

  const warnings = extractWarnings(run.inputScope);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link className="text-sm font-medium text-zinc-500" href="/scanners">
              Scanners
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">
              {formatEnum(run.scannerType)} run
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              {run.configurationVersion} · {formatDateTime(run.createdAt)} ·
              advisory-only scanner output
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              className="inline-flex h-10 items-center rounded border border-zinc-950 bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              href="/scanners"
            >
              All scanner runs
            </Link>
            <Tooltip label="Home">
              <Link
                aria-label="Home"
                className="grid h-10 w-10 place-items-center rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                href="/"
              >
                <HomeIcon className="size-4" />
              </Link>
            </Tooltip>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <SummaryMetric label="Status" value={run.status} />
          <SummaryMetric label="Signals" value={String(run.signalCount)} />
          <SummaryMetric label="Candidates" value={String(run.candidateCount)} />
          <SummaryMetric
            label="Completed"
            value={run.completedAt ? formatDateTime(run.completedAt) : "N/A"}
          />
        </section>

        {run.errorMessage ? (
          <section className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {run.errorMessage}
          </section>
        ) : null}

        {warnings.length > 0 ? (
          <section className="rounded border border-amber-300 bg-amber-50 p-4">
            <h2 className="text-sm font-semibold uppercase text-amber-900">
              Missing data warnings
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase text-zinc-500">
            Input scope
          </h2>
          <pre className="mt-3 max-h-72 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
            {JSON.stringify(run.inputScope, null, 2)}
          </pre>
        </section>

        {run.signals.length === 0 ? (
          <section className="rounded border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
            <p className="text-sm font-medium text-zinc-700">
              No scanner signals emitted
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              The run completed without material deterministic findings.
            </p>
          </section>
        ) : (
          <section className="grid gap-3">
            {run.signals.map((signal) => (
              <article
                className="rounded border border-zinc-200 bg-white p-4"
                key={signal.id}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">
                        {signal.title}
                      </h2>
                      <Badge label={signal.severity} tone={severityTone(signal.severity)} />
                      <Badge label={signal.suggestedAction} tone="zinc" />
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">
                      {signal.symbol ? `${signal.symbol} · ` : ""}
                      {formatEnum(signal.signalType)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-zinc-700">
                      {signal.summary}
                    </p>
                  </div>
                  <div className="grid min-w-36 grid-cols-2 gap-2 text-right text-sm">
                    <div>
                      <p className="text-xs uppercase text-zinc-500">Score</p>
                      <p className="font-semibold">{signal.score.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-zinc-500">
                        Confidence
                      </p>
                      <p className="font-semibold">
                        {(signal.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <JsonList title="Reasons" value={signal.reasons} />
                  <JsonList title="Risks" value={signal.risks} />
                </div>

                {signal.suggestedAction === "ADD_TO_WATCHLIST" ? (
                  <form action={addOpportunitySignalToWatchlist} className="mt-4">
                    <input
                      name="scannerSignalId"
                      type="hidden"
                      value={signal.id}
                    />
                    <button
                      className="rounded border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                      type="submit"
                    >
                      Add to watchlist
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-4">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: string }) {
  const className =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "emerald"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-zinc-200 bg-zinc-50 text-zinc-600";

  return (
    <span
      className={`inline-flex rounded border px-2 py-1 text-xs font-medium uppercase ${className}`}
    >
      {label}
    </span>
  );
}

function JsonList({ title, value }: { title: string; value: unknown }) {
  const items = Array.isArray(value) ? value : [value];

  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
      <h3 className="text-xs font-semibold uppercase text-zinc-500">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm text-zinc-700">
        {items.map((item, index) => (
          <li key={index}>
            {typeof item === "string" ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function severityTone(severity: string): string {
  if (severity === "CRITICAL" || severity === "HIGH") {
    return "red";
  }

  if (severity === "MEDIUM") {
    return "amber";
  }

  return "emerald";
}

function extractWarnings(inputScope: unknown): string[] {
  if (
    typeof inputScope === "object" &&
    inputScope &&
    "warnings" in inputScope &&
    Array.isArray(inputScope.warnings)
  ) {
    return inputScope.warnings.filter(
      (warning): warning is string => typeof warning === "string",
    );
  }

  return [];
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatEnum(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}
