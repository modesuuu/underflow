"use client";

// features/planner/components/TasksIndexRedirect.tsx
// /tasks has no board of its own: it forwards to the user's
// first board. When there are no boards at all (the user
// deleted the last one), it shows an empty state with a way
// to create one instead of a blank page. The redirect waits
// for the store to load, so a persisted empty list is not
// mistaken for the seeds.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  setCreateBoardOpen,
  teamBoardId,
  useBoards,
  useBoardsLoaded,
  useServerTeamBoards,
  useServerTeamBoardsLoaded,
} from "../boards";

export function TasksIndexRedirect() {
  const boards = useBoards();
  const loaded = useBoardsLoaded();
  const serverBoards = useServerTeamBoards();
  const serverLoaded = useServerTeamBoardsLoaded();
  const router = useRouter();
  const { t } = useLanguage();
  useEffect(() => {
    if (!loaded || !serverLoaded) return;
    // A wired team board comes first (it is the shared one);
    // otherwise the first local board, as before.
    if (serverBoards.length > 0) {
      router.replace(`/tasks/${teamBoardId(serverBoards[0].collabId)}`);
    } else if (boards.length > 0) {
      router.replace(`/tasks/${boards[0].id}`);
    }
  }, [loaded, serverLoaded, boards, serverBoards, router]);
  if (!loaded || !serverLoaded) return null;
  if (serverBoards.length === 0 && boards.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 py-16">
        <h1 className="text-2xl font-medium tracking-tight text-ink">
          {t("planner.noBoards")}
        </h1>
        <p className="max-w-md text-sm text-muted">
          {t("planner.noBoardsBody")}
        </p>
        <button
          type="button"
          onClick={() => setCreateBoardOpen(true)}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface"
        >
          {t("nav.newBoard")}
        </button>
      </div>
    );
  }
  return null;
}
