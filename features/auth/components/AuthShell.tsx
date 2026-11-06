import type { ReactNode } from "react";
import { LogoMark } from "@/components/ui/LogoMark";

/**
 * Shared split layout for /login and /signup, adapted from the reference
 * the user sent (split card, brand panel + form panel) into the live
 * Forest & Cream system — the reference's blue becomes the fixed forest
 * brand panel, its copy becomes Underflow's own. The panel is a fixed
 * dark surface in both themes, so the mark is the verified app-icon combo
 * (cream U, lime star). Mobile gets the form first with a compact lockup.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="page-enter flex min-h-dvh bg-bg p-3 sm:p-5">
      <div className="m-auto flex w-full max-w-[1060px] flex-1 overflow-hidden rounded-3xl border border-line bg-surface">
        <aside className="hidden w-[44%] shrink-0 flex-col justify-between bg-brand p-10 text-on-brand lg:flex">
          <div className="flex items-center gap-3">
            <LogoMark className="size-8 text-on-brand" starClassName="fill-brand-star" />
            <span className="text-base font-medium">Underflow</span>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-[40px] leading-[1.1] font-medium tracking-[-0.02em]">
              Find your team. Build something real.
            </h1>
            <p className="max-w-[380px] text-base leading-relaxed text-on-brand/80">
              Underflow matches students by skill and ambition, not by who
              they already know.
            </p>
          </div>
          <p className="max-w-[380px] text-sm leading-relaxed text-on-brand/70">
            In our survey of 20 students, 75% said finding the right
            teammates is hard.
          </p>
        </aside>
        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="mx-auto flex w-full max-w-[420px] flex-col gap-7">
            <div className="flex items-center gap-3 lg:hidden">
              <LogoMark className="size-8 text-ink" />
              <span className="text-base font-medium text-ink">Underflow</span>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-[28px] leading-tight font-medium text-ink">{title}</h1>
              <p className="text-sm text-muted">{subtitle}</p>
            </div>
            {children}
            <div className="text-center text-sm text-muted">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
