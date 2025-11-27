// ChatList.tsx
import React from "react";
import { ChatListItem } from "./ChatListItem";
import type { ChatSummary } from "../../hooks/useChatSummaries";

export const ChatList: React.FC<{
  chats: ChatSummary[];
  chatId: string;
  loading?: boolean;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;   // <-- ADD THIS
}> = ({ chats, chatId, loading = false, onSelectChat, onNewChat, onDeleteChat }) => {

  const renderSkeletons = () => {
    return (
      <div className="flex flex-col gap-2 p-2 animate-pulse">
        {[...Array(4)].map((_, idx) => (
          <div
            key={idx}
            className="px-4 pr-10 py-2 rounded-md bg-gray-100 dark:bg-gray-800"
          >
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* New Chat button */}
      <button
        onClick={onNewChat}
        className="w-full text-left px-4 pr-2 py-2
        border-none outline-none focus:outline-none focus:ring-0
        appearance-none select-none bg-transparent"
      >
        + New Chat
      </button>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          renderSkeletons()
        ) : chats.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 p-4">
            No chats yet.
          </div>
        ) : (
          chats.map((chat) => (
            <ChatListItem
              key={chat.chat_id}
              chat={chat}
            isActive={chat.chat_id === chatId}
            onSelect={() => onSelectChat(chat.chat_id)}
            onDelete={() => onDeleteChat(chat.chat_id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
