import React from "react";
import { useAuth } from "../context/AuthContext";
import { LoginPage } from "../pages/Login/LoginPage";

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) return <LoginPage />;

  return <>{children}</>;
};
