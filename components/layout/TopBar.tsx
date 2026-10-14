"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

export type TopBarVariant = "dashboard" | "detail";

interface TopBarProps {
  breadcrumbRoot?: string;
  breadcrumbLeaf?: string;
  backLabel?: string;
  backHref?: string;
  variant?: TopBarVariant;
  /** Page-specific right-side actions; rendered INSTEAD of the default Post button. */
  actions?: ReactNode;
}

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
  actions,
}: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  return (
    <header className="sticky top-0 z-20 flex h-[79px] items-center justify-between border-b border-line bg-chrome px-[42px]">
      <div className="flex items-center gap-3">
        {backHref && (
          <button
            type="button"
            onClick={handleBack}
            aria-label={`Back to ${backLabel}`}
            className="pressable flex cursor-pointer items-center rounded-md text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="chevron-left" size={24} />
          </button>
        )}
        <Breadcrumb root={breadcrumbRoot} leaf={breadcrumbLeaf} />
      </div>

      <div className="flex items-center gap-6">{actions}</div>

    </header>
  );
}