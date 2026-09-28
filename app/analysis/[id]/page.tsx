import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnalysisRunDetail } from "@/lib/analysis/repository";
import type { AnalysisInputSnapshot } from "@/lib/analysis/types";

export const dynamic = "force-dynamic";

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let run: Awaited<ReturnType<typeof getAnalysisRunDetail>>;

  try {
    run = await getAnalysisRunDetail(id);
  } catch {
    notFound();
  }

  const snapshot = run.inputSnapshot as unknown as AnalysisInputSnapshot;
  const totalLatencyMs = run.usageRecords.reduce(
    (total, record) => total + (record.latencyMs ?? 0),
    0,
  );
  const successfulCalls = run.usageRecords.filter(
    (record) => record.status === "SUCCESS",
  );
  const totalCost = run.usageRecords.reduce(
    (total, record) => total + (record.cost?.toNumber() ?? 0),
    0,
  );

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link className="text-sm font-medium text-zinc-500" href="/analysis">
              Deep Analysis
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">
              {run.asset.symbol} analysis
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              {run.asset.name}. Status: {run.status}. Advisory-only report.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              href="/analysis"
            >
              History
            </Link>
            <Link
              className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              href="/"
            >
              Home
            </Link>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <Metric label="Intent" value={formatEnum(run.requestedIntent)} />
          <Metric
            label="AI calls"
            value={`${successfulCalls.length}/${run.usageRecords.length}`}
          />
          <Metric
            label="Latency"
            value={`${Math.round(totalLatencyMs / 1000)}s`}
          />
          <Metric
            label="Cost"
            value={totalCost > 0 ? `$${totalCost.toFixed(4)}` : "N/A"}
          />
        </section>

        {run.errorMessage ? (
          <section className="rounded border border-red-200 bg-red-50 p-4">
            <h2 className="text-sm font-semibold uppercase text-red-800">
              Run error
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-800">
              {run.errorMessage}
            </p>
          </section>
        ) : null}

        {run.report ? (
          <section className="grid gap-4 rounded border border-zinc-200 bg-white p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{run.report.title}</h2>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-700">
                  {run.report.summary}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{run.report.recommendationLabel}</Badge>
                <Badge>{run.report.riskLevel} risk</Badge>
                <Badge>
                  {Math.round(run.report.confidence.toNumber() * 100)}%
                  confidence
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <ReportList title="Thesis" values={jsonStringArray(run.report.thesis)} />
              <ReportList
                title="Opportunities"
                values={jsonStringArray(run.report.opportunities)}
              />
              <ReportList title="Risks" values={jsonStringArray(run.report.risks)} />
            </div>

            <div className="rounded border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold uppercase text-zinc-500">
                Portfolio fit
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                {run.report.portfolioFit}
              </p>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          {run.reasoningSummaries.map((summary) => (
            <div
              className="rounded border border-zinc-200 bg-white p-4"
              key={summary.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{summary.agentRole}</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {summary.modelTier} · {summary.model ?? "unknown model"} ·{" "}
                    {summary.promptVersion}
                  </p>
                </div>
                <Badge>{summary.stance}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-700">
                {summary.summary}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase text-zinc-500">
              Missing data warnings
            </h2>
            <ul className="mt-3 grid gap-2 text-sm text-zinc-700">
              {snapshot.missingDataWarnings.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          </div>
          <div className="rounded border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase text-zinc-500">
              Model usage
            </h2>
            <div className="mt-3 grid gap-2 text-sm text-zinc-700">
              {run.usageRecords.map((record) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2"
                  key={record.id}
                >
                  <span>{record.agent}</span>
                  <span className="text-xs text-zinc-500">
                    {record.status} · {record.modelTier} · {record.model} ·{" "}
                    {record.latencyMs ?? 0}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-4">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold capitalize">{value}</p>
    </div>
  );
}

function ReportList({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase text-zinc-500">{title}</h3>
      <ul className="mt-2 grid gap-2 text-sm leading-6 text-zinc-700">
        {values.length > 0 ? values.map((value) => <li key={value}>- {value}</li>) : <li>N/A</li>}
      </ul>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-fit rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium uppercase text-zinc-600">
      {children}
    </span>
  );
}

function jsonStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function formatEnum(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}
