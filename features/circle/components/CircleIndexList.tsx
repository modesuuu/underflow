"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { channelUnread, useCircles } from "../store";
import type { CircleProjectSummary } from "../types";

/**
 * The /circle index rows. Unread totals come from the shared Circle
 * store so the numbers always match the channel badges inside each
 * workspace; project facts come from the server (api.getCircleProjects).
 */
export function CircleIndexList({
  projects,
}: {
  projects: CircleProjectSummary[];
}) {
  const circles = useCircles();

  if (projects.length === 0) {
    return (
      <p className="py-10 text-sm text-muted">
        You are not in any project circle yet. Join a collaboration first.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-line/50 border-y border-line/50">
      {projects.map((project) => {
        const data = circles[project.projectId];
        const unread = data
          ? channelUnread(data, "announcements") + channelUnread(data, "general")
          : 0;
        return (
          <Link
            key={project.projectId}
            href={`/circle/${project.projectId}`}
            className="group flex items-center gap-3 px-3 py-3.5 transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <div className="flex -space-x-2">
              {project.memberNames.slice(0, 3).map((name) => (
                <Avatar
                  key={name}
                  alt={name}
                  size={32}
                  className="ring-2 ring-surface"
                />
              ))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-base font-medium text-ink">
                {project.title}
              </span>
              <span className="text-xs text-muted">
                {project.statusLabel} · {project.memberNames.length} members
              </span>
            </div>
            {unread > 0 && (
              <span className="flex min-w-5 items-center justify-center rounded-full bg-badge px-1.5 py-0.5 text-xs font-semibold text-white">
                {unread}
                <span className="sr-only">unread messages</span>
              </span>
            )}
            <Icon
              name="chevron-right"
              size={20}
              className="shrink-0 text-subtle transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        );
      })}
    </div>
  );
}
