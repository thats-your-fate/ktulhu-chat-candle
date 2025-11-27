import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "../context/SessionContext";

export interface ChatSummary {
  chat_id: string;
  summary?: string | null;
  text?: string | null;
  ts: number;
}

interface UseChatSummariesOptions {
  baseUrl?: string;
  persist?: boolean;
}

/* ---------------------------------------------------
  Shared global reactive store
--------------------------------------------------- */

let globalChats: ChatSummary[] = [];
const subscribers = new Set<React.Dispatch<React.SetStateAction<ChatSummary[]>>>();



function ensureTs(value: any, fallback?: number): number {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(num)) return num;
  return fallback ?? Date.now();
}

function cleanSummaryText(value: any): string | null {
  if (!value) return null;
  let text = String(value).trim();
  text = text.replace(/<\/s>\s*$/i, ""); // strip model end token
  text = text.replace(/^Topic\s+tag:\s*/i, ""); // strip topic-tag prefix
  text = text.replace(/^\?\s*/, ""); // stray leading question marks
  text = text.trim();
  return text || null;
}

function normalizeSummaryPayload(payload: any): ChatSummary | null {
  if (!payload?.chat_id) return null;

  // Prefer summary/text fields for display
  const summaryText = cleanSummaryText(payload.text ?? payload.summary ?? null);
  const ts = ensureTs(payload.ts, undefined);

  return {
    chat_id: payload.chat_id,
    summary: summaryText,
    text: cleanSummaryText(payload.text ?? payload.summary ?? null),
    ts,
  };
}

export function applyChatSummaryUpdate(payload: any) {
  const next = normalizeSummaryPayload(payload);
  if (!next) return;

  const existing = globalChats.find((c) => c.chat_id === next.chat_id);
  const merged: ChatSummary = {
    ...existing,
    ...next,
    ts: ensureTs(next.ts, existing?.ts ?? Date.now()),
    summary: cleanSummaryText(next.summary ?? existing?.summary ?? existing?.text ?? null),
    text: existing?.text ?? null,
  };

  // ensure a timestamp for sorting; default to "now" if missing
  const nextTs = typeof merged.ts === "number" ? merged.ts : Date.now();

  globalChats = [
    { ...merged, ts: nextTs },
    ...globalChats.filter((c) => c.chat_id !== merged.chat_id),
  ].sort((a, b) => b.ts - a.ts);
  notifyAll();
}

function notifyAll() {
  for (const set of subscribers) set([...globalChats]);
}

/* ---------------------------------------------------
   Utility: sanitize API + WS URLs
--------------------------------------------------- */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, ""); // remove trailing slashes
}

function normalizeToWs(url: string): string {
  if (url.startsWith("http://")) return url.replace("http://", "ws://");
  if (url.startsWith("https://")) return url.replace("https://", "wss://");
  return url.startsWith("ws") ? url : `wss://${url}`;
}

function makeWsUrl(baseUrl: string): string {
  const envWs = (import.meta as any)?.env?.VITE_WEB_SOCK_BASE_URL as string | undefined;
  const raw = envWs && envWs.trim()
    ? normalizeBaseUrl(envWs)
    : `${normalizeBaseUrl(baseUrl)}/chat-summary/ws`;

  return normalizeToWs(raw);
}

/* ---------------------------------------------------
   Hook: useChatSummaries
--------------------------------------------------- */
export function useChatSummaries({
  baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  persist = false,
}: UseChatSummariesOptions = {}) {
  const { deviceHash } = useSession();
  const [chats, setChats] = useState<ChatSummary[]>(globalChats);
  const [loading, setLoading] = useState<boolean>(globalChats.length === 0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------------------------------------------
    Subscription management
  --------------------------------------------------- */
  useEffect(() => {
    subscribers.add(setChats);
    return () => {
      subscribers.delete(setChats);
    };
  }, []);




  /* ---------------------------------------------------
    State helpers
  --------------------------------------------------- */
  const upsert = useCallback((msg: ChatSummary) => {
    // ensure a timestamp for sorting; default to "now" if missing
    const nextTs = typeof msg.ts === "number" ? msg.ts : Date.now();

    globalChats = [
      { ...msg, ts: nextTs },
      ...globalChats.filter((c) => c.chat_id !== msg.chat_id),
    ].sort((a, b) => b.ts - a.ts);
    notifyAll();
  }, []);

  const remove = useCallback((chatId: string) => {
    globalChats = globalChats.filter((c) => c.chat_id !== chatId);
    notifyAll();
  }, []);

  const clear = useCallback(() => {
    globalChats = [];
    notifyAll();
  }, []);

  /* ---------------------------------------------------
     Optional persistence
  --------------------------------------------------- */
  useEffect(() => {
    if (!persist) return;

    try {
      const saved = localStorage.getItem("ktulhu.chatSummaries");
      if (saved) {
        const parsed: ChatSummary[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          globalChats = parsed.sort((a, b) => b.ts - a.ts);
          notifyAll();
          console.log(" Restored chat summaries from localStorage");
        }
      }
    } catch (err) {
      console.warn("Failed to restore chat summaries:", err);
    }

    const save = () => {
      try {
        localStorage.setItem("ktulhu.chatSummaries", JSON.stringify(globalChats));
      } catch (err) {
        console.warn("Failed to persist chat summaries:", err);
      }
    };

    window.addEventListener("beforeunload", save);
    return () => window.removeEventListener("beforeunload", save);
  }, [persist]);

  /* ---------------------------------------------------
     Initial load via REST
  --------------------------------------------------- */
  useEffect(() => {
    let isMounted = true;

    const safeParse = (input: string): any => {
      try {
        const first = JSON.parse(input);
        if (typeof first === "string") {
          try {
            return JSON.parse(first);
          } catch {
            return first;
          }
        }
        return first;
      } catch {
        return input;
      }
    };

    const fromMessages = (thread: any): ChatSummary | null => {
      if (!thread) return null;
      const messages = Array.isArray(thread.messages) ? thread.messages : [];
      const chatId = thread.chat_id || messages[0]?.chat_id;

      if (!chatId) return null;

      const latestSummary = [...messages].reverse().find(
        (m) => m?.role === "summary" || m?.type === "summary"
      );
      const latestMsg = messages[messages.length - 1];

      const tsValue =
        Number(latestSummary?.ts) || Number(latestMsg?.ts) || Date.now();

      const summaryText = cleanSummaryText(latestSummary?.text ?? latestSummary?.summary ?? null);
      const text = summaryText ?? cleanSummaryText(latestMsg?.text ?? latestMsg?.summary ?? null);

      return {
        chat_id: chatId,
        summary: summaryText,
        text,
        ts: tsValue,
      };
    };

    const normalizeList = (items: any[]): ChatSummary[] => {
      const acc = new Map<string, ChatSummary>();

      for (const item of items) {
        let normalized: ChatSummary | null = null;

        if (item?.messages) {
          normalized = fromMessages(item);
        } else {
          normalized = normalizeSummaryPayload(item) ?? fromMessages(item);
        }

        if (normalized?.chat_id) {
          const existing = acc.get(normalized.chat_id);
          const merged: ChatSummary = existing
            ? {
                ...existing,
                ...normalized,
                ts: ensureTs(normalized.ts, existing.ts),
                summary: normalized.summary ?? existing.summary ?? existing.text ?? null,
                text: existing.text ?? null,
              }
            : normalized;

          acc.set(merged.chat_id, merged);
        }
      }

      return Array.from(acc.values());
    };

    const normalizeSnapshot = (payload: any): ChatSummary[] => {
      if (Array.isArray(payload?.chats)) return normalizeList(payload.chats);
      if (Array.isArray(payload)) return normalizeList(payload);
      if (payload?.messages && payload?.chat_id) return normalizeList([payload]);
      return [];
    };

    (async () => {
      if (isMounted) setLoading(true);

      try {
        const api = normalizeBaseUrl(baseUrl);
        const res = await fetch(`${api}/internal/chats/by-device/${deviceHash}`, {
          headers: { "Accept": "application/json" },
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

        let data = safeParse(text);
        if (typeof data === "string") data = safeParse(data);

        const list: ChatSummary[] = normalizeSnapshot(data);

        if (isMounted) {
          globalChats = list.sort((a, b) => b.ts - a.ts);
          notifyAll();
          console.log(` Loaded ${list.length} chats from snapshot`);
        }

        // Fetch missing summaries from /chat-thread/:id
        const needsSummary = list.filter((c) => !c.summary && !c.text);
        if (isMounted && needsSummary.length) {
          await Promise.all(
            needsSummary.map(async (chat) => {
              try {
                const threadRes = await fetch(`${api}/chat-thread/${chat.chat_id}`, {
                  headers: { Accept: "application/json" },
                });
                const threadText = await threadRes.text();
                if (!threadRes.ok) throw new Error(`HTTP ${threadRes.status}: ${threadText}`);

                let threadData = safeParse(threadText);
                if (typeof threadData === "string") threadData = safeParse(threadData);

                const normalized = normalizeSnapshot(threadData)[0];
                if (isMounted && normalized) {
                  upsert(normalized);
                }
              } catch (err) {
                console.warn(" Failed to fetch thread summary:", err);
              }
            })
          );
        }
      } catch (err) {
        console.error(" Failed to load chat summaries:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [baseUrl, deviceHash]);

  /* ---------------------------------------------------
     WebSocket (auto-reconnect)
  --------------------------------------------------- */
  useEffect(() => {
    let isMounted = true;

    const safeParse = (input: string): any => {
      try {
        const first = JSON.parse(input);
        if (typeof first === "string") {
          try {
            return JSON.parse(first);
          } catch {
            return first;
          }
        }
        return first;
      } catch {
        return input;
      }
    };

    function connectWS() {
      const wsUrl = makeWsUrl(baseUrl);
      console.log("Connecting WebSocket:", wsUrl);

      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
      } catch (e) {
        console.error(" Invalid WebSocket URL:", wsUrl, e);
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => console.log(" Connected to /chat-summary/ws");

      ws.onmessage = (event) => {
        try {
          const data = typeof event.data === "string" ? safeParse(event.data) : event.data;
          if (!data?.chat_id) return;

          // Handle summary-only WS messages
          if (data.type === "summary") {
            applyChatSummaryUpdate(data);
            return;
          }

          upsert(data);
        } catch (err) {
          console.error("Invalid WS message:", err, event.data);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        console.log(" WS closed, retrying in 5s...");
        reconnectTimer.current = setTimeout(connectWS, 5000);
      };

      ws.onerror = (err) => {
        console.warn(" WS error:", err);
        ws.close();
      };
    }

    connectWS();

    return () => {
      isMounted = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [baseUrl]);

  return { chats, upsert, remove, clear, loading };
}
