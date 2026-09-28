"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AssetType, InvestmentIntent } from "@prisma/client";
import { AssetSearchFields } from "@/components/portfolio/asset-search-fields";
import { SUPPORTED_PORTFOLIO_CURRENCIES } from "@/lib/portfolio/currencies";

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
  latestPrice?: {
    price: number;
    currency: string;
    observedAt: Date;
  } | null;
};

type CashBalance = {
  id: string;
  platform: string;
  currency: string;
  amount: number;
};

const investmentIntents = ["LONG_TERM", "TACTICAL"] as const;

export function PositionFormModal({
  mode,
  baseCurrency,
  position,
  initialAsset,
  action,
  assetType,
  cashBalances = [],
  exchangeOptions = [],
  isOpen: controlledIsOpen,
  onOpenChange,
  showTrigger = true,
}: {
  mode: "create" | "edit";
  baseCurrency: string;
  position?: PositionFormValue;
  initialAsset?: PositionFormValue;
  action: (formData: FormData) => Promise<void>;
  assetType?: AssetType;
  cashBalances?: CashBalance[];
  exchangeOptions?: string[];
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  showTrigger?: boolean;
}) {
  const router = useRouter();
  const defaultAsset = position ?? initialAsset;
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [costCurrency, setCostCurrency] = useState(
    defaultAsset?.costCurrency ?? baseCurrency,
  );
  const [selectedExchange, setSelectedExchange] = useState(
    mode === "edit" ? position?.exchange ?? "" : "",
  );
  const [quantity, setQuantity] = useState(mode === "edit" ? position?.quantity ?? 0 : 0);
  const [averageCost, setAverageCost] = useState(
    mode === "edit" ? position?.averageCost ?? 0 : defaultAsset?.latestPrice?.price ?? 0,
  );
  const [amount, setAmount] = useState(quantity * averageCost);
  const [isCostCurrencyLocked, setIsCostCurrencyLocked] = useState(
    defaultAsset?.provider !== undefined && defaultAsset.provider !== "manual",
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const title = mode === "create" ? "Add position" : "Edit position";
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const purchaseCost = quantity * averageCost;
  const selectedCashBalance = cashBalances.find(
    (cashBalance) =>
      cashBalance.platform === selectedExchange &&
      cashBalance.currency === costCurrency,
  );

  useEffect(() => {
    if (!isOpen || mode !== "create" || !defaultAsset) {
      return;
    }

    let isActive = true;

    fetchCurrentPrice(defaultAsset)
      .then((price) => {
        if (!isActive || price === null) {
          return;
        }

        setAverageCost(price);
        setAmount(0);
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [defaultAsset, isOpen, mode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const cashValidationError =
      mode === "create"
        ? getCashValidationError(formData, cashBalances)
        : null;

    if (cashValidationError) {
      setToast({
        message: cashValidationError,
        type: "error",
      });
      window.setTimeout(() => setToast(null), 5000);
      return;
    }

    setIsSubmitting(true);

    try {
      await action(formData);

      if (mode === "create") {
        form.reset();
        setFormKey((current) => current + 1);
        setCostCurrency(baseCurrency);
        setSelectedExchange("");
        setQuantity(0);
        setAverageCost(0);
        setAmount(0);
        setIsCostCurrencyLocked(false);
      }

      setOpen(false);
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
          className={mode === "create" ? primaryButtonClassName : secondaryButtonClassName}
          onClick={() => {
            if (mode === "create") {
              setCostCurrency(defaultAsset?.costCurrency ?? baseCurrency);
              setSelectedExchange("");
              setQuantity(0);
              const nextAverageCost = defaultAsset?.latestPrice?.price ?? 0;

              setAverageCost(nextAverageCost);
              setAmount(0);
              setIsCostCurrencyLocked(
                defaultAsset?.provider !== undefined &&
                  defaultAsset.provider !== "manual",
              );
            }

            setOpen(true);
          }}
          type="button"
        >
          {mode === "create" ? "Add Position" : "Edit"}
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

            <form
              className="grid gap-4 px-5 py-5"
              key={formKey}
              onSubmit={handleSubmit}
            >
              {position ? (
                <input name="positionId" type="hidden" value={position.id} />
              ) : null}
              <AssetSearchFields
                defaultAssetCurrency={defaultAsset?.assetCurrency ?? baseCurrency}
                defaultAssetType={defaultAsset?.assetType ?? "STOCK"}
                defaultExchange={mode === "edit" ? position?.exchange ?? "" : ""}
                defaultName={defaultAsset?.name ?? ""}
                defaultProvider={defaultAsset?.provider ?? "manual"}
                defaultProviderSymbol={defaultAsset?.providerSymbol ?? ""}
                defaultSymbol={defaultAsset?.symbol ?? ""}
                exchangeOptions={exchangeOptions}
                lockedAssetType={assetType ?? defaultAsset?.assetType}
                onAssetCurrencyResolved={(currency, isLocked) => {
                  setCostCurrency(currency);
                  setIsCostCurrencyLocked(isLocked);
                }}
                onAssetSelected={(asset) => {
                  fetchCurrentPrice(asset)
                    .then((price) => {
                      if (price === null) {
                        return;
                      }

                      setAverageCost(price);
                      setAmount(quantity * price);
                    })
                    .catch(() => undefined);
                }}
                onExchangeChange={setSelectedExchange}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Quantity">
                  <input
                    className={inputClassName}
                    min="0"
                    name="quantity"
                    onChange={(event) => {
                      const nextQuantity = event.target.valueAsNumber || 0;

                      setQuantity(nextQuantity);
                      setAmount(nextQuantity * averageCost);
                    }}
                    required
                    step="any"
                    type="number"
                    value={quantity || ""}
                  />
                </Field>
                <Field label={`Amount in ${costCurrency}`}>
                  <div className="flex gap-2">
                    <input
                      className={inputClassName}
                      min="0"
                      onChange={(event) => {
                        const nextAmount = event.target.valueAsNumber || 0;

                        setAmount(nextAmount);
                        setQuantity(
                          averageCost > 0 ? nextAmount / averageCost : 0,
                        );
                      }}
                      step="any"
                      type="number"
                      value={amount || ""}
                    />
                    {mode === "create" ? (
                      <button
                        className={secondaryButtonClassName}
                        disabled={!selectedCashBalance || averageCost <= 0}
                        onClick={() => {
                          const nextAmount = selectedCashBalance?.amount ?? 0;

                          setAmount(nextAmount);
                          setQuantity(
                            averageCost > 0 ? nextAmount / averageCost : 0,
                          );
                        }}
                        type="button"
                      >
                        Max
                      </button>
                    ) : null}
                  </div>
                </Field>
                <Field label="Avg cost per unit">
                  <input
                    className={inputClassName}
                    min="0"
                    name="averageCost"
                    onChange={(event) => {
                      const nextAverageCost = event.target.valueAsNumber || 0;

                      setAverageCost(nextAverageCost);
                      setAmount(quantity * nextAverageCost);
                    }}
                    required
                    step="any"
                    type="number"
                    value={averageCost || ""}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Cost CCY">
                  {isCostCurrencyLocked ? (
                    <input name="costCurrency" type="hidden" value={costCurrency} />
                  ) : null}
                  <select
                    className={inputClassName}
                    disabled={isCostCurrencyLocked}
                    name="costCurrency"
                    onChange={(event) => setCostCurrency(event.target.value)}
                    required
                    value={costCurrency}
                  >
                    {SUPPORTED_PORTFOLIO_CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
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

              {mode === "create" ? (
                <CashPreview
                  balance={selectedCashBalance?.amount ?? null}
                  currency={costCurrency}
                  exchange={selectedExchange}
                  purchaseCost={purchaseCost}
                />
              ) : null}

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
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={primaryButtonClassName}
                  disabled={isSubmitting || exchangeOptions.length === 0}
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

function CashPreview({
  exchange,
  currency,
  balance,
  purchaseCost,
}: {
  exchange: string;
  currency: string;
  balance: number | null;
  purchaseCost: number;
}) {
  const remainingBalance = balance === null ? null : balance - purchaseCost;

  return (
    <div className="grid gap-1 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
      <div className="flex items-center justify-between gap-3">
        <span>Cash available</span>
        <span className="font-medium text-zinc-950">
          {exchange && balance !== null
            ? formatMoney(balance, currency)
            : "No matching balance"}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span>Estimated spend</span>
        <span className="font-medium text-zinc-950">
          {formatMoney(purchaseCost, currency)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span>Cash after add</span>
        <span
          className={`font-medium ${
            remainingBalance !== null && remainingBalance < 0
              ? "text-red-700"
              : "text-zinc-950"
          }`}
        >
          {remainingBalance === null
            ? "N/A"
            : formatMoney(remainingBalance, currency)}
        </span>
      </div>
    </div>
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

function getCashValidationError(
  formData: FormData,
  cashBalances: CashBalance[],
): string | null {
  const exchange = getFormString(formData, "exchange");
  const currency = getFormString(formData, "costCurrency").toUpperCase();
  const quantity = getFormNumber(formData, "quantity");
  const averageCost = getFormNumber(formData, "averageCost");
  const purchaseCost = quantity * averageCost;
  const cashBalance = cashBalances.find(
    (balance) =>
      balance.platform === exchange && balance.currency === currency,
  );

  if (!exchange || !currency || !Number.isFinite(purchaseCost)) {
    return null;
  }

  if (cashBalance && purchaseCost > cashBalance.amount) {
    return `Cannot add position: ${formatMoney(purchaseCost, currency)} exceeds ${formatMoney(cashBalance.amount, currency)} available on ${exchange}.`;
  }

  return null;
}

async function fetchCurrentPrice(asset: {
  provider: string;
  providerSymbol: string;
  symbol: string;
  name: string;
  assetType: AssetType;
}): Promise<number | null> {
  const params = new URLSearchParams({
    name: asset.name,
    provider: asset.provider,
    providerSymbol: asset.providerSymbol || asset.symbol,
    symbol: asset.symbol,
    type: asset.assetType,
  });
  const response = await fetch(`/api/assets/profile?${params}`);

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    profile?: {
      currentPrice?: number | null;
    } | null;
  };
  const price = data.profile?.currentPrice;

  return typeof price === "number" && Number.isFinite(price) ? price : null;
}

function getFormString(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function getFormNumber(formData: FormData, name: string): number {
  const value = getFormString(formData, name);

  return Number(value);
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
