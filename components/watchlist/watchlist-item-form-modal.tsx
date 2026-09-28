"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AssetType,
  InvestmentIntent,
  WatchlistPriority,
} from "@prisma/client";
import { AssetSearchFields } from "@/components/portfolio/asset-search-fields";

type WatchlistItemFormValue = {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  assetCurrency: string;
  exchange: string | null;
  provider: string;
  providerSymbol: string;
  investmentIntent: InvestmentIntent;
  priority: WatchlistPriority;
  targetEntryPrice: number | null;
  notes: string | null;
};

const investmentIntents = ["LONG_TERM", "TACTICAL"] as const;
const priorities = ["LOW", "MEDIUM", "HIGH"] as const;

export function WatchlistItemFormModal({
  mode,
  item,
  action,
  showTrigger = true,
  isOpen: controlledIsOpen,
  onOpenChange,
}: {
  mode: "create" | "edit";
  item?: WatchlistItemFormValue;
  action: (formData: FormData) => Promise<void>;
  showTrigger?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const title = mode === "create" ? "Add watchlist item" : "Edit watchlist item";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);

    try {
      await action(formData);

      if (mode === "create") {
        form.reset();
        setFormKey((current) => current + 1);
      }

      setOpen(false);
      setToast({
        message:
          mode === "create"
            ? "Watchlist item added successfully."
            : "Watchlist item updated successfully.",
        type: "success",
      });
      router.refresh();
      window.setTimeout(() => setToast(null), 3500);
    } catch (error) {
      setToast({
        message: getErrorMessage(error),
        type: "error",
      });
      window.setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  }

  function setOpen(nextIsOpen: boolean) {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(nextIsOpen);
    }

    onOpenChange?.(nextIsOpen);
  }

  return (
    <>
      {showTrigger ? (
        <button
          className={
            mode === "create"
              ? "h-9 rounded bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800"
              : "h-8 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          }
          onClick={() => setOpen(true)}
          type="button"
        >
          {mode === "create" ? "Add Asset" : "Edit"}
        </button>
      ) : null}

      {toast && <Toast message={toast.message} type={toast.type} />}

      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 px-4 py-6">
          <div className="max-h-full w-full max-w-2xl overflow-auto rounded border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="text-base font-semibold">{title}</h2>
              <button
                className="rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
                onClick={() => setOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <form className="grid gap-4 px-5 py-5" key={formKey} onSubmit={handleSubmit}>
              {item ? (
                <input name="watchlistItemId" type="hidden" value={item.id} />
              ) : null}
              <AssetSearchFields
                allowManualExchange
                defaultAssetCurrency={item?.assetCurrency ?? "USD"}
                defaultAssetType={item?.assetType ?? "STOCK"}
                defaultExchange={item?.exchange ?? ""}
                defaultName={item?.name ?? ""}
                defaultProvider={item?.provider ?? "manual"}
                defaultProviderSymbol={item?.providerSymbol ?? ""}
                defaultSymbol={item?.symbol ?? ""}
                isExchangeRequired={false}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Intent">
                  <select
                    className={inputClassName}
                    defaultValue={item?.investmentIntent ?? "LONG_TERM"}
                    name="investmentIntent"
                  >
                    {investmentIntents.map((intent) => (
                      <option key={intent} value={intent}>
                        {formatEnum(intent)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Priority">
                  <select
                    className={inputClassName}
                    defaultValue={item?.priority ?? "MEDIUM"}
                    name="priority"
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {formatEnum(priority)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Target entry">
                  <input
                    className={inputClassName}
                    defaultValue={item?.targetEntryPrice ?? ""}
                    min="0"
                    name="targetEntryPrice"
                    step="any"
                    type="number"
                  />
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  className="min-h-24 w-full rounded border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-950 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  defaultValue={item?.notes ?? ""}
                  name="notes"
                />
              </Field>

              <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
                <button
                  className="h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="h-9 rounded bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-zinc-500">
      {label}
      {children}
    </label>
  );
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed right-4 top-4 z-[80] rounded border px-4 py-3 text-sm shadow-lg ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      {message}
    </div>
  );
}

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to save watchlist item.";
}

const inputClassName =
  "h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-950 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";
