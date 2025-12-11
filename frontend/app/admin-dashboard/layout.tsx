// app/admin-dashboard/layout.tsx
"use client";

import Sidebar from "@/components/admin-dashboard/Sidebar";
import TopNavbar from "@/components/admin-dashboard/TopNavbar";
import { ReactNode } from "react";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const sidebarWidth = 256;

  return (
    <div className="flex flex-col bubble-bg bg-background text-foreground min-h-screen">
      <div className="flex flex-1 relative">
        <div className="hidden md:block w-64 border-r border-border bg-card">
          <Sidebar />
        </div>

        <div className="flex flex-col flex-1">
          <header
            className="fixed h-16 bg-background border-b border-border shadow-sm z-20"
            style={{
              top: 64,
              left: sidebarWidth,
              right: 0,
              width: `calc(100% - ${sidebarWidth}px)`,
            }}
          >
            <TopNavbar />
          </header>

          <main className="flex-1 overflow-y-auto pt-20 pb-24">
            <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
