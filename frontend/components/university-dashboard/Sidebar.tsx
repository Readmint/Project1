"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { name: "Dashboard Home", href: "/university-dashboard" },
  { name: "Events", href: "/university-dashboard/events" },
  { name: "Submissions", href: "/university-dashboard/submissions" },
  { name: "Review & Plagiarism", href: "/university-dashboard/review" },
  { name: "Editing & Design", href: "/university-dashboard/editing" },
  { name: "Final Outputs", href: "/university-dashboard/final-outputs" },
  { name: "Publishing", href: "/university-dashboard/publishing" },
  { name: "Billing & Profile", href: "/university-dashboard/billing-profile" },
];

export default function UniversitySidebar() {
  const pathname = usePathname();

  return (
    <nav className="h-full p-5 space-y-4">
      
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          ReadMint — University
        </h2>
        <p className="text-muted-foreground text-sm">
          Event workflow & submissions
        </p>
      </div>

      {/* NAV ITEMS */}
      <div className="space-y-1">
        {nav.map((item) => {
          const isHome = item.href === "/university-dashboard";

          const active = isHome
            ? pathname === "/university-dashboard"
            : pathname === item.href || pathname.startsWith(item.href + "/");

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
      </div>

      {/* FOOTER / SUPPORT */}
      <div className="mt-6 pt-4 border-t border-border">
        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted">
          Support
        </button>
      </div>
    </nav>
  );
}
