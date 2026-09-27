"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssetType, InvestmentIntent } from "@prisma/client";
import { AssetSearchFields } from "@/components/portfolio/asset-search-fields";

type PositionFormValue = {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  assetCurrency: string;
  exchange: string | null;
  provider: string;
  providerSymbol: string;
  quantity: number;
  averageCost: number;
  costCurrency: string;
  investmentIntent: InvestmentIntent;
  openedAt: Date | null;
  notes: string | null;
};

const investmentIntents = ["LONG_TERM", "TACTICAL"] as const;

export function PositionFormModal({
  mode,
  baseCurrency,
  position,
  action,
}: {
  mode: "create" | "edit";
  baseCurrency: string;
  position?: PositionFormValue;
  action: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const title = mode === "create" ? "Add position" : "Edit position";

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

      setIsOpen(false);
      setToast({
        message:
          mode === "create"
            ? "Position added successfully."
            : "Position updated successfully.",
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

  return (
    <>
      <button
        className={mode === "create" ? primaryButtonClassName : secondaryButtonClassName}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {mode === "create" ? "Add Position" : "Edit"}
      </button>

      {toast && <Toast message={toast.message} type={toast.type} />}

      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 px-4 py-6">
          <div className="max-h-full w-full max-w-2xl overflow-auto rounded border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="text-base font-semibold">{title}</h2>
              <button
                className="rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
                onClick={() => setIsOpen(false)}
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
              {position ? (
                <input name="positionId" type="hidden" value={position.id} />
              ) : null}
              <AssetSearchFields
                defaultAssetCurrency={position?.assetCurrency ?? baseCurrency}
                defaultAssetType={position?.assetType ?? "STOCK"}
                defaultExchange={position?.exchange ?? ""}
                defaultName={position?.name ?? ""}
                defaultProvider={position?.provider ?? "manual"}
                defaultProviderSymbol={position?.providerSymbol ?? ""}
                defaultSymbol={position?.symbol ?? ""}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Quantity">
                  <input
                    className={inputClassName}
                    defaultValue={position?.quantity ?? ""}
                    min="0"
                    name="quantity"
                    required
                    step="any"
                    type="number"
                  />
                </Field>
                <Field label="Avg cost">
                  <input
                    className={inputClassName}
                    defaultValue={position?.averageCost ?? ""}
                    min="0"
                    name="averageCost"
                    required
                    step="any"
                    type="number"
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Cost CCY">
                  <input
                    className={inputClassName}
                    defaultValue={position?.costCurrency ?? baseCurrency}
                    maxLength={3}
                    minLength={3}
                    name="costCurrency"
                    required
                  />
                </Field>
                <Field label="Intent">
                  <select
                    className={inputClassName}
                    defaultValue={position?.investmentIntent ?? "LONG_TERM"}
                    name="investmentIntent"
                  >
                    {investmentIntents.map((intent) => (
                      <option key={intent} value={intent}>
                        {formatEnum(intent)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Operation date">
                <input
                  className={inputClassName}
                  defaultValue={formatInputDate(position?.openedAt ?? null)}
                  name="openedAt"
                  required
                  type="date"
                />
              </Field>

              <Field label="Notes">
                <textarea
                  className={`${inputClassName} min-h-20 py-2`}
                  defaultValue={position?.notes ?? ""}
                  name="notes"
                />
              </Field>

              <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
                <button
                  className={secondaryButtonClassName}
                  disabled={isSubmitting}
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={primaryButtonClassName}
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? "Saving..."
                    : mode === "create"
                      ? "Add position"
                      : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
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
      className={`fixed right-5 top-5 z-[60] rounded border px-4 py-3 text-sm font-medium shadow-lg ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      {message}
    </div>
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

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function formatInputDate(value: Date | null): string {
  const date = value ?? new Date();

  return date.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to save position.";
}

const inputClassName =
  "h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-950 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

const primaryButtonClassName =
  "h-9 rounded bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400";

const secondaryButtonClassName =
  "h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60";
