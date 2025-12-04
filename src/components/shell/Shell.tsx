import React, { useEffect, useMemo, useCallback, useState } from "react";
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
      SAFARI-FRIENDLY VIEWPORT HEIGHT
  -------------------------------------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const viewport = window.visualViewport;

    const updateVh = () => {
      const vh = (viewport?.height ?? window.innerHeight) * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    updateVh();

    viewport?.addEventListener("resize", updateVh);
    viewport?.addEventListener("scroll", updateVh);

    return () => {
      viewport?.removeEventListener("resize", updateVh);
      viewport?.removeEventListener("scroll", updateVh);
    };
  }, []);

  /* --------------------------------------------------------
      THEME
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
      ENDPOINT SWITCHER
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

  const navLinks = useMemo(
    () => [
      { path: "/", label: "Chat" },
      { path: "/settings", label: "Settings" },
      { path: "https://about.ktulhu.com", label: "About" },
      { path: "/logs", label: "Logs" }
    ],
    []
  );

  const MemoizedSidebar = useMemo(
    () => <ChatSidebar onSelectChat={id => console.log("Open chat:", id)} />,
    []
  );

  /* --------------------------------------------------------
      LAYOUT
  -------------------------------------------------------- */

  // Define header + footer heights for correct viewport calc
  const HEADER_HEIGHT = isMobile ? 48 : 64; // adjust if needed
  const FOOTER_HEIGHT = 40; // adjust if needed

  return (
  <>
    <div
      className="
        flex flex-col 
        h-screen 
        overflow-hidden 
        bg-app-bg dark:bg-app-bg-dark
        text-app-text dark:text-app-text-dark
        mx-auto
        max-w-[1280px]
        w-full
      "
      style={{
        height: "calc(var(--vh, 1vh) * 100)" // SAFE dynamic height
      }}
    >

        {/* HEADER */}
        {isMobile ? (
          <div
            className="flex items-center justify-between border-b border-header-border dark:border-header-border-dark
                       bg-header-bg dark:bg-header-bg-dark px-2"
            style={{ height: HEADER_HEIGHT }}
          >
            <ChatSidebarMobile onSelectChat={id => console.log("Open chat:", id)} />
          </div>
        ) : (
          <div style={{ height: HEADER_HEIGHT }}>
            <ShellHeaderDesktop
              location={location}
              navLinks={navLinks}
              endpoint={endpoint}
              onSwap={handleSwap}
              onToggleTheme={toggleTheme}
              theme={theme}
            />
          </div>
        )}

        {/* BODY */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* DESKTOP SIDEBAR */}
          {!isMobile && (
            <div className="hidden md:flex md:w-2/12 lg:w-2/12 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
              {MemoizedSidebar}
            </div>
          )}

          {/* MAIN CONTENT */}
          <main className="flex-1 overflow-hidden flex flex-col min-h-0">
            <Container
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* The ACTUAL RESIZING SCROLL AREA */}
              <div
                className="overflow-y-auto min-h-0"
                style={{
                  height: `calc((var(--vh, 1vh) * 100) - ${HEADER_HEIGHT}px - ${FOOTER_HEIGHT}px)`
                }}
              >
                <Outlet />
              </div>
            </Container>
          </main>
        </div>

        {/* FOOTER */}
        <footer
          className="
            flex-none 
            border-t border-header-border dark:border-header-border-dark
            bg-header-bg/70 dark:bg-header-bg-dark/70
            text-xs text-center
            flex items-center justify-center
          "
          style={{ height: FOOTER_HEIGHT }}
        >
          © {new Date().getFullYear()} Ktulhu-Project
        </footer>
      </div>
    </>
  );
});
