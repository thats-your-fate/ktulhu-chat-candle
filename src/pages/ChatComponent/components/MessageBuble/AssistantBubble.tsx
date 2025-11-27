import React from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface AssistantBubbleProps {
  content: string;
}

export const AssistantBubble: React.FC<AssistantBubbleProps> = ({ content }) => {
  const sanitize = (value: string): string => {
    if (!value) return "";
    let next = value;
    next = next.replace(/<\|im_end\|>/gi, ""); // strip template end tokens
    next = next.replace(/<\/s>/gi, ""); // strip model end markers
    next = next.replace(/^Topic\s+tag:\s*/i, ""); // drop topic tag prefix
    next = next.replace(/^\?\s*/, ""); // stray leading question mark
    return next.trim();
  };

  const safeContent = sanitize(content);
  return (
    <div

      className={`
        model-answer w-full text-base leading-relaxed px-2 md:px-6 py-3
        prose prose-sm max-w-none dark:prose-invert
        text-message-assistant-text dark:text-message-assistant-text-dark
        space-y-4
      `}
    >
        <MarkdownRenderer key={safeContent.length} content={safeContent} />

    </div>
  );
};
