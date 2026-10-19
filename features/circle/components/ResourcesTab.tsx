"use client";

import { Icon } from "@/components/ui/Icon";
import { deleteResource } from "../store";
import type { CircleData, CircleResource } from "../types";

const KIND_ICON: Record<CircleResource["kind"], string> = {
  figma: "palette",
  github: "git-branch",
  drive: "folder",
  link: "link",
  deadline: "calendar",
};

/**
 * Resources tab (spec §6): the project's resource list plus pinned
 * messages promoted into the same panel. The owner can remove a
 * resource; adding resources by hand is V2.
 */
export function ResourcesTab({
  projectId,
  data,
}: {
  projectId: string;
  data: CircleData;
}) {
  const meIsOwner = data.members.some((m) => m.userId === "me" && m.isOwner);
  const pinned = data.messages.filter((m) => m.pinned);
  const membersById = new Map(data.members.map((m) => [m.userId, m]));

  return (
    <div className="flex flex-col py-3">
      {data.resources.length === 0 ? (
        <p className="px-4 py-2 text-sm text-muted">
          No resources yet. Pin a message or wait for the owner to add links.
        </p>
      ) : (
        data.resources.map((resource) => {
          const inner = (
            <>
              <Icon
                name={KIND_ICON[resource.kind]}
                size={18}
                className="shrink-0 text-subtle"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-ink">
                  {resource.label}
                </span>
                {resource.note && (
                  <span className="truncate text-xs text-muted">
                    {resource.note}
                  </span>
                )}
              </span>
            </>
          );
          const rowClass =
            "group flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-bg";
          return (
            <div key={resource.id} className={rowClass}>
              {resource.url ? (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  {inner}
                </a>
              ) : (
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                  {inner}
                </span>
              )}
              {meIsOwner && (
                <button
                  type="button"
                  aria-label={`Remove ${resource.label}`}
                  onClick={() => deleteResource(projectId, resource.id)}
                  className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:text-ink focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
          );
        })
      )}
      <span className="px-4 pt-5 pb-1 text-xs font-semibold text-subtle">
        Pinned messages
      </span>
      {pinned.length === 0 ? (
        <p className="px-4 py-1 text-sm text-muted">No pinned messages.</p>
      ) : (
        pinned.map((message) => (
          <button
            key={message.id}
            type="button"
            onClick={() =>
              document
                .getElementById(`circle-msg-${message.id}`)
                ?.scrollIntoView({ block: "center", behavior: "smooth" })
            }
            className="flex cursor-pointer flex-col gap-0.5 px-4 py-2 text-left transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <span className="text-xs text-subtle">
              {membersById.get(message.authorId)?.name ?? "Unknown"} · #
              {message.channelId}
            </span>
            <span className="line-clamp-2 text-sm text-ink">{message.body}</span>
          </button>
        ))
      )}
    </div>
  );
}
