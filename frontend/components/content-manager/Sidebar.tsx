"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import LogoutConfirmation from "../LogoutConfirmation";

/* -----------------------------------------------------------
   CONTENT MANAGER NAV STRUCTURE — UNCHANGED
----------------------------------------------------------- */

const navGroups = [
  {
    label: "Workspace",
    items: [
      { name: "Dashboard", href: "/cm-dashboard" },
      { name: "Submissions", href: "/cm-dashboard/submissions" },
      { name: "Reviewer Assignments", href: "/cm-dashboard/reviewer-assignments" },
      { name: "Editor Assignments", href: "/cm-dashboard/editor-assignments" },
      { name: "Workflow Timeline", href: "/cm-dashboard/timeline" },
      { name: "Change Requests", href: "/cm-dashboard/change-requests" },
      { name: "Quality Check", href: "/cm-dashboard/quality-check" },
      { name: "Scheduling", href: "/cm-dashboard/scheduling" },
      { name: "Communication", href: "/cm-dashboard/communication" },
      { name: "Reports & Analytics", href: "/cm-dashboard/reports" },
    ],
  },
  {
    label: "Management",
    items: [
      { name: "Categories & Tags", href: "/cm-dashboard/categories" },
      { name: "Certificates", href: "/cm-dashboard/certificates" },
      { name: "Guidelines", href: "/cm-dashboard/guidelines" },
      { name: "Settings", href: "/cm-dashboard/settings" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("managerLogout"));
    window.location.href = "/";
  };

  useEffect(() => {
    const handleStorageChange = () => {
      if (!localStorage.getItem("user")) {
        window.location.href = "/";
      }
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
      <aside className="h-full p-5 flex flex-col border-r border-border">
        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            ReadMint — Content Manager
          </h2>
          <p className="text-sm text-muted-foreground">
            Workflow orchestration & quality oversight
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
                const isHome = item.href === "/cm-dashboard";
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
            CM Guidelines
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
