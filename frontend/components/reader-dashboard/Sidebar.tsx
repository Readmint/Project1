"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import LogoutConfirmation from "../LogoutConfirmation";

/* -----------------------------------------------------------
   READER NAV STRUCTURE — CONTENT UNCHANGED
----------------------------------------------------------- */

const nav = [
  { name: "Dashboard", href: "/reader-dashboard" },
  { name: "My Library", href: "/reader-dashboard/library" },
  { name: "Plans", href: "/reader-dashboard/plans" },
  { name: "Bookmarks", href: "/reader-dashboard/bookmarks" },
  { name: "Certificates", href: "/reader-dashboard/certificates" },
  { name: "Billing & Orders", href: "/reader-dashboard/billing" },
  { name: "Profile", href: "/reader-dashboard/profile" },
  { name: "Settings", href: "/reader-dashboard/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("reader_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      window.dispatchEvent(new Event("readerLogout"));
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      if (!localStorage.getItem("user")) {
        window.location.href = "/";
      }
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

  return (
    <>
      <aside className="h-full p-5 flex flex-col border-r border-border">
        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Reader Space
          </h2>
          <p className="text-sm text-muted-foreground">
            Reading, bookmarks & subscriptions
          </p>
        </div>

        {/* NAV */}
        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const isHome = item.href === "/reader-dashboard";
            const active = isHome
              ? pathname === item.href
              : pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg transition-all ${active
                    ? "bg-muted text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                  }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER ACTIONS */}
        <div className="pt-4 mt-6 border-t border-border space-y-2">
          <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-all">
            Reader Guidelines
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-all"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* LOGOUT CONFIRMATION */}
      {showLogoutConfirm && (
        <LogoutConfirmation
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
