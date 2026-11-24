"use client";

// features/planner/components/TasksIndexRedirect.tsx
// /tasks has no board of its own: it forwards to the user's
// first board. Board URLs are the canonical ones (the sidebar
// list and the board switcher link straight to them).

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBoards } from "../boards";

export function TasksIndexRedirect() {
  const boards = useBoards();
  const router = useRouter();
  useEffect(() => {
    if (boards.length > 0) {
      router.replace(`/tasks/${boards[0].id}`);
    }
  }, [boards, router]);
  return null;
}
