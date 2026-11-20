"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { MyCollabProject } from "@/features/my-collaborations/types";
import { CreateCircleRows } from "./CreateCircleRows";

/**
 * Centered modal listing owned projects that still have no Circle,
 * opened from the rail's plus tile. Replaces the old popover menu,
 * which overflowed the narrow rail. Creating closes the modal and
 * lands the user inside the new circle.
 */
export function CreateCircleModal({
  projects,
  creatingId,
  onClose,
  onCreate,
}: {
  projects: MyCollabProject[];
  creatingId: string | null;
  onClose: () => void;
  onCreate: (project: MyCollabProject) => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("circle.withoutCircleTitle")}
        className="w-full max-w-md rounded-lg border border-line bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            {t("circle.withoutCircleTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="mt-2 max-h-[60vh] overflow-y-auto">
          <CreateCircleRows
            projects={projects}
            creatingId={creatingId}
            onCreate={onCreate}
          />
        </div>
      </div>
    </div>
  );
}
