"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutConfirmation from "../LogoutConfirmation";

const nav = [
  { name: "Dashboard", href: "/author-dashboard" },
  { name: "Submit Article", href: "/author-dashboard/submit" },
  { name: "My Articles", href: "/author-dashboard/articles" },
  { name: "Profile", href: "/author-dashboard/profile" },
  { name: "Settings", href: "/author-dashboard/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

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
      <aside className="h-full p-5 flex flex-col border-r border-border">
        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Writer Space — Author
          </h2>
          <p className="text-sm text-muted-foreground">
            Article submission & tracking
          </p>
        </div>

        {/* NAV */}
        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const isHome = item.href === "/author-dashboard";

            const active = isHome
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg transition-all ${
                  active
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
            Author Guidelines
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
