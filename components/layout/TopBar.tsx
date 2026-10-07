"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

export type TopBarVariant = "dashboard" | "detail";

interface TopBarProps {
  breadcrumbRoot?: string;
  breadcrumbLeaf?: string;
  backLabel?: string;
  backHref?: string;
  variant?: TopBarVariant;
}

const SCROLL_THRESHOLD = 24;

function Breadcrumb({ root, leaf }: { root: string; leaf: string }) {
  return (
    <p className="text-base text-ink">
      <span className="font-normal">{root}</span>
      <span className="font-normal"> / </span>
      <span className="font-medium">{leaf}</span>
    </p>
  );
}

export function TopBar({
  breadcrumbRoot = "Dashboard",
  breadcrumbLeaf = "Feed",
  backLabel = "Feed",
  backHref,
  variant = "dashboard",
}: TopBarProps) {
  const router = useRouter();
  const barRef = useRef<HTMLElement>(null);
  const borderRef = useRef<HTMLSpanElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const scroller = bar.closest("main");
    if (!scroller) return;
    const onScroll = () => setScrolled(scroller.scrollTop > SCROLL_THRESHOLD);
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (variant !== "dashboard" || !borderRef.current) return;
    gsap.to(borderRef.current, {
      opacity: scrolled ? 1 : 0,
      duration: 0.2,
      ease: "power2.out",
    });
  }, [scrolled, variant]);

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  return (
    <header
      ref={barRef}
      className="sticky top-0 z-20 flex h-[79px] items-center justify-between bg-bg px-[42px]"
    >
      <div className="flex items-center">
        {variant === "detail" ? (
          <button
            type="button"
            onClick={handleBack}
            aria-label={`Back to ${backLabel}`}
            className="flex cursor-pointer items-center"
          >
            <Icon name="chevron-left" size={24} />
            <span className="text-base font-bold">{backLabel}</span>
          </button>
        ) : (
          <Breadcrumb root={breadcrumbRoot} leaf={breadcrumbLeaf} />
        )}
      </div>

      <div className="flex items-center gap-6">
        
        {/* <div className="flex items-center gap-2">
          <button type="button" aria-label="Notifications" className="cursor-pointer text-ink">
            <Icon name="bell" size={20} />
          </button>
          <button type="button" aria-label="Settings" className="cursor-pointer text-ink">
            <Icon name="cog" size={20} />
          </button>
        </div> */}

        {/* TODO(backend): open composer modal / POST /api/posts */}
        <button
          type="button"
          className="flex cursor-pointer items-center gap-1 rounded-md bg-accent p-2 transition-opacity hover:opacity-85"
        >
          <Icon name="plus" size={16} />
          <span className="text-sm font-medium">Post Something</span>
        </button>
      </div>

      <span
        ref={borderRef}
        aria-hidden="true"
        className={
          "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-line " +
          (variant === "detail" ? "opacity-100" : "opacity-0")
        }
      />
    </header>
  );
}