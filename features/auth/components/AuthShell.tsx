import type { ReactNode } from "react";
import { LogoMark } from "@/components/ui/LogoMark";

/**
 * Shared split layout for /login and /signup — FULL-BLEED, no card, no
 * scroll on laptop screens. The brand panel takes 60% and the form 40%
 * (user decision 2026-11-06); on lg+ the shell is exactly one viewport
 * tall (h-dvh + overflow-hidden) so the page never scrolls, and the
 * illustration flexes into the leftover height with object-contain.
 * The illustration is the user's own Gemini render of the mockup's
 * desk scene with its white background removed to transparency — no
 * backdrop box, it floats straight on the forest panel. The survey
 * proof line was removed at the user's request (2026-11-06).
 * The form side scrolls internally only if a short screen ever needs
 * it. Mobile keeps the form first with a compact lockup and normal
 * page scroll.
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
    <div className="page-enter flex min-h-dvh w-full lg:h-dvh lg:overflow-hidden">
      <aside className="hidden w-[60%] shrink-0 flex-col justify-between gap-6 p-10 text-on-brand lg:flex xl:p-12" style={{ backgroundColor: "#1e5128" }}>
        <div className="flex items-center gap-3">
          <LogoMark className="size-8 text-on-brand" />
          <span className="text-base font-medium">Underflow</span>
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-[44px] leading-[1.05] font-medium tracking-[-0.02em]" style={{ color: "#eff4de" }}>
            <span className="block">Find your team.</span>
            <span className="block">Build something real.</span>
          </h1>
          <p className="max-w-[520px] text-base leading-relaxed text-on-brand/80">
            Underflow matches students by skill and ambition, not by who
            they already know.
          </p>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <img
            src="/auth-3d-illustration.png"
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </aside>
      <div className="flex flex-1 flex-col justify-center bg-surface px-6 py-10 sm:px-8 lg:overflow-y-auto">
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
  );
}
