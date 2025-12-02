"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, Send, FileText, User, Settings, Menu, X } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/author-dashboard", icon: LayoutDashboard },
  { label: "Submit Article", path: "/author-dashboard/submit", icon: Send },
  { label: "My Articles", path: "/author-dashboard/articles", icon: FileText },
  { label: "Profile", path: "/author-dashboard/profile", icon: User },
  { label: "Settings", path: "/author-dashboard/settings", icon: Settings }
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
        className={`
          fixed md:relative left-0 w-64 bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-700 shadow-lg
          transform transition-transform duration-300 z-40
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          min-h-full flex flex-col   /* ✅ allows sidebar to extend to footer */
        `}
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
          <h2 className="text-2xl font-bold text-indigo-600">Writer Space</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Author Dashboard</p>
        </div>

        {/* Nav Section */}
        <nav className="p-6 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;

            return (
              <button
                key={item.label}
                onClick={() => {
                  router.push(item.path);
                  setOpen(false);
                }}
                className={`
                  flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all
                  ${active
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-700 dark:text-white hover:bg-indigo-50 dark:hover:bg-slate-800"
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ✅ Logout Button pinned to bottom */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>

      </aside>
    </>
  );
}
