import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChatPage from "./pages/ChatComponent/ChatPage";
import { Shell } from "./components/shell";
import { SocketProvider } from "./context/SocketProvider";
import { SessionProvider } from "./context/SessionContext";
import { Seo } from "./components/Seo";
import { ChatStoreProvider } from "./context/ChatStoreContext";
import { LogsPage } from "./pages/logsPage/logsPage";
import { SettingsPage } from "./pages/Settings/SettingsPage";

import { AuthProvider } from "./context/AuthContext";
import { AuthGate } from "./components/AuthGate";

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function App() {
  return (
    <BrowserRouter>
      <Seo />

      {/* IMPORTANT: Google provider MUST wrap AuthProvider */}
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <SessionProvider>
            <AuthGate>
              <ChatStoreProvider>
                <SocketProvider>
                  <Routes>
                    <Route element={<Shell />}>
                      <Route
                        path="/"
                        element={
                          <>
                            <Seo path="/" title="Ktulhu Chat" />
                            <ChatPage />
                          </>
                        }
                      />

                      <Route
                        path="/chat/:chatId"
                        element={
                          <>
                            <Seo path="/chat" title="Chat Thread" />
                            <ChatPage />
                          </>
                        }
                      />

<Route path="/settings" element={<SettingsPage />} />

                      <Route path="/about" element={<div>About</div>} />

                      <Route path="/logs" element={<LogsPage />} />
                    </Route>
                  </Routes>
                </SocketProvider>
              </ChatStoreProvider>
            </AuthGate>
          </SessionProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
}
