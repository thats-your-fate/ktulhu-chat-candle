// src/pages/Login/LoginPage.tsx
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Mail } from "lucide-react";
import { BrandIcon } from "../../components/BrandIcon";
import { KtulhuLoader } from "../../components/KtulhuLoader";
import { TypewriterText } from "../../components/TypewriterText";
import { GoogleLogin } from "@react-oauth/google";

export const LoginPage: React.FC = () => {
  const { loginAnonymous, loginGoogle, loginApple, loginFacebook } = useAuth();

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
            className="flex items-center gap-3 w-full p-3 rounded-md bg-chat-item-bg dark:bg-chat-item-bg-dark text-chat-item-text dark:text-chat-item-text-dark border border-header-border/50 dark:border-header-border-dark/50 transition hover:opacity-80"
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
            className="flex items-center gap-3 w-full p-3 rounded-md bg-chat-item-bg dark:bg-chat-item-bg-dark text-chat-item-text dark:text-chat-item-text-dark border border-header-border/50 dark:border-header-border-dark/50 transition hover:opacity-80"
          >
            <BrandIcon name="apple" size={20} />
            <span className="flex-1 text-left">Continue with Apple</span>
          </button>

          <button
  onClick={() => {
    // Trigger FB popup
    window.FB.login((response: any) => {
      if (response.authResponse?.accessToken) {
        loginFacebook(response.authResponse.accessToken);
      } else {
        console.error("FB login canceled");
      }
    }, { scope: "email,public_profile" });
  }}
  className="flex items-center gap-3 w-full p-3 rounded-md bg-chat-item-bg dark:bg-chat-item-bg-dark text-chat-item-text dark:text-chat-item-text-dark border border-header-border/50 dark:border-header-border-dark/50 transition hover:opacity-80"
>
  <BrandIcon name="facebook" size={20} />
  <span className="flex-1 text-left">Continue with Facebook</span>
</button>


          {/* Email placeholder */}
          <button
            onClick={() => console.log("TODO: email auth")}
            className="flex items-center gap-3 w-full p-3 rounded-md bg-chat-item-bg dark:bg-chat-item-bg-dark text-chat-item-text dark:text-chat-item-text-dark border border-header-border/50 dark:border-header-border-dark/50 transition hover:opacity-80"
          >
            <Mail className="w-5 h-5 opacity-80" />
            <span className="flex-1 text-left">Continue with Email</span>
          </button>
        </div>
      </div>
    </div>
  );
};
