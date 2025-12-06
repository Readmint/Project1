"use client";

import Sidebar from "@/components/editor-dashboard/Sidebar";
import TopNavbar from "@/components/editor-dashboard/TopNavbar";
import { useState } from "react";
import ChatbotAuthor from "@/components/author-dashboard/chatbotAuthor";

export default function EditorDashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarWidth = 256; // w-64 = 256px
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white">      

      {/* ✅ Sidebar + Content Row */}
      <div className="flex flex-1 relative">

        {/* ✅ Sidebar starts below universal Navbar and stretches naturally */}
        <div className="hidden md:block w-64 border-r border-slate-200 dark:border-slate-700">
          <Sidebar />
        </div>

        {/* ✅ Main Content Area */}
        <div className="flex flex-col flex-1">

          {/* ✅ Top navbar now placed BELOW the universal Navbar and VISIBLE */}
          <header
            className="fixed h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow z-20"
            style={{
              top: 64, // universal Navbar height
              left: sidebarWidth,
              right: 0,
              width: `calc(100% - ${sidebarWidth}px)`
            }}
          >
            <TopNavbar onSearch={(v: string) => setSearch(v)} />
          </header>

          {/* ✅ Scrollable Dashboard Content */}
          <main className="flex-1 overflow-y-auto pt-20 pb-24 px-2">
            {children}
          </main>
        </div>
      </div>

      {/* ✅ ensures nothing visually hits footer too early */}
      <div className="h-2"></div>
      <ChatbotAuthor 
              // No config prop needed - the component handles everything internally
              className="z-50"
            />

    </div>
  );
}
