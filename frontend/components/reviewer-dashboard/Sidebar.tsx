"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { name: "Dashboard", href: "/reviewer-dashboard" },
  { name: "Assigned Reviews", href: "/reviewer-dashboard/assigned" },
  { name: "Review Workspace", href: "/reviewer-dashboard/workspace" },
  { name: "Plagiarism Check", href: "/reviewer-dashboard/plagiarism" },
  { name: "Feedback Center", href: "/reviewer-dashboard/feedback" },
  { name: "Messages", href: "/reviewer-dashboard/messages" },
  { name: "History & Logs", href: "/reviewer-dashboard/history" },
  { name: "Analytics", href: "/reviewer-dashboard/analytics" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    alert("Logged out successfully (frontend only)");
    // later: clear auth + router.push(\"/login\")
  };

  return (
    <aside className="h-full p-5 flex flex-col">
      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          ReadMint — Reviewer
        </h2>
        <p className="text-sm text-muted-foreground">
          Content evaluation & quality control
        </p>
      </div>

      {/* NAV */}
      <nav className="flex-1 space-y-1">
        {nav.map((item) => {
          const isHome = item.href === "/reviewer-dashboard";

          const active = isHome
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

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
          Reviewer Guidelines
        </button>

        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-all"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
