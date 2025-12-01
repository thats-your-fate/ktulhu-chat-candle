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
  const [endpoint, setEndpoint] = useState(getSocketEndpoint());
  const isMobile = useIsMobile(768);
  const [mobileViewportHeight, setMobileViewportHeight] = useState<number | null>(null);
  const [maxViewportHeight, setMaxViewportHeight] = useState<number | null>(null);
  const [mobileViewportOffset, setMobileViewportOffset] = useState(0);
  const isiOS =
    typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const KEYBOARD_THRESHOLD = 120;
  const keyboardOffset =
    isiOS && mobileViewportOffset > 0 ? mobileViewportOffset : 0;
  const keyboardHeightReduced =
    mobileViewportHeight !== null &&
    maxViewportHeight !== null &&
    maxViewportHeight - mobileViewportHeight > KEYBOARD_THRESHOLD;
  // Some iOS versions just offset the viewport when the keyboard opens, so we also
  // treat a large top offset as a keyboard signal to avoid exposing the white body background.
  const keyboardVisible =
    isMobile &&
    (keyboardHeightReduced || (isiOS && mobileViewportOffset > KEYBOARD_THRESHOLD));
  const marginTopValue = keyboardOffset
    ? keyboardVisible
      ? keyboardOffset
      : -keyboardOffset
    : undefined;

  // Track the visible viewport height on mobile so the shell shrinks when
  // the browser UI or keyboard covers part of the screen.
  useEffect(() => {
    if (!isMobile || typeof window === "undefined") {
      setMobileViewportHeight(null);
      setMobileViewportOffset(0);
      return;
    }

    const viewport = window.visualViewport;

    const updateHeight = () => {
      const nextHeight = viewport?.height ?? window.innerHeight;
      setMobileViewportHeight(Math.round(nextHeight));
      setMobileViewportOffset(Math.round(viewport?.offsetTop ?? 0));
      setMaxViewportHeight((prev) =>
        prev === null ? Math.round(nextHeight) : Math.max(prev, Math.round(nextHeight))
      );
    };

    updateHeight();
    viewport?.addEventListener("resize", updateHeight);
    viewport?.addEventListener("scroll", updateHeight);
    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);

    return () => {
      viewport?.removeEventListener("resize", updateHeight);
      viewport?.removeEventListener("scroll", updateHeight);
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, [isMobile]);

  // Keep the document viewport height in sync with the visible viewport so the
  // body/root don't leave extra space below the keyboard.
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    if (!isMobile) {
      root.style.removeProperty("--app-viewport-height");
      return;
    }

    const nextHeight = mobileViewportHeight
      ? `${mobileViewportHeight}px`
      : "100dvh";

    root.style.setProperty("--app-viewport-height", nextHeight);

    return () => {
      root.style.removeProperty("--app-viewport-height");
    };
  }, [isMobile, mobileViewportHeight]);

  /* --------------------------------------------------------
      THEME (reactive + persistent)
  -------------------------------------------------------- */

  // Read initial theme safely
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "light" ? "light" : "dark";
  });

  // Apply theme on mount
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  /* --------------------------------------------------------
      Endpoint switcher
  -------------------------------------------------------- */
  const handleSwap = useCallback(() => {
    const current =
      sessionStorage.getItem("ws_endpoint") ||
      localStorage.getItem("ws_endpoint") ||
      endpoint;

    const next = prompt("Enter WebSocket endpoint:", current || endpoint);
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
      Navigation links
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

  /* --------------------------------------------------------
      Sidebar (memoized to avoid remounts)
  -------------------------------------------------------- */
  const MemoizedSidebar = useMemo(
    () => <ChatSidebar onSelectChat={(id) => console.log("Open chat:", id)} />,
    []
  );

  /* --------------------------------------------------------
      Layout
  -------------------------------------------------------- */
  return (
    <div
      className={`
        flex flex-col h-screen overflow-hidden box-border
        bg-app-bg text-app-text
        dark:bg-app-bg-dark dark:text-app-text-dark
      `}
      style={{
        height: isMobile
          ? mobileViewportHeight
            ? `${mobileViewportHeight}px`
            : "100dvh"
          : "100vh",
        paddingBottom: isiOS
          ? keyboardVisible
            ? 0
            : "env(safe-area-inset-bottom, 0px)"
          : undefined,
        marginTop: marginTopValue,
      }}
    >
      {/* Header */}
      {isMobile ? (
        <div className="flex items-center justify-between border-b border-header-border dark:border-header-border-dark bg-header-bg dark:bg-header-bg-dark px-2 py-2">
        <ChatSidebarMobile onSelectChat={(id) => console.log("Open chat:", id)} /> 
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

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop sidebar */}
        {!isMobile && (
          <div className="hidden md:flex md:w-2/12 lg:w-2/12 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
             {MemoizedSidebar}
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Container className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col">
              <Outlet /> {/* Routes render here */}
            </div>
          </Container>
        </main>
      </div>

      {/* Footer */}
      <footer
        className={`
    flex-none py-2 sm:py-4 text-center text-xs border-t 
    border-header-border bg-header-bg/70 text-footer-text 
    dark:border-header-border-dark dark:bg-header-bg-dark/70 dark:text-footer-text-dark
  `}
      >
        © {new Date().getFullYear()} Ktulhu-Project
      </footer>

    </div>
  );
});
