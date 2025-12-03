"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Bell, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TopNavbar({ onSearch }: { onSearch: (v: string) => void }) {
  const [value, setValue] = useState("");
  const router = useRouter();

  return (
    <nav className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-sm">

      {/* Search Section */}
      <div className="relative w-full max-w-[220px] sm:max-w-xs md:max-w-sm">
        <Input
          placeholder="Search"
          className="w-full bg-slate-100 dark:bg-slate-800 pl-9 sm:pl-10 border border-slate-300 dark:border-slate-600 text-xs sm:text-sm py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onSearch(e.target.value);
          }}
        />
        
        {/* Search Icon */}
        <Search
          className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none"
          size={16}
        />
      </div>

      {/* Notification Bell */}
      <button className="ml-4 sm:ml-6 relative flex-shrink-0">
        <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform" />
        
        {/* Notification Badge */}
        <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-red-600 text-[9px] sm:text-xs text-white rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0">
          
        </span>
      </button>

    </nav>
  );
}
