import type { ProjectStatus } from "./types";

/** Icon per collaboration status, shown in the detail pages' header
 *  pill: open = a live/broadcast dot (the project is recruiting),
 *  in-progress = a loader, completed = a check. The pill previously
 *  showed a joystick for every status — a leftover from the old card
 *  design — which next to the word "open" read as an open book. */
export const STATUS_ICONS: Record<ProjectStatus, string> = {
  open: "radio-circle-marked",
  "in-progress": "loader-alt",
  completed: "check-circle",
};
