"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Users, FileEdit, GitBranch, RefreshCw, ShieldCheck, CalendarDays, MessageCircle, BarChart2, Tags, Award, BookText, Settings, LogOut, Menu, X, } from "lucide-react";

import LogoutConfirmation from "../LogoutConfirmation";

/* -----------------------------------------------------------
      CONTENT MANAGER NAV STRUCTURE — MATCHES SRS
----------------------------------------------------------- */

const navGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", path: "/cm-dashboard", icon: LayoutDashboard },
      { label: "Submissions", path: "/cm-dashboard/submissions", icon: ClipboardList },
      { label: "Reviewer Assignments", path: "/cm-dashboard/reviewer-assignments", icon: Users },
      { label: "Editor Assignments", path: "/cm-dashboard/editor-assignments", icon: FileEdit },
      { label: "Workflow Timeline", path: "/cm-dashboard/timeline", icon: GitBranch },
      { label: "Change Requests", path: "/cm-dashboard/change-requests", icon: RefreshCw },
      { label: "Quality Check", path: "/cm-dashboard/quality-check", icon: ShieldCheck },
      { label: "Scheduling", path: "/cm-dashboard/scheduling", icon: CalendarDays },
      { label: "Communication", path: "/cm-dashboard/communication", icon: MessageCircle },
      { label: "Reports & Analytics", path: "/cm-dashboard/reports", icon: BarChart2 },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Categories & Tags", path: "/cm-dashboard/categories", icon: Tags },
      { label: "Certificates", path: "/cm-dashboard/certificates", icon: Award },
      { label: "Guidelines", path: "/cm-dashboard/guidelines", icon: BookText },
      { label: "Settings", path: "/cm-dashboard/settings", icon: Settings },
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
    window.dispatchEvent(new Event("managerLogout"));
    window.location.href = "/";
  };

  useEffect(() => {
    const handleStorageChange = () => {
      if (!localStorage.getItem("user")) window.location.href = "/";
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("managerLogout", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("managerLogout", handleStorageChange);
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
            Content Manager Dashboard
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
                const active = pathname === item.path;

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