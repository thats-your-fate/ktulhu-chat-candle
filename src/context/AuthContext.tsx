// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "../context/SessionContext";

export type AuthProviderType = "anonymous" | "google" | "apple" | "facebook" | "email";


export type AuthUser = {
  id: string;
  email?: string;
  provider: AuthProviderType;
  jwt?: string; // backend JWT
};

type AuthContextType = {
  user: AuthUser | null;
  loginAnonymous: () => void;
  loginGoogle: (idToken: string) => Promise<void>;
  loginApple: (idToken: string) => Promise<void>;
    loginFacebook: (idToken: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "ktulhu_auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const { deviceHash } = useSession();  // <-- GET IT HERE
  // -----------------------------
  // Load persisted user on startup
  // -----------------------------
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch {
        console.warn("Invalid auth data in localStorage, clearing...");
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save to storage whenever user changes
  const persist = (u: AuthUser | null) => {
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
    setUser(u);
  };

  const loginAnonymous = () => {
    const anonUser: AuthUser = {
      id: "anon-" + crypto.randomUUID(),
      provider: "anonymous",
    };
    persist(anonUser);
  };

  const loginGoogle = async (idToken: string) => {
    const res = await fetch("http://localhost:3000/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json",  "X-Device-Hash": deviceHash, },
    body: JSON.stringify({
      id_token: idToken,
      device_hash: deviceHash,
    }),
    });

    if (!res.ok) {
      console.error("Google login failed");
      return;
    }

    const data = await res.json();
    const newUser: AuthUser = {
      id: data.user_id,
      email: data.email,
      provider: "google",
      jwt: data.jwt,
    };
    persist(newUser);
  };

  const loginApple = async (idToken: string) => {
    const res = await fetch("http://localhost:3000/api/auth/apple", {
      method: "POST",
      headers: { "Content-Type": "application/json",  "X-Device-Hash": deviceHash, },
    body: JSON.stringify({
      id_token: idToken,
      device_hash: deviceHash,
    }),
    });

    if (!res.ok) {
      console.error("Apple login failed");
      return;
    }

    const data = await res.json();
    const newUser: AuthUser = {
      id: data.user_id,
      email: data.email,
      provider: "apple",
      jwt: data.jwt,
    };
    persist(newUser);
  };


  const loginFacebook = async () => {
  return new Promise<void>((resolve, reject) => {
    if (!window.FB) {
      console.error("FB SDK not loaded");
      return reject();
    }

    window.FB.login(
      async (response: any) => {
        if (!response.authResponse) {
          console.error("Facebook login failed");
          return reject();
        }

        const { accessToken } = response.authResponse;

        // Send token to backend
        const res = await fetch("http://localhost:3000/api/auth/facebook", {
          method: "POST",
          headers: { "Content-Type": "application/json",  "X-Device-Hash": deviceHash, },
  body: JSON.stringify({
    access_token: accessToken,
    device_hash: deviceHash,
  }),
        });

        if (!res.ok) {
          console.error("FB backend login failed");
          return reject();
        }

        const data = await res.json();

        setUser({
          id: data.user_id,
          email: data.email,
          provider: "facebook",
          jwt: data.jwt,
        });

        resolve();
      },
      { scope: "public_profile,email" }
    );
  });
};



  const logout = () => {
    persist(null);
  };

  return (
    <AuthContext.Provider
value={{ user, loginAnonymous, loginGoogle, loginApple, loginFacebook, logout }}

    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
