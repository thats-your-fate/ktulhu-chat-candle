import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Container } from "../ui/Container";
import { ShellHeaderDesktop } from "./ShellHeader";
import { getSocketEndpoint } from "../../utils/getSocketEndpoint";
import { useIsMobile } from "../../hooks/useIsMobile";
import { ChatSidebar } from "../chatSIdebar";
import { ChatSidebarMobile } from "../chatSIdebar/ChatSidebarMobile";

export const Shell: React.FC = React.memo(() => {
  const location = useLocation();
  const isMobile = useIsMobile(768);
  const [endpoint, setEndpoint] = useState(getSocketEndpoint());

  /* --------------------------------------------------------
      iOS / Safari-safe viewport height
  -------------------------------------------------------- */
  const [viewportHeight, setViewportHeight] = useState<number>(
    typeof window !== "undefined" ? window.innerHeight : 800
  );

  const [maxViewportHeight, setMaxViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!isMobile || typeof window === "undefined") return;

    const viewport = window.visualViewport;

    const update = () => {
      if (!viewport) return;

      // Force Safari to flush layout → avoids white gap
      void document.body.offsetHeight;

      const h = Math.round(viewport.height);
      setViewportHeight(h);

      setMaxViewportHeight(prev =>
        prev === null ? h : Math.max(prev, h)
      );
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [isMobile]);

  // amount covered by keyboard
  const keyboardOverlayHeight =
    isMobile && maxViewportHeight
      ? Math.max(0, maxViewportHeight - viewportHeight)
      : 0;

  /* --------------------------------------------------------
      Theme
  -------------------------------------------------------- */
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  /* --------------------------------------------------------
      Endpoint switching
  -------------------------------------------------------- */
  const handleSwap = useCallback(() => {
    const current =
      sessionStorage.getItem("ws_endpoint") ||
      localStorage.getItem("ws_endpoint") ||
      endpoint;

    const next = prompt("Enter WebSocket endpoint:", current);
    if (!next) return;

    try {
      sessionStorage.setItem("ws_endpoint", next);
    } catch {
      localStorage.setItem("ws_endpoint", next);
    }

    setEndpoint(next);
    window.location.reload();
  }, [endpoint]);

  /* --------------------------------------------------------
      Memoized navigation + sidebar
  -------------------------------------------------------- */
  const navLinks = useMemo(
    () => [
      { path: "/", label: "Chat" },
      { path: "/settings", label: "Settings" },
      { path: "https://about.ktulhu.com", label: "About" },
      { path: "/logs", label: "Logs" },
    ],
    []
  );

  const MemoizedSidebar = useMemo(
    () => <ChatSidebar onSelectChat={id => console.log("Open chat:", id)} />,
    []
  );

  /* --------------------------------------------------------
      Layout
  -------------------------------------------------------- */
  return (
    <>
      <div
        className="flex flex-col overflow-hidden bg-app-bg dark:bg-app-bg-dark text-app-text dark:text-app-text-dark"
        style={{
          height: isMobile ? `${viewportHeight}px` : "100vh",
          // ensures no white background ever shows
          backgroundColor: "var(--color-bg, #000)",
        }}
      >

        {/* Header */}
        {isMobile ? (
          <div className="flex items-center justify-between border-b border-header-border dark:border-header-border-dark bg-header-bg dark:bg-header-bg-dark px-2 py-2">
            <ChatSidebarMobile onSelectChat={id => console.log("Open chat:", id)} />
          </div>
        ) : (
          <ShellHeaderDesktop
            location={location}
            navLinks={navLinks}
            endpoint={endpoint}
            onSwap={handleSwap}
            onToggleTheme={toggleTheme}
            theme={theme}
          />
        )}

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Desktop sidebar */}
          {!isMobile && (
            <div className="hidden md:flex md:w-2/12 lg:w-2/12 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
              {MemoizedSidebar}
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-hidden flex flex-col min-h-0">
            <Container className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 flex flex-col">
                <Outlet />
              </div>
            </Container>
          </main>
        </div>

        {/* Footer */}
        <footer
          className="flex-none py-2 text-center text-xs border-t border-header-border bg-header-bg/70 dark:border-header-border-dark dark:bg-header-bg-dark/70"
        >
          © {new Date().getFullYear()} Ktulhu-Project
        </footer>
      </div>

      {/* Keyboard gap filler (always covers space Safari exposes) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 right-0 bottom-0 z-[9999]"
        style={{
          height: `${keyboardOverlayHeight}px`,
          backgroundColor: "var(--color-bg, #000)",
          transition: "height 120ms ease-out",
        }}
      />
    </>
  );
});
