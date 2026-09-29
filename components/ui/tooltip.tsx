"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export function Tooltip({
  children,
  disabled = false,
  label,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    if (!isVisible || disabled) {
      return;
    }

    function updatePosition() {
      const rect = anchorRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      setPosition({
        left: rect.left + rect.width / 2,
        top: rect.bottom + 8,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [disabled, isVisible]);

  return (
    <span
      className="inline-flex"
      onBlur={() => setIsVisible(false)}
      onFocus={() => {
        if (!disabled) {
          setIsVisible(true);
        }
      }}
      onMouseEnter={() => {
        if (!disabled) {
          setIsVisible(true);
        }
      }}
      onMouseLeave={() => setIsVisible(false)}
      ref={anchorRef}
    >
      {children}
      {isVisible && position && !disabled
        ? createPortal(
            <span
              className="pointer-events-none fixed z-[100] w-max max-w-64 -translate-x-1/2 rounded border border-zinc-200 bg-zinc-950 px-2 py-1 text-xs font-medium normal-case text-white shadow-lg"
              style={{
                left: position.left,
                top: position.top,
              }}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
