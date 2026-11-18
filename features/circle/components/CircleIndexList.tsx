"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import type { CircleSummary } from "../types";
import { circleStatusKey } from "./statusLabel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * The /circle index rows (Circle Phase 1): one row per circle the
 * user can access, from GET /api/circles. The backend sends member
 * names only, so the stack renders initial avatars.
 */
export function CircleIndexList({ circles }: { circles: CircleSummary[] }) {
  const { t } = useLanguage();
  if (circles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-bg text-subtle">
          <Icon name="conversation" size={22} />
        </span>
        <p className="text-base font-medium text-ink">
          {t("circle.indexEmpty")}
        </p>
        <p className="max-w-sm text-sm text-muted">
          {t("circle.indexEmptyHint")}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      {circles.map((circle) => (
        <Link
          key={circle.id}
          href={`/circle/${circle.id}`}
          className="pressable flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <span className="flex -space-x-2">
            {circle.memberNames.slice(0, 3).map((name, i) => (
              <Avatar
                key={`${circle.id}-member-${i}`}
                alt={name}
                size={32}
                className="ring-2 ring-surface"
              />
            ))}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-base font-medium text-ink">
              {circle.title}
            </span>
            <span className="truncate text-sm text-muted">
              {t(circleStatusKey(circle.status))}
              {" · "}
              {t("circle.membersCount", { count: circle.memberCount })}
            </span>
          </span>
          <Icon
            name="chevron-right"
            size={18}
            className="shrink-0 text-subtle"
          />
        </Link>
      ))}
    </div>
  );
}
