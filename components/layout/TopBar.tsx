"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { setMobileNav } from "./mobile-nav";
import { NotificationsBell } from "./NotificationsBell";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";

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

const CRUMB_KEYS: Record<string, DictKey> = {
  Dashboard: "crumb.dashboard",
  Feed: "crumb.feed",
  Settings: "crumb.settings",
  Appearance: "crumb.appearance",
  Profile: "crumb.profile",
  Account: "crumb.account",
  "Help Center": "crumb.helpCenter",
  Language: "crumb.language",
  Collaborations: "crumb.collaborations",
  "My Collaborations": "crumb.myCollaborations",
  Inbox: "crumb.inbox",
  Circle: "crumb.circle",
  Notifications: "crumb.notifications",
};

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
  const { t } = useLanguage();
  const crumb = (text: string) => {
    const key = CRUMB_KEYS[text];
    return key ? t(key) : text;
  };

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  return (
    <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line bg-chrome px-4 py-2 sm:px-6 lg:px-[42px] xl:flex-nowrap xl:py-0">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileNav(true)}
          aria-label={t("topbar.openMenu")}
          className="pressable flex cursor-pointer items-center rounded-md text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none lg:hidden"
        >
          <Icon name="menu" size={24} />
        </button>
        {backHref && (
          <button
            type="button"
            onClick={handleBack}
            aria-label={t("topbar.backTo", { label: crumb(backLabel) })}
            className="pressable flex cursor-pointer items-center rounded-md text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="chevron-left" size={24} />
          </button>
        )}
        <Breadcrumb root={crumb(breadcrumbRoot)} leaf={crumb(breadcrumbLeaf)} />
      </div>

      <div className="flex flex-1 items-center justify-end gap-3 sm:gap-6">
        {actions}
        <NotificationsBell />
      </div>

    </header>
  );
}