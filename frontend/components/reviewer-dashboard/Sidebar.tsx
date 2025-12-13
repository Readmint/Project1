"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  ShieldAlert,
  MessageSquare,
  History,
  BarChart,
  Settings,
  BookOpen,
  LogOut,
  Menu,
} from "lucide-react";

import LogoutConfirmation from "../LogoutConfirmation";

/* -----------------------------------------------------------
      REVIEWER NAV STRUCTURE
----------------------------------------------------------- */

const navGroups = [
  {
    label: "Review Workspace",
    items: [
      { label: "Dashboard", path: "/reviewer-dashboard", icon: LayoutDashboard },
      { label: "Assigned Reviews", path: "/reviewer-dashboard/assigned", icon: ClipboardCheck },
      { label: "Review Workspace", path: "/reviewer-dashboard/workspace", icon: FileText }, // Could be dynamic
      { label: "Plagiarism Check", path: "/reviewer-dashboard/plagiarism", icon: ShieldAlert },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Feedback Center", path: "/reviewer-dashboard/feedback", icon: MessageSquare },
      { label: "Messages", path: "/reviewer-dashboard/messages", icon: MessageSquare }, // Reusing icon or finding another
    ],
  },
  {
    label: "Personal",
    items: [
      { label: "History & Logs", path: "/reviewer-dashboard/history", icon: History },
      { label: "Analytics", path: "/reviewer-dashboard/analytics", icon: BarChart },
      { label: "Guidelines", path: "/reviewer-dashboard/guidelines", icon: BookOpen }, // Added for symmetry
      { label: "Settings", path: "/reviewer-dashboard/settings", icon: Settings },
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
    window.dispatchEvent(new Event("reviewerLogout")); // Custom event if needed
    window.location.href = "/";
  };

  useEffect(() => {
    // Optional: Listen for storage changes to auto-logout across tabs
    const handleStorageChange = () => {
      if (!localStorage.getItem("user")) window.location.href = "/";
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-24 left-4 z-40 p-2 bg-indigo-600 text-white rounded-lg shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 
        border-r border-slate-200 dark:border-slate-700 shadow-xl transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 md:transform-none md:shadow-none md:border-r 
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Branding */}
        <div className="p-6 pb-2">
          <h2 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            ReadMint
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reviewer Dashboard
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6 flex-1 overflow-y-auto h-[calc(100vh-180px)] scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2 pl-4 font-semibold">
                {group.label}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  // Active state logic: exact match or sub-path match (except root dashboard)
                  const isActive = item.path === "/reviewer-dashboard"
                    ? pathname === item.path
                    : pathname.startsWith(item.path);

                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        router.push(item.path);
                        setOpen(false);
                      }}
                      className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 group
                        ${isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white"
                        }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-white"}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Confirm Logout Modal */}
      {showLogoutConfirm && (
        <LogoutConfirmation
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
