"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CashBalance = {
  id: string;
  platform: string;
  currency: string;
  amount: number;
};

export function CashWithdrawalModal({
  cashBalances,
  defaultCashBalance,
  action,
  isOpen: controlledIsOpen,
  onOpenChange,
  showTrigger = true,
}: {
  cashBalances: CashBalance[];
  defaultCashBalance: CashBalance;
  action: (formData: FormData) => Promise<void>;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  showTrigger?: boolean;
}) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCashBalanceId, setSelectedCashBalanceId] = useState(
    defaultCashBalance.id,
  );
  const [amount, setAmount] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const selectedCashBalance = useMemo(
    () =>
      cashBalances.find((cashBalance) => cashBalance.id === selectedCashBalanceId) ??
      defaultCashBalance,
    [cashBalances, defaultCashBalance, selectedCashBalanceId],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (amount > selectedCashBalance.amount) {
      setToast({
        message: `Cannot withdraw more than ${formatMoney(selectedCashBalance.amount, selectedCashBalance.currency)} from ${selectedCashBalance.platform}.`,
        type: "error",
      });
      window.setTimeout(() => setToast(null), 5000);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);

    try {
      await action(formData);
      form.reset();
      setAmount(0);
      setOpen(false);
      setToast({
        message: "Cash withdrawn successfully.",
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
          className={menuButtonClassName}
          onClick={() => {
            setSelectedCashBalanceId(defaultCashBalance.id);
            setAmount(0);
            setOpen(true);
          }}
          type="button"
        >
          Withdraw
        </button>
      ) : null}

      {toast && <Toast message={toast.message} type={toast.type} />}

      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 px-4 py-6">
          <div className="w-full max-w-md rounded border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="text-base font-semibold">Withdraw cash</h2>
              <button
                className="rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
                onClick={() => setOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <form className="grid gap-4 px-5 py-5" onSubmit={handleSubmit}>
              <input
                name="cashBalanceId"
                type="hidden"
                value={selectedCashBalance.id}
              />
              <input
                name="platform"
                type="hidden"
                value={selectedCashBalance.platform}
              />
              <input
                name="currency"
                type="hidden"
                value={selectedCashBalance.currency}
              />

              <Field label="Exchange">
                <select
                  className={inputClassName}
                  onChange={(event) => {
                    setSelectedCashBalanceId(event.target.value);
                    setAmount(0);
                  }}
                  value={selectedCashBalance.id}
                >
                  {cashBalances.map((cashBalance) => (
                    <option key={cashBalance.id} value={cashBalance.id}>
                      {cashBalance.platform} / {cashBalance.currency}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Available</span>
                  <span className="font-medium text-zinc-950">
                    {formatMoney(
                      selectedCashBalance.amount,
                      selectedCashBalance.currency,
                    )}
                  </span>
                </div>
              </div>

              <Field label="Amount">
                <input
                  className={inputClassName}
                  max={selectedCashBalance.amount}
                  min="0"
                  name="amount"
                  onChange={(event) => setAmount(event.target.valueAsNumber || 0)}
                  required
                  step="any"
                  type="number"
                  value={amount || ""}
                />
              </Field>

              <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
                <button
                  className={secondaryButtonClassName}
                  disabled={isSubmitting}
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={primaryButtonClassName}
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Saving..." : "Withdraw"}
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

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      maximumFractionDigits: 2,
      style: "currency",
    }).format(value);
  } catch {
    return `${formatNumber(value)} ${currency}`;
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 8,
  }).format(value);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to withdraw cash.";
}

const inputClassName =
  "h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-950 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

const primaryButtonClassName =
  "h-9 rounded bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400";

const secondaryButtonClassName =
  "h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60";

const menuButtonClassName =
  "h-9 w-full rounded px-3 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100";
