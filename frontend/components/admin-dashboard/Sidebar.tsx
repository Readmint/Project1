"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutConfirmation from "../LogoutConfirmation";

const nav = [
  { name: "Dashboard Home", href: "/admin-dashboard" },
  { name: "User & Role Management", href: "/admin-dashboard/user-management" },
  { name: "Content Oversight", href: "/admin-dashboard/content-oversight" },
  { name: "Plagiarism Monitoring", href: "/admin-dashboard/plagiarism-monitoring" },
  { name: "Audit Logs", href: "/admin-dashboard/audit-logs" },
  { name: "Reports & Analytics", href: "/admin-dashboard/reports" },
  { name: "Incidents", href: "/admin-dashboard/incidents" },
  { name: "System Settings", href: "/admin-dashboard/system-settings" },
  { name: "Certificates", href: "/admin-dashboard/certificates" },
  { name: "Security", href: "/admin-dashboard/security" },
  { name: "Notifications", href: "/admin-dashboard/notifications" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    // frontend-only placeholder for consistency
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <>
      <aside className="h-full p-5 flex flex-col border-r border-border">
        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            ReadMint — Admin
          </h2>
          <p className="text-muted-foreground text-sm">
            Platform control & compliance
          </p>
        </div>

        {/* NAV */}
        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const isHome = item.href === "/admin-dashboard";

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
                    : "hover:bg-muted text-foreground"
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
            Support
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
