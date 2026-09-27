"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_PORTFOLIO_CURRENCIES } from "@/lib/portfolio/currencies";

type CashValue = {
  id: string;
  platform: string;
  currency: string;
  amount: number;
};

export function CashFormModal({
  mode,
  baseCurrency,
  cashBalance,
  action,
  exchangeOptions = [],
}: {
  mode: "create" | "edit";
  baseCurrency: string;
  cashBalance?: CashValue;
  action: (formData: FormData) => Promise<void>;
  exchangeOptions?: string[];
}) {
  const router = useRouter();
  const exchangeListId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const title = mode === "create" ? "Add cash" : "Edit cash";

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
            ? "Cash added successfully."
            : "Cash updated successfully.",
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
        className={mode === "create" ? primaryButtonClassName : menuButtonClassName}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {mode === "create" ? "Add Cash" : "Edit"}
      </button>

      {toast && <Toast message={toast.message} type={toast.type} />}

      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 px-4 py-6">
          <div className="w-full max-w-md rounded border border-zinc-200 bg-white shadow-xl">
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
              {cashBalance ? (
                <input
                  name="cashBalanceId"
                  type="hidden"
                  value={cashBalance.id}
                />
              ) : null}
              <p className="text-xs leading-5 text-zinc-500">
                {mode === "create"
                  ? "If the same exchange and currency already exist, this amount will be added to the current cash balance."
                  : "Editing replaces this cash balance amount."}
              </p>
              <Field label="Exchange">
                <input
                  autoComplete="off"
                  className={inputClassName}
                  defaultValue={cashBalance?.platform ?? ""}
                  list={exchangeOptions.length > 0 ? exchangeListId : undefined}
                  name="platform"
                  placeholder="Revolut, IBKR, Binance..."
                  required
                />
                {exchangeOptions.length > 0 ? (
                  <datalist id={exchangeListId}>
                    {exchangeOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                ) : null}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Currency">
                  <select
                    className={inputClassName}
                    defaultValue={cashBalance?.currency ?? baseCurrency}
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
                <Field label="Amount">
                  <input
                    className={inputClassName}
                    defaultValue={cashBalance?.amount ?? ""}
                    min="0"
                    name="amount"
                    required
                    step="any"
                    type="number"
                  />
                </Field>
              </div>
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
                  {isSubmitting ? "Saving..." : "Save cash"}
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to save cash.";
}

const inputClassName =
  "h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-950 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

const primaryButtonClassName =
  "h-9 rounded bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400";

const secondaryButtonClassName =
  "h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60";

const menuButtonClassName =
  "h-9 w-full rounded px-3 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100";
