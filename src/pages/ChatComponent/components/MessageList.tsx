import React from "react";
import { MessageBubble } from "./MessageBuble";

export interface Message {
  id: string;
  role: "assistant" | "user" | "system" | "summary";
  content: string;
}

interface MessageListProps {
  history: Message[];
  loading?: boolean;
}

/**
 *  MessageList
 * Displays chat messages in correct order.
 * Uses stable keys and minimal re-renders.
 */
export const MessageList: React.FC<MessageListProps> = ({ history, loading = false }) => {
  const renderSkeletons = () => (
    <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto animate-pulse">
      {[...Array(4)].map((_, idx) => (
        <div key={idx} className={idx % 2 === 0 ? "flex justify-start" : "flex justify-end"}>
          <div className="h-16 w-3/4 max-w-lg rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  );

  if (loading && !history.length) {
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {renderSkeletons()}
      </div>
    );
  }

  if (!loading && !history?.length) {
    return (
<div className="flex flex-col flex-1 items-center justify-center text-center select-none px-6 h-full">
  <p className="text-3xl font-semibold text-gray-700 dark:text-gray-200 mb-1">
    What’s on your mind?
  </p>

  <p className="text-xl text-gray-500 dark:text-gray-400 opacity-80">
    Ask Ktulhu AI.
  </p>
</div>

    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
        {history.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <MessageBubble role={m.role} content={m.content} />
          </div>
        ))}
      </div>
    </div>
  );
};
