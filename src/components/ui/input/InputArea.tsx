import React, { useState, useRef, useEffect } from "react";
import { StatusButton } from "./StatusButton";
import { useSocketContext } from "../../../context/SocketProvider";



export const InputArea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  onSend?: (finalPrompt: string) => void;   // <-- WS will use this
  placeholder?: string;
    disabled?: boolean;   // <-- ADD THIS
  className?: string;
}> = ({
  value,
  onChange,
  onKeyDown,
  onSend,
  placeholder,
  className = "",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addHandlers } = useSocketContext();

  const [status, setStatus] = useState<"idle" | "thinking">("idle");

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, window.innerHeight * 0.4)}px`;
  }, [value]);

  // WS lifecycle → start/stop spinner
  useEffect(() => {
    const remove = addHandlers({
      onToken: () => setStatus("thinking"),
      onDone: () => setStatus("idle"),
    });

    return () => {
      if (typeof remove === "function") remove();
    };
  }, [addHandlers]);

  // Send to WS
  const handleSend = () => {
    if (!value.trim() || status === "thinking") return;

    setStatus("thinking");

    const finalPrompt = value.trim();
    onSend?.(finalPrompt);      // <-- WS sendPrompt() happens in parent

    onChange("");               // clear input

    // Safety timeout (avoids stuck spinner)
    setTimeout(() => setStatus("idle"), 15000);
  };

  return (
    <div
      className={`
        relative flex items-end w-full border border-gray-300 dark:border-gray-700
        rounded-xl focus-within:ring-2 focus-within:ring-blue-500
        transition-all duration-150 ease-in-out ${className}
      `}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
          onKeyDown?.(e);
        }}
        placeholder={placeholder ?? "Type a message..."}
        rows={1}
        className="
          flex-1 resize-none rounded-xl p-3 text-base
          bg-transparent text-gray-900 dark:text-gray-100
          placeholder-gray-500 dark:placeholder-gray-400
          focus:outline-none min-h-[3rem] max-h-[40vh]
          overflow-hidden px-2
        "
        disabled={status === "thinking"}
      />

      <div className="absolute right-2 bottom-2 flex items-center">
        <StatusButton status={status} onClick={handleSend} />
      </div>
    </div>
  );
};
