// src/pages/Login/LoginPage.tsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Mail } from "lucide-react";
import { BrandIcon } from "../../components/BrandIcon";
import { KtulhuLoader } from "../../components/KtulhuLoader";
import { TypewriterText } from "../../components/TypewriterText";
import { GoogleLogin } from "@react-oauth/google";

export const LoginPage: React.FC = () => {
  const {
    loginAnonymous,
    loginGoogle,
    loginApple,
    loginFacebook,
    loginEmail,
    registerEmail,
  } = useAuth();

  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAppleLogin = async () => {
    const clientId = import.meta.env.VITE_APPLE_CLIENT_ID as string;
    const redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI as string;

    if (!window.AppleID) {
      console.error("AppleID JS SDK not loaded");
      return;
    }

    window.AppleID.auth.init({
      clientId,
      scope: "name email",
      redirectURI,
      usePopup: true, // important for SPA
    });

    try {
      const response = await window.AppleID.auth.signIn();
      const idToken = response.authorization.id_token;
      if (!idToken) {
        console.error("No id_token from Apple");
        return;
      }
      await loginApple(idToken);
    } catch (err) {
      console.error("Apple login failed:", err);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        await registerEmail(email, password);
      } else {
        await loginEmail(email, password);
      }
      // If successful, context will update & page will redirect based on your routing
    } catch (err: any) {
      setError(err?.message ?? "Email authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full bg-app-bg dark:bg-app-bg-dark text-app-text dark:text-app-text-dark px-6 py-10">
      <div className="w-full max-w-sm flex flex-col items-center bg-header-bg/70 dark:bg-header-bg-dark/70 backdrop-blur-md border border-header-border dark:border-header-border-dark rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-2">
          <div className="flex items-center gap-3">
            <KtulhuLoader size={40} className="opacity-90" />
            <div className="text-3xl font-bold tracking-tight">
              <TypewriterText text="Ktulhu Ai" speed={80} />
            </div>
          </div>
          <p className="text-sm opacity-70">Choose how you want to continue</p>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3 mt-4">
          {/* Anonymous */}
          <button
            onClick={loginAnonymous}
            className="  flex items-center gap-3 w-full h-10 px-3
  rounded box-border
  font-sans text-[14px] tracking-[0.25px]
  select-none appearance-none
  transition-colors duration-200 hover:opacity-80


  bg-white text-[#3c4043] border border-[#dadce0]


  dark:bg-chat-item-bg-dark 
  dark:text-chat-item-text-dark 
  dark:border-header-border-dark/50"
          >
            <User className="w-5 h-5 opacity-80" />
            <span className="flex-1 text-left">Continue anonymously</span>
          </button>

          {/* Google */}
          <GoogleLogin
            onSuccess={(res) => {
              if (res.credential) loginGoogle(res.credential);
            }}
            onError={() => console.log("Google login failed")}
          />

          {/* Apple */}
          <button
            onClick={handleAppleLogin}
            className="  flex items-center gap-3 w-full h-10 px-3
  rounded box-border
  font-sans text-[14px] tracking-[0.25px]
  select-none appearance-none
  transition-colors duration-200 hover:opacity-80


  bg-white text-[#3c4043] border border-[#dadce0]


  dark:bg-chat-item-bg-dark 
  dark:text-chat-item-text-dark 
  dark:border-header-border-dark/50"
          >
            <BrandIcon name="apple" size={20} />
            <span className="flex-1 text-left">Continue with Apple</span>
          </button>

          {/* Email: toggle + form */}
          <button
            onClick={() => setEmailOpen((prev) => !prev)}
            className="  flex items-center gap-3 w-full h-10 px-3
  rounded box-border
  font-sans text-[14px] tracking-[0.25px]
  select-none appearance-none
  transition-colors duration-200 hover:opacity-80


  bg-white text-[#3c4043] border border-[#dadce0]


  dark:bg-chat-item-bg-dark 
  dark:text-chat-item-text-dark 
  dark:border-header-border-dark/50"
          >
            <Mail className="w-5 h-5 opacity-80" />
            <span className="flex-1 text-left">
              {emailOpen ? "Hide email form" : "Continue with Email"}
            </span>
          </button>

          {emailOpen && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2 mt-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-2 rounded-md bg-app-bg/70 dark:bg-app-bg-dark/70 border border-header-border/50 dark:border-header-border-dark/50 text-sm"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-2 rounded-md bg-app-bg/70 dark:bg-app-bg-dark/70 border border-header-border/50 dark:border-header-border-dark/50 text-sm"
              />

              {error && (
                <p className="text-xs text-red-500 mt-1">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="  flex items-center gap-3 w-full h-10 px-3
  rounded box-border
  font-sans text-[14px] tracking-[0.25px]
  select-none appearance-none
  transition-colors duration-200 hover:opacity-80


  bg-white text-[#3c4043] border border-[#dadce0]


  dark:bg-chat-item-bg-dark 
  dark:text-chat-item-text-dark 
  dark:border-header-border-dark/50"
              >
                {isSubmitting
                  ? isRegisterMode
                    ? "Creating account..."
                    : "Signing in..."
                  : isRegisterMode
                    ? "Create account"
                    : "Sign in"}
              </button>

              <button
                type="button"
                onClick={() => setIsRegisterMode((prev) => !prev)}
                className="  flex items-center gap-3 w-full h-10 px-3
  rounded box-border
  font-sans text-[14px] tracking-[0.25px]
  select-none appearance-none
  transition-colors duration-200 hover:opacity-80


  bg-white text-[#3c4043] border border-[#dadce0]


  dark:bg-chat-item-bg-dark 
  dark:text-chat-item-text-dark 
  dark:border-header-border-dark/50"
              >
                {isRegisterMode
                  ? "Already have an account? Sign in"
                  : "Need an account? Register"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
