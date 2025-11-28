// ChatSidebarMobile.tsx
import React, { useState } from "react";
import { Menu, X } from "lucide-react";

import { useSession } from "../../context/SessionContext";
import { useChatSummaries } from "../../hooks/useChatSummaries";
import { ChatList } from "./ChatList";

import { deleteChatThread, createNewChat } from "./utils/chatActions";
import { KtulhuLogo } from "../KtulhuLogo";


export const ChatSidebarMobile: React.FC<{ onSelectChat?: (id: string) => void }> = ({
  onSelectChat,
}) => {
  const { chatId, setChatId } = useSession();
  const { chats, upsert, remove, loading } = useChatSummaries();
  const [isOpen, setIsOpen] = useState(false);

  /* ----------------------------
        SELECT CHAT
  -----------------------------*/
  const handleSelectChat = (id: string) => {
    setChatId(id);
    onSelectChat?.(id);
    setIsOpen(false); // close drawer
  };

  /* ----------------------------
        CREATE NEW CHAT
  -----------------------------*/
  const handleNewChat = () => {
    const id = createNewChat({ upsert });
    handleSelectChat(id);
  };

  /* ----------------------------
        DELETE CHAT
  -----------------------------*/
  const handleDeleteChat = (id: string) => {
    deleteChatThread(id, { remove });
  };

  return (
    <div className="relative w-full w-full px-9">
      {/* Burger Button */}

<div className="flex flex-row justify-between">
      <KtulhuLogo size={44}/> 
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
        flex items-center justify-center
        rounded-md p-2 transition-opacity duration-150
        text-chat-item-text dark:text-chat-item-text-dark
        bg-chat-item-bg dark:bg-chat-item-bg-dark
        
      "
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      </div>

      {/* Overlay + drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsOpen(false)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-xl animate-slideIn flex flex-col"
          >
            <ChatList
              chats={chats}
              chatId={chatId}
              loading={loading}
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
              onDeleteChat={handleDeleteChat}
            />
          </aside>
        </div>
      )}
    </div>
  );
};
