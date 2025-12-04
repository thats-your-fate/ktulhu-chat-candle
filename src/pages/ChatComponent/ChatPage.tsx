import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

import { Container } from "../../components/ui/Container";
import { Pannel, PannelBody } from "../../components/ui/Pannel";

import { MessageList } from "./components/MessageList";
import { InputArea } from "../../components/ui/input";

import { useChatStore } from "../../hooks/useChatStore";
import { useSocketContext } from "../../context/SocketProvider";
import { useSession } from "../../context/SessionContext";

import { SystemStatusBanner } from "../../components/SystemStatusBanner";

const DEFAULT_MODEL = "ministral-8b";

// ----------------------------------------------------------
// ChatGPT-style streaming:
// - no setInterval
// - per-token => queued, patched once per animation frame
// - auto-scroll on each applied chunk
// ----------------------------------------------------------

export default function ChatComponent() {
  const { chatId } = useSession();
  const { history, add, patch, loading } = useChatStore();

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { sendPrompt, addHandlers } = useSocketContext();
  // Mobile Safari glitches when the keyboard appears if the composer uses backdrop blur.
  const isiOS = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }, []);

  /** Active assistant message ID */
  const assistantIdRef = useRef<string | null>(null);

  /** Pending text that will be flushed to the last assistant message */
  const pendingChunkRef = useRef<string>("");

  /** Are we already scheduled to flush via rAF? */
  const rafScheduledRef = useRef(false);

  /* ------------------------------------------------------ */
  /*  AUTO SCROLL                                           */
  /* ------------------------------------------------------ */
  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    // Whenever history length changes (new message added),
    // ensure we stay at the bottom.
    scrollToBottom();
  }, [history.length, scrollToBottom]);

  /* ------------------------------------------------------ */
  /*  rAF FLUSH LOOP (per-frame batching)                   */
  /* ------------------------------------------------------ */
  const scheduleFlush = useCallback(() => {
    if (rafScheduledRef.current) return;
    rafScheduledRef.current = true;

    requestAnimationFrame(() => {
      rafScheduledRef.current = false;

      const id = assistantIdRef.current;
      const chunk = pendingChunkRef.current;

      if (!id || !chunk) return;

      // Clear pending before patching (in case patch throws)
      pendingChunkRef.current = "";

      // Append chunk to the last assistant message
      patch(id, chunk);
      scrollToBottom();
    });
  }, [patch, scrollToBottom]);

  /* ------------------------------------------------------ */
  /*  WS HANDLERS                                           */
  /* ------------------------------------------------------ */
  useEffect(() => {
    const remove = addHandlers({
      onSystem: (msg) => {
        setLiveStatus(msg.system || msg.message || null);
      },

      onToken: (token) => {
        // When tokens start arriving, clear any system banner
        setLiveStatus(null);

        // Lazily create assistant message
        if (!assistantIdRef.current) {
          const id = uuidv4();
          assistantIdRef.current = id;
          add({
            id,
            role: "assistant",
            content: "",
            ts: Date.now(),
          });
        }

        // Append token to pending chunk buffer
        pendingChunkRef.current += token;

        // Schedule a UI flush on the next frame
        scheduleFlush();
      },

      onDone: () => {
        const id = assistantIdRef.current;

        // Final flush of any remaining pending text
        if (id && pendingChunkRef.current.length > 0) {
          const leftover = pendingChunkRef.current;
          pendingChunkRef.current = "";
          patch(id, leftover);
          scrollToBottom();
        }

        // Reset streaming state
        assistantIdRef.current = null;
        rafScheduledRef.current = false;

        setIsSending(false);
        setLiveStatus(null);
      },
    });

    return () => remove?.();
  }, [add, patch, addHandlers, scheduleFlush, scrollToBottom]);

  /* ------------------------------------------------------ */
  /*  SEND MESSAGE (user)                                   */
  /* ------------------------------------------------------ */
  const handleSend = useCallback(() => {
    const clean = input.trim();
    if (!clean || isSending) return;

    // Reset any in-flight assistant streaming state
    pendingChunkRef.current = "";
    assistantIdRef.current = null;
    rafScheduledRef.current = false;

    setIsSending(true);

    const id = uuidv4();
    const ts = Date.now();

    add({ id, role: "user", content: clean, ts });

    sendPrompt(clean);

    setInput("");
  }, [input, isSending, sendPrompt, add]);

  /* ------------------------------------------------------ */
  /*  UI                                                    */
  /* ------------------------------------------------------ */
return (
  <div className="flex flex-1 h-full min-h-0 justify-center w-full">
    <Pannel className="flex flex-col w-full h-full min-h-0 relative overflow-hidden">

      {/* Scrollable message area */}
      <PannelBody
        ref={scrollRef as any}
        className="flex-1 overflow-y-auto relative pb-safe-bottom"
      >
        <MessageList history={history} loading={loading} />
        <SystemStatusBanner text={liveStatus ?? null} />
      </PannelBody>

      {/* Composer (NOT ABSOLUTE ANYMORE) */}
      <div
        className={`
          border-t px-4 py-3 w-full 
          ${isiOS 
            ? "bg-header-bg/95 dark:bg-header-bg-dark/95" 
            : "backdrop-blur-sm bg-header-bg/70 dark:bg-header-bg-dark/70"
          }
        `}
        style={{
          paddingBottom: "env(safe-area-inset-bottom)"
        }}
      >
        <InputArea
          value={input}
          onChange={setInput}
          onSend={handleSend}
          placeholder={isSending ? "Model is thinking..." : "Send a message..."}
          disabled={isSending}
        />

        <div className="text-xs text-gray-500 mt-2 hidden sm:block">
          Chat ID: {chatId} • Model: {DEFAULT_MODEL}
        </div>
      </div>

    </Pannel>
  </div>
);
}