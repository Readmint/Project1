"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileEdit,
  ClipboardList,
  GitBranch,
  BarChart2,
  MessageCircle,
  User,
  Award,
  Settings,
  LogOut,
  Menu,
  BookText
} from "lucide-react";

import LogoutConfirmation from "../LogoutConfirmation";

/* -----------------------------------------------------------
   EDITOR NAV STRUCTURE
----------------------------------------------------------- */

const navGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", path: "/editor-dashboard", icon: LayoutDashboard },
      { label: "Assigned Articles", path: "/editor-dashboard/assigned", icon: FileEdit },
      { label: "Review Queue", path: "/editor-dashboard/review-queue", icon: ClipboardList },
      { label: "Version History", path: "/editor-dashboard/version-history", icon: GitBranch },
      { label: "Analytics", path: "/editor-dashboard/analytics", icon: BarChart2 },
      { label: "Communications", path: "/editor-dashboard/communications", icon: MessageCircle },
    ],
  },
  {
    label: "Profile & Tools",
    items: [
      { label: "Profile", path: "/editor-dashboard/profile", icon: User },
      { label: "Certificates", path: "/editor-dashboard/certificates", icon: Award },
      { label: "Guidelines", path: "/editor-dashboard/guidelines", icon: BookText },
      { label: "Settings", path: "/editor-dashboard/settings", icon: Settings },
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
      if (!localStorage.getItem("user")) {
        window.location.href = "/";
      }
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

      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 
  border-r border-slate-200 dark:border-slate-700 shadow-lg
  sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto scrollbar-thin z-10"
      >

        {/* Branding */}
        <div className="p-6 pb-2">
          <h2 className="text-2xl font-bold text-indigo-600">ReadMint</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Editor Dashboard
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-6 space-y-6 flex-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2 pl-4">
                {group.label}
              </p>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isHome = item.path === "/editor-dashboard";
                const active = isHome
                  ? pathname === item.path
                  : pathname === item.path || pathname.startsWith(item.path + "/");

                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      router.push(item.path);
                      setOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all
                      ${active
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

        {/* Logout */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Confirm Logout */}
      {showLogoutConfirm && (
        <LogoutConfirmation
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
