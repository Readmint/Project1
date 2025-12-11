// components/admin-dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <nav className="h-full p-5 space-y-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">ReadMint — Admin</h2>
        <p className="text-muted-foreground text-sm">Platform control & compliance</p>
      </div>

      <div className="space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg transition-all ${active ? "bg-muted text-primary font-medium" : "hover:bg-muted text-foreground"}`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted">Support</button>
      </div>
    </nav>
  );
}
