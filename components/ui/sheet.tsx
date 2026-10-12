"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";

/**
 * Slide-over sheet on Base UI's Dialog primitive: focus trap, Escape handling,
 * and exit motion come from the primitive. Skinned in the version-A language —
 * white surface, hairline border, 20px radius — the notification drawer is the
 * only fixed-width surface that opens over the app.
 */

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={clsx(
        "fixed inset-0 z-50 bg-ink/60 transition-opacity duration-200 ease-[var(--uf-ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0",
        className
      )}
      {...props}
    />
  );
}

interface SheetContentProps extends SheetPrimitive.Popup.Props {
  side?: "right" | "left";
  showCloseButton?: boolean;
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={clsx(
          "fixed z-50 flex h-dvh flex-col bg-surface text-ink shadow-lg",
          "transition duration-200 ease-[var(--uf-ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0 overscroll-contain",
          side === "right" &&
            "inset-y-0 right-0 w-(--uf-panel-w) max-w-full rounded-l-xl border-l border-line data-ending-style:translate-x-[2.5rem] data-starting-style:translate-x-[2.5rem]",
          side === "left" &&
            "inset-y-0 left-0 w-(--uf-panel-w) max-w-full rounded-r-xl border-r border-line data-ending-style:translate-x-[-2.5rem] data-starting-style:translate-x-[-2.5rem]",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <button
                type="button"
                aria-label="Close"
                className="pressable absolute right-3 top-3.5 cursor-pointer rounded-md p-1 text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              />
            }
          >
            <Icon name="x" size={18} />
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={clsx("flex flex-col gap-0.5 px-6 py-4", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={clsx("text-xl font-medium text-ink", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
};
