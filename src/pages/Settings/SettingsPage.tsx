import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useSession } from "../../context/SessionContext";
import { LogOut, Shield, Mail, UserCircle, Smartphone } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { deviceHash } = useSession(); // ← ADD THIS

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="opacity-70">Not authenticated.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex justify-center p-6">
      <div
        className="
          w-full max-w-lg 
          bg-header-bg/70 dark:bg-header-bg-dark/70 
          text-app-text dark:text-app-text-dark
          border border-header-border dark:border-header-border-dark
          shadow-lg rounded-xl p-6 backdrop-blur-md
        "
      >
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Account Settings
        </h1>

        {/* User Info */}
        <div className="space-y-4">

          {/* Provider */}
          <div>
            <label className="text-sm opacity-70">Login Provider</label>
            <p className="text-lg font-medium capitalize">{user.provider}</p>
          </div>

          {/* Email */}
          {user.email && (
            <div>
              <label className="text-sm opacity-70">Email</label>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 opacity-50" />
                {user.email}
              </p>
            </div>
          )}

          {/* User ID */}
          <div>
            <label className="text-sm opacity-70">User ID</label>
            <p className="break-all flex items-center gap-2">
              <UserCircle className="w-4 h-4 opacity-50" />
              {user.id}
            </p>
          </div>

          {/* Device Hash */}
          <div>
            <label className="text-sm opacity-70">Device Hash</label>
            <p className="break-all flex items-center gap-2">
              <Smartphone className="w-4 h-4 opacity-50" />
              {deviceHash}
            </p>
          </div>

          {/* JWT */}
          {user.jwt && (
            <div>
              <label className="text-sm opacity-70">JWT Token</label>
              <pre className="mt-1 p-2 text-xs bg-black/20 dark:bg-white/10 rounded-md overflow-x-auto">
                {user.jwt.substring(0, 40)}...
              </pre>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={logout}
            className="
              flex items-center gap-2 px-4 py-2 rounded-md 
              bg-red-500 text-white 
              hover:bg-red-600 transition
            "   
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};
