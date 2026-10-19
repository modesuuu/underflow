"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { CIRCLE_CHANNELS } from "../mock";
import { channelMentions, channelUnread } from "../store";
import type { ChannelId, CircleData } from "../types";

/**
 * The workspace's channel rail (spec §3): project header + the two
 * channels as real links. The active channel uses the sidebar's active
 * token; unread badges are counts derived from lastRead, and a badge
 * turns badge-red when an unread message mentions the current user.
 */
export function ChannelSidebar({
  projectId,
  title,
  statusLabel,
  channelId,
  data,
}: {
  projectId: string;
  title: string;
  statusLabel: string;
  channelId: ChannelId;
  data: CircleData;
}) {
  return (
    <div className="hidden w-[260px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex flex-col gap-0.5 border-b border-line px-4 py-3.5">
        <span className="line-clamp-2 text-base font-semibold leading-snug text-ink">
          {title}
        </span>
        <span className="text-xs text-muted">{statusLabel}</span>
      </div>
      <nav aria-label="Channels" className="flex flex-col gap-1 p-2.5">
        {CIRCLE_CHANNELS.map((channel) => {
          const unread = channelUnread(data, channel.id);
          const mentions = channelMentions(data, channel.id);
          const active = channel.id === channelId;
          return (
            <Link
              key={channel.id}
              href={`/circle/${projectId}/${channel.id}`}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                active
                  ? "bg-active font-medium text-ink"
                  : "text-muted hover:bg-bg hover:text-ink"
              }`}
            >
              <span className="text-base leading-none text-subtle">#</span>
              <span className="min-w-0 flex-1 truncate">{channel.label}</span>
              {unread > 0 && (
                <span
                  className={`flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    mentions > 0 ? "bg-badge text-white" : "bg-ink text-surface"
                  }`}
                >
                  {unread}
                  <span className="sr-only">
                    unread messages{mentions > 0 ? `, ${mentions} mentioning you` : ""}
                  </span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Below lg the channels become a horizontal switcher above the timeline. */
export function ChannelSwitcher({
  projectId,
  channelId,
  data,
}: {
  projectId: string;
  channelId: ChannelId;
  data: CircleData;
}) {
  return (
    <nav aria-label="Channels" className="flex gap-2 px-4 pt-3 lg:hidden">
      {CIRCLE_CHANNELS.map((channel) => {
        const unread = channelUnread(data, channel.id);
        const active = channel.id === channelId;
        return (
          <Link
            key={channel.id}
            href={`/circle/${projectId}/${channel.id}`}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              active
                ? "bg-ink font-medium text-surface"
                : "bg-bg text-muted hover:text-ink"
            }`}
          >
            <span aria-hidden>#</span>
            {channel.label}
            {unread > 0 && (
              <span className="flex min-w-5 items-center justify-center rounded-full bg-badge px-1 text-xs font-semibold text-white">
                {unread}
                <span className="sr-only">unread messages</span>
              </span>
            )}
          </Link>
        );
      })}
      <span className="flex items-center gap-1 text-xs text-subtle">
        <Icon name="group" size={14} />
        {data.members.length}
      </span>
    </nav>
  );
}
