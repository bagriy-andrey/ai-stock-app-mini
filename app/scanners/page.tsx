import Link from "next/link";
import {
  addDiscoveryUniverseAsset,
  createDiscoveryUniverse,
  deleteDiscoveryUniverse,
  removeDiscoveryUniverseAsset,
  runScannerAction,
  toggleDiscoveryUniverse,
} from "@/app/scanners/actions";
import { DiscoveryUniverseManager } from "@/components/scanners/discovery-universe-manager";
import { ScannerRunCard } from "@/components/scanners/scanner-run-card";
import { HomeIcon } from "@/components/ui/icons";
import { Tooltip } from "@/components/ui/tooltip";
import {
  getDiscoveryUniverseDashboard,
  getScannerDashboard,
} from "@/lib/scanners/repository";

export const dynamic = "force-dynamic";

const scannerButtons = [
  { type: "PORTFOLIO", label: "Portfolio" },
  { type: "WATCHLIST", label: "Watchlist" },
  { type: "OPPORTUNITY", label: "Opportunity" },
  { type: "CRYPTO", label: "Crypto" },
  { type: "NEWS_EVENT", label: "News/Event" },
] as const;

export default async function ScannersPage() {
  let runs: Awaited<ReturnType<typeof getScannerDashboard>>;
  let universes: Awaited<ReturnType<typeof getDiscoveryUniverseDashboard>>;

  try {
    [runs, universes] = await Promise.all([
      getScannerDashboard(),
      getDiscoveryUniverseDashboard(),
    ]);
  } catch (error) {
    return <ScannerSetupState error={error} />;
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link className="text-sm font-medium text-zinc-500" href="/">
              AI Investment Assistant
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Scanners</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Cheap deterministic triage for portfolio, watchlist,
              opportunities, and structured event readiness. Advisory-only.
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

        <section className="grid gap-3 md:grid-cols-5">
          {scannerButtons.map((scanner) => (
            <ScannerRunCard
              action={runScannerAction}
              key={scanner.type}
              scanner={scanner}
              universes={universes}
            />
          ))}
        </section>

        <DiscoveryUniverseManager
          addAssetAction={addDiscoveryUniverseAsset}
          createUniverseAction={createDiscoveryUniverse}
          deleteUniverseAction={deleteDiscoveryUniverse}
          removeAssetAction={removeDiscoveryUniverseAsset}
          toggleUniverseAction={toggleDiscoveryUniverse}
          universes={universes}
        />

        {runs.length === 0 ? (
          <section className="rounded border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
            <p className="text-sm font-medium text-zinc-700">
              No scanner runs yet
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Run a scanner manually to persist ranked signals.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded border border-zinc-200 bg-white">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Scanner</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Signals</th>
                  <th className="px-4 py-3 font-semibold">Candidates</th>
                  <th className="px-4 py-3 font-semibold">Started</th>
                  <th className="px-4 py-3 font-semibold">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {runs.map((run) => (
                  <tr className="hover:bg-zinc-50" key={run.id}>
                    <td className="p-0">
                      <Link
                        className="block px-4 py-3 font-medium text-zinc-950"
                        href={`/scanners/${run.id}`}
                      >
                        {formatEnum(run.scannerType)}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link className="block px-4 py-3" href={`/scanners/${run.id}`}>
                        <StatusBadge status={run.status} />
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link className="block px-4 py-3" href={`/scanners/${run.id}`}>
                        {run.signalCount}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link className="block px-4 py-3" href={`/scanners/${run.id}`}>
                        {run.candidateCount}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link className="block px-4 py-3" href={`/scanners/${run.id}`}>
                        {run.startedAt ? formatDateTime(run.startedAt) : "N/A"}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link className="block px-4 py-3" href={`/scanners/${run.id}`}>
                        {run.completedAt ? formatDateTime(run.completedAt) : "N/A"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "SUCCEEDED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "FAILED"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "PARTIAL"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-zinc-200 bg-zinc-50 text-zinc-600";

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-1 text-xs font-medium uppercase ${className}`}
    >
      {status}
    </span>
  );
}

function ScannerSetupState({ error }: { error: unknown }) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-5 py-6">
        <header className="border-b border-zinc-200 pb-5">
          <Link className="text-sm font-medium text-zinc-500" href="/">
            AI Investment Assistant
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Scanner setup</h1>
        </header>
        <section className="rounded border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold uppercase text-amber-900">
            Database unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Apply the Phase 3 migration and regenerate Prisma client before
            using scanners.
          </p>
          <pre className="mt-3 max-h-96 overflow-auto rounded border border-amber-200 bg-white p-3 text-xs text-zinc-700">
            {getErrorMessage(error)}
          </pre>
        </section>
      </div>
    </main>
  );
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown database error";
}
