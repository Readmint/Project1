"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut,
  LayoutDashboard,
  ClipboardList,
  Inbox,
  History,
  User,
  Settings,
  Wrench,
  Menu,
  X,
  Award,
  BarChart2,
} from "lucide-react";
import LogoutConfirmation from "../LogoutConfirmation";

/* -----------------------------------------------------------
    OPTIMIZED NAV STRUCTURE
----------------------------------------------------------- */

const navGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", path: "/editor-dashboard", icon: LayoutDashboard },
      { label: "Assigned Articles", path: "/editor-dashboard/assigned", icon: ClipboardList },
      { label: "Review Queue", path: "/editor-dashboard/review-queue", icon: Inbox },
      { label: "Version History", path: "/editor-dashboard/version-history", icon: History },
      { label: "Analytics", path: "/editor-dashboard/analytics", icon: BarChart2 },
    ],
  },
  {
    label: "Profile & Tools",
    items: [
      { label: "Profile", path: "/editor-dashboard/profile", icon: User },
      { label: "Certificates", path: "/editor-dashboard/certificates", icon: Award },
      { label: "Settings", path: "/editor-dashboard/settings", icon: Wrench },
    ],
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("editorLogout"));
    window.location.href = "/";
  };

  useEffect(() => {
    const handleStorageChange = () => {
      if (!localStorage.getItem("user")) window.location.href = "/";
    };

    const handleEditorLogout = () => {
      window.location.href = "/";
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("editorLogout", handleEditorLogout);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("editorLogout", handleEditorLogout);
    };
  }, []);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-lg shadow"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 
        border-r border-slate-200 dark:border-slate-700 shadow-lg
        sticky top-[80px] h-[calc(100vh-80px)] z-10 transition-transform`}
      >
        {/* Close Button (Mobile) */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden absolute top-4 right-4 text-slate-800 dark:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Branding */}
        <div className="p-6 pb-2">
          <h2 className="text-2xl font-bold text-indigo-600">Editorial Space</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Editor Dashboard
          </p>
        </div>

        {/* Navigation Groups */}
        <nav className="p-6 space-y-6 flex-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2 pl-4">
                {group.label}
              </p>

              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path;

                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      router.push(item.path);
                      setOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all
                    ${
                      active
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-700 dark:text-white hover:bg-indigo-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout Section */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <LogoutConfirmation
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
