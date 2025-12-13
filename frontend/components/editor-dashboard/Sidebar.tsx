"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import LogoutConfirmation from "../LogoutConfirmation";

/* -----------------------------------------------------------
   EDITOR NAV STRUCTURE — CONTENT UNCHANGED
----------------------------------------------------------- */

const navGroups = [
  {
    label: "Workspace",
    items: [
      { name: "Dashboard", href: "/editor-dashboard" },
      { name: "Assigned Articles", href: "/editor-dashboard/assigned" },
      { name: "Review Queue", href: "/editor-dashboard/review-queue" },
      { name: "Version History", href: "/editor-dashboard/version-history" },
      { name: "Analytics", href: "/editor-dashboard/analytics" },
    ],
  },
  {
    label: "Profile & Tools",
    items: [
      { name: "Profile", href: "/editor-dashboard/profile" },
      { name: "Certificates", href: "/editor-dashboard/certificates" },
      { name: "Settings", href: "/editor-dashboard/settings" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
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
      <aside className="h-full p-5 flex flex-col border-r border-border">
        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Editorial Space — Editor
          </h2>
          <p className="text-sm text-muted-foreground">
            Article review & version control
          </p>
        </div>

        {/* NAV */}
        <nav className="flex-1 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground px-3 mb-1">
                {group.label}
              </p>

              {group.items.map((item) => {
                const isHome = item.href === "/editor-dashboard";
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
            </div>
          ))}
        </nav>

        {/* FOOTER ACTIONS */}
        <div className="pt-4 mt-6 border-t border-border space-y-2">
          <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-all">
            Editor Guidelines
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
