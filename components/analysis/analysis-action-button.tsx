"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { AiIcon, RefreshIcon } from "@/components/ui/icons";
import { showToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";

const analysisTierText = "cheap, standard, and strong model tiers";

export function AnalysisIconForm({
  action,
  fieldName,
  fieldValue,
  symbol,
  disabled = false,
}: {
  action: (formData: FormData) => Promise<void>;
  disabled?: boolean;
  fieldName: string;
  fieldValue: string;
  symbol: string;
}) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <form
      action={action}
      onSubmit={() => {
        setIsSubmitted(true);
        showToast(
          `AI analysis for ${symbol} started with ${analysisTierText}.`,
          "success",
        );
      }}
    >
      <input name={fieldName} type="hidden" value={fieldValue} />
      <AnalysisSubmitButton
        disabled={disabled || isSubmitted}
        icon={<AiIcon className="size-4" />}
        label={`AI analysis for ${symbol}`}
        tooltip="AI analysis"
        variant="ai"
      />
    </form>
  );
}

export function RefreshAnalysisForm({
  action,
  agentRunId,
  symbol,
  disabled = false,
  size = "compact",
}: {
  action: (formData: FormData) => Promise<void>;
  agentRunId: string;
  disabled?: boolean;
  size?: "compact" | "header";
  symbol: string;
}) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <form
      action={action}
      onClick={(event) => event.stopPropagation()}
      onSubmit={() => {
        setIsSubmitted(true);
        showToast(
          `AI analysis refresh for ${symbol} started with ${analysisTierText}.`,
          "success",
        );
      }}
    >
      <input name="agentRunId" type="hidden" value={agentRunId} />
      <AnalysisSubmitButton
        disabled={disabled || isSubmitted}
        icon={<RefreshIcon className="text-[22px] leading-none" />}
        label={`Refresh AI analysis for ${symbol}`}
        size={size}
        tooltip="Refresh analysis"
        variant="secondary"
      />
    </form>
  );
}

function AnalysisSubmitButton({
  disabled,
  icon,
  label,
  size = "compact",
  tooltip,
  variant,
}: {
  disabled: boolean;
  icon: ReactNode;
  label: string;
  size?: "compact" | "header";
  tooltip: string;
  variant: "ai" | "secondary";
}) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;
  const className =
    variant === "ai"
      ? "grid size-8 place-items-center rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
      : size === "header"
        ? "grid h-10 w-10 place-items-center rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
        : "grid size-8 place-items-center rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400";

  return (
    <Tooltip disabled={isDisabled} label={tooltip}>
      <button
        aria-label={label}
        className={className}
        disabled={isDisabled}
        type="submit"
      >
        {icon}
      </button>
    </Tooltip>
  );
}
