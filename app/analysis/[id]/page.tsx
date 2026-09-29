import Link from "next/link";
import { notFound } from "next/navigation";
import { restartAnalysis } from "@/app/analysis/actions";
import { AnalysisAutoRefresh } from "@/components/analysis/analysis-auto-refresh";
import { RefreshAnalysisForm } from "@/components/analysis/analysis-action-button";
import { HomeIcon, InfoIcon as InfoSvgIcon } from "@/components/ui/icons";
import { ToastViewport } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { getAnalysisRunDetail } from "@/lib/analysis/repository";
import type { AnalysisInputSnapshot } from "@/lib/analysis/types";

export const dynamic = "force-dynamic";

export default async function AnalysisDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ analysisToast?: string }>;
}) {
  const { id } = await params;
  const { analysisToast } = await searchParams;
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
            <RefreshAnalysisForm
              action={restartAnalysis}
              agentRunId={run.id}
              disabled={isActiveStatus(run.status)}
              size="header"
              symbol={run.asset.symbol}
            />
            <Link
              className="inline-flex h-10 items-center rounded border border-zinc-950 bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              href="/analysis"
            >
              History
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
          <Metric
            description="The selected analysis mode captured at run creation."
            label="Intent"
            value={formatEnum(run.requestedIntent)}
          />
          <Metric
            description="Successful model calls over total attempted model calls."
            label="AI calls"
            value={`${successfulCalls.length}/${run.usageRecords.length}`}
          />
          <Metric
            description="Total recorded model latency across all usage records."
            label="Latency"
            value={`${Math.round(totalLatencyMs / 1000)}s`}
          />
          <Metric
            description="Recorded model cost when provider usage metadata is available."
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
              <ReportList
                description="Core investment thesis generated by Portfolio Manager."
                title="Thesis"
                values={jsonStringArray(run.report.thesis)}
              />
              <ReportList
                description="Positive scenarios and potential upside drivers."
                title="Opportunities"
                values={jsonStringArray(run.report.opportunities)}
              />
              <ReportList
                description="Downside risks, uncertainty, and data limitations."
                title="Risks"
                values={jsonStringArray(run.report.risks)}
              />
            </div>

            <div className="rounded border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500">
                Portfolio fit
                <InfoIcon description="How the final recommendation fits the current portfolio or watchlist context." />
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
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    {summary.agentRole}
                    <InfoIcon description="A compact persisted summary from this analysis agent." />
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    <TierBadge tier={summary.modelTier} /> ·{" "}
                    {summary.model ?? "unknown model"} ·{" "}
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
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500">
              Missing data warnings
              <InfoIcon description="Data gaps captured in the immutable input snapshot before agents ran." />
            </h2>
            <ul className="mt-3 grid gap-2 text-sm text-zinc-700">
              {snapshot.missingDataWarnings.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          </div>
          <div className="rounded border border-zinc-200 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500">
              Model usage
              <InfoIcon description="Model, tier, status, and latency records for every AI call in this run." />
            </h2>
            <div className="mt-3 grid gap-2 text-sm text-zinc-700">
              {run.usageRecords.map((record) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2"
                  key={record.id}
                >
                  <span>{record.agent}</span>
                  <span className="text-xs text-zinc-500">
                    {record.status} · <TierBadge tier={record.modelTier} /> ·{" "}
                    {record.model} ·{" "}
                    {record.latencyMs ?? 0}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <AnalysisAutoRefresh enabled={isActiveStatus(run.status)} />
        <ToastViewport
          initialToast={getAnalysisCompletionToast({
            status: analysisToast,
            symbol: run.asset.symbol,
          })}
        />
      </div>
    </main>
  );
}

function getAnalysisCompletionToast(input: {
  status: string | undefined;
  symbol: string;
}) {
  if (input.status === "success") {
    return {
      message: `AI analysis for ${input.symbol} completed successfully.`,
      variant: "success" as const,
    };
  }

  if (input.status === "error") {
    return {
      message: `AI analysis for ${input.symbol} finished with problems.`,
      variant: "error" as const,
    };
  }

  return null;
}

function Metric({
  description,
  label,
  value,
}: {
  description: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
        {label}
        <InfoIcon description={description} />
      </p>
      <p className="mt-2 text-xl font-semibold capitalize">{value}</p>
    </div>
  );
}

function ReportList({
  description,
  title,
  values,
}: {
  description: string;
  title: string;
  values: string[];
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500">
        {title}
        <InfoIcon description={description} />
      </h3>
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

function TierBadge({ tier }: { tier: string }) {
  const className =
    tier === "cheap"
      ? "border-red-200 bg-red-50 text-red-700"
      : tier === "standard"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tier === "strong"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-zinc-200 bg-zinc-50 text-zinc-600";

  return (
    <span
      className={`inline-flex rounded border px-1.5 py-0.5 text-[11px] font-medium uppercase ${className}`}
    >
      {tier}
    </span>
  );
}

function InfoIcon({ description }: { description: string }) {
  return (
    <Tooltip label={description}>
      <span className="inline-grid size-5 place-items-center text-sky-600">
        <InfoSvgIcon className="size-4" />
      </span>
    </Tooltip>
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

function isActiveStatus(status: string): boolean {
  return status === "PENDING" || status === "RUNNING";
}
