"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_PORTFOLIO_CURRENCIES } from "@/lib/portfolio/currencies";

type ManualPriceAsset = {
  assetId: string;
  symbol: string;
  name: string;
  assetCurrency: string;
  latestPrice: {
    price: number;
    currency: string;
    observedAt: Date;
  } | null;
};

export function ManualPriceFormModal({
  asset,
  action,
  isOpen: controlledIsOpen,
  onOpenChange,
  showTrigger = true,
  triggerLabel = "Update price",
}: {
  asset: ManualPriceAsset;
  action: (formData: FormData) => Promise<void>;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  showTrigger?: boolean;
  triggerLabel?: string;
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);

    try {
      await action(formData);
      form.reset();
      setFormKey((current) => current + 1);
      setOpen(false);
      setToast({
        message: "Price snapshot saved.",
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
          className="h-9 w-full rounded px-3 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          onClick={() => setOpen(true)}
          type="button"
        >
          {triggerLabel}
        </button>
      ) : null}

      {toast && <Toast message={toast.message} type={toast.type} />}

      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 px-4 py-6">
          <div className="w-full max-w-md rounded border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold">Update price</h2>
                <p className="mt-1 truncate text-sm text-zinc-500">
                  {asset.symbol} - {asset.name}
                </p>
              </div>
              <button
                className="rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
                onClick={() => setOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>
            <form
              className="grid gap-4 px-5 py-5"
              key={formKey}
              onSubmit={handleSubmit}
            >
              <input name="assetId" type="hidden" value={asset.assetId} />
              <Field label="Price">
                <input
                  className={inputClassName}
                  defaultValue={asset.latestPrice?.price ?? ""}
                  min="0.00000001"
                  name="price"
                  required
                  step="0.00000001"
                  type="number"
                />
              </Field>
              <Field label="Currency">
                <select
                  className={inputClassName}
                  defaultValue={
                    asset.latestPrice?.currency ?? asset.assetCurrency
                  }
                  name="currency"
                  required
                >
                  {SUPPORTED_PORTFOLIO_CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Observed at">
                <input
                  className={inputClassName}
                  defaultValue={formatDateTimeLocal(
                    asset.latestPrice?.observedAt ?? new Date(),
                  )}
                  name="observedAt"
                  required
                  type="datetime-local"
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="h-9 rounded bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Saving..." : "Save price"}
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
    <label className="grid gap-1 text-sm font-medium text-zinc-700">
      {label}
      {children}
    </label>
  );
}

function Toast({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) {
  return (
    <div
      className={`fixed bottom-5 right-5 z-[80] max-w-sm rounded border px-4 py-3 text-sm shadow-lg ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      {message}
    </div>
  );
}

function formatDateTimeLocal(date: Date): string {
  const normalizedDate = date instanceof Date ? date : new Date(date);
  const timezoneOffsetMs = normalizedDate.getTimezoneOffset() * 60 * 1000;

  return new Date(normalizedDate.getTime() - timezoneOffsetMs)
    .toISOString()
    .slice(0, 16);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to save price.";
}

const inputClassName =
  "h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-950";
