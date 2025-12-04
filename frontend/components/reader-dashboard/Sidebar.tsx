"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut as LogOutIcon,
  LayoutDashboard,
  BookMarked,
  Library,
  Award,
  Menu,
  X,
  Settings,
  User,
} from "lucide-react";
import LogoutConfirmation from "../LogoutConfirmation";
// If you have a firebase signOut helper in your firebase client, import it.
// import { firebaseSignOut } from "@/lib/firebaseClient";

const navItems = [
  { label: "Dashboard", path: "/reader-dashboard", icon: LayoutDashboard },
  { label: "My Library", path: "/reader-dashboard/library", icon: Library },
  { label: "Bookmarks", path: "/reader-dashboard/bookmarks", icon: BookMarked },
  { label: "Certificates", path: "/reader-dashboard/certificates", icon: Award },
  { label: "Profile", path: "/reader-dashboard/profile", icon: User },
  { label: "Settings", path: "/reader-dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      // If you use Firebase auth, sign out there as well (optional)
      // try { await firebaseSignOut(); } catch (e) { console.warn("Firebase signOut failed", e); }

      // Clear app storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // remove keys that start with "reader_"
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("reader_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      setOpen(false);
      setShowLogoutConfirm(false);

      // notify other windows/tabs
      window.dispatchEvent(new Event("readerLogout"));

      // redirect to home
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
      // still try to navigate home as fallback
      window.location.href = "/";
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const user = localStorage.getItem("user");
      if (!user) window.location.href = "/";
    };

    const handleReaderLogout = () => {
      window.location.href = "/";
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("readerLogout", handleReaderLogout);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("readerLogout", handleReaderLogout);
    };
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-lg shadow"
        aria-label="Open menu"
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
hidden md:flex flex-col w-64 bg-white dark:bg-slate-900
  border-r border-slate-200 dark:border-slate-700 shadow-lg
  sticky top-[80px] h-[calc(100vh-80px)] z-10
  transition-transform duration-300
  ${open ? "md:translate-x-0" : "md:translate-x-0"}
`}
      >
        {/* Close Button (Mobile) */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden absolute top-4 right-4 text-slate-800 dark:text-white"
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Branding */}
        <div className="p-6 pb-2">
          <h2 className="text-2xl font-bold text-indigo-600">Reader Space</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Reader Dashboard</p>
        </div>

        {/* Navigation */}
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
                  ${
                    active
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

        {/* Logout pinned at bottom */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all"
          >
            <LogOutIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <LogoutConfirmation
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
