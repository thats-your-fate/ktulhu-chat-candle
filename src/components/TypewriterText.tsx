import React, { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  speed?: number;      
  className?: string;
};

export const TypewriterText: React.FC<Props> = ({
  text,
  speed = 70,
  className = "",
}) => {
  const safeText = typeof text === "string" ? text : "";
  const [display, setDisplay] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset before typing
    setDisplay("");
    setDone(false);
    indexRef.current = 0;

    if (!safeText) return;

    // A SINGLE interval – StrictMode-safe
    timerRef.current = window.setInterval(() => {
      const i = indexRef.current;

      if (i < safeText.length) {
        setDisplay((prev) => prev + safeText[i]);
        indexRef.current += 1;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        setDone(true);
      }
    }, speed);

    // Cleanup cancels ALL timers immediately
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [safeText, speed]);

  return (
    <span className={className}>
      {display}
      {!done && "▌"}
    </span>
  );
};
