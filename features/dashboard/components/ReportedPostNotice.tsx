"use client";

import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * The post-report confirmation that replaces a post's content —
 * one shared treatment: the feed card swaps to it, and so does
 * the post detail body. Undo withdraws the report at the backend
 * and restores the post.
 */
export function ReportedPostNotice({
  onUndo,
  noun = "post",
}: {
  onUndo: () => void;
  noun?: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line px-4 py-3">
      <Icon name="flag" size={20} className="shrink-0 text-muted" />
      <p className="flex-1 text-sm text-muted">
        <span className="font-medium text-ink">
          {t("feed.reportedNotice", {
            noun: noun === "comment" ? t("feed.commentNoun") : t("feed.postNoun"),
          })}
        </span>{" "}
        {t("feed.reportedReview")}
      </p>
      <button
        type="button"
        onClick={onUndo}
        className="shrink-0 cursor-pointer text-sm font-medium text-ink hover:underline"
      >
        {t("common.undo")}
      </button>
    </div>
  );
}
