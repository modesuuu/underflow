"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Icon } from "./Icon";

/**
 * DateField — a themed replacement for <input type="date">, whose native
 * calendar popup cannot be styled at all. The trigger matches the form
 * fields used in MakeCollabModal; the popover is react-day-picker (grid,
 * keyboard navigation, disabled-day logic) recolored to the app tokens
 * through the .uf-datepicker overrides in globals.css.
 *
 * The value is an ISO "YYYY-MM-DD" string ("" = no date) — the exact
 * shape the native input produced, so callers and API payloads do not
 * change. Past days are disabled (the backend rejects past due dates).
 */

interface DateFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Parse "YYYY-MM-DD" as a LOCAL date (no UTC shift). */
function parseValue(value: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function DateField({
  id,
  value,
  onChange,
  placeholder = "Select date",
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = parseValue(value);
  const today = todayStart();

  // Close on an outside click. Escape closes ONLY the calendar: the
  // capture-phase listener + stopPropagation keep the surrounding
  // modal's own Escape handling from firing at the same time.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  const pick = (date: Date | undefined) => {
    onChange(date ? toValue(date) : "");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center rounded-lg bg-surface px-4 py-3 focus-within:ring-2 focus-within:ring-accent">
        <button
          type="button"
          id={id}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 bg-transparent text-left text-base font-medium outline-none"
        >
          <span className={selected ? "text-ink" : "text-muted"}>
            {selected
              ? `${selected.getDate()} ${MONTHS_SHORT[selected.getMonth()]} ${selected.getFullYear()}`
              : placeholder}
          </span>
          <Icon name="calendar" size={20} className="shrink-0 text-muted" />
        </button>
      </div>
      {open && (
        <div className="uf-datepicker-pop absolute left-0 top-full z-50 mt-2 rounded-lg border border-line bg-surface p-3 shadow-lg">
          <DayPicker
            className="uf-datepicker"
            mode="single"
            selected={selected}
            onSelect={pick}
            disabled={{ before: today }}
            defaultMonth={selected ?? today}
          />
          <div className="mt-2 flex items-center justify-between border-t border-line px-1 pt-2">
            <button
              type="button"
              onClick={() => pick(undefined)}
              className="pressable cursor-pointer text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => pick(today)}
              className="pressable cursor-pointer text-sm font-semibold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
