"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenTool,
  FileText,
  CreditCard,
  User,
  Settings,
  LogOut,
  Menu,
  Info, // For Guidelines
  BookOpen
} from "lucide-react";

import LogoutConfirmation from "../LogoutConfirmation";

/* -----------------------------------------------------------
      AUTHOR NAV STRUCTURE — MATCHES CM DESIGN
----------------------------------------------------------- */

const navGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", path: "/author-dashboard", icon: LayoutDashboard },
      { label: "Submit Article", path: "/author-dashboard/submit", icon: PenTool },
      { label: "My Articles", path: "/author-dashboard/articles", icon: FileText },
      { label: "Subscription", path: "/author-dashboard/subscription", icon: CreditCard },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", path: "/author-dashboard/profile", icon: User },
      { label: "Settings", path: "/author-dashboard/settings", icon: Settings },
      { label: "Guidelines", path: "/guidelines", icon: BookOpen }, // Assuming guidelines is global
    ],
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check login presence matches CM logic
    const u = localStorage.getItem("user");
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch { }
    } else {
      // Redirect if not logged in (User request enforcement)
      window.location.href = "/";
    }

    const handleStorageChange = () => {
      if (!localStorage.getItem("user")) window.location.href = "/";
    };

    window.addEventListener("storage", handleStorageChange);
    // Listen for custom logout events if any
    window.addEventListener("userLogout", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userLogout", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("ACCESS_TOKEN");

    // Clear app specific keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("app_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    window.dispatchEvent(new Event("userLogout"));
    window.location.href = "/";
  };

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

        {/* Branding (Optional - CM has it, but Author layout has top nav. We can keep it or remove it. 
           CM Sidebar has it. I'll include it for consistency but maybe minimal since layout handles branded top bar differently?)
           Actually CM sidebar code I read has "MindRadix Content Manager Dashboard". 
           Author layout usually has a topbar too. I will match CM Sidebar exactly as requested.
        */}
        <div className="p-6 pb-2">
          <h2 className="text-2xl font-bold text-indigo-600">MindRadix</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Author Dashboard
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

                // Active logic from CM Sidebar
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
