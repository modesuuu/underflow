"use client";

import { MessageItem } from "./MessageItem";
import type { CircleMember, CircleMessage } from "../types";

/** A run of messages by one author (spec §5.1 grouping lives in the timeline). */
export function MessageGroup({
  projectId,
  author,
  messages,
  membersById,
  messagesById,
  meIsOwner,
  onReply,
}: {
  projectId: string;
  author: CircleMember | undefined;
  messages: CircleMessage[];
  membersById: Map<string, CircleMember>;
  messagesById: Map<string, CircleMessage>;
  meIsOwner: boolean;
  onReply: (message: CircleMessage) => void;
}) {
  return (
    <div className="mt-4 flex flex-col">
      {messages.map((message, i) => (
        <MessageItem
          key={message.id}
          projectId={projectId}
          message={message}
          author={author}
          membersById={membersById}
          messagesById={messagesById}
          isContinuation={i > 0}
          meIsOwner={meIsOwner}
          onReply={onReply}
        />
      ))}
    </div>
  );
}
