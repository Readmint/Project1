"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Bell, Search, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,} from "@/components/ui/dropdown-menu";

export default function TopNavbar({ onSearch }: { onSearch: (v: string, scope: string) => void }) {
  const [value, setValue] = useState("");
  const [scope, setScope] = useState("All");
  const router = useRouter();

  const searchScopes = ["All", "Articles", "Authors", "Reviewers"];

  return (
    <nav className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-sm">

      {/* LEFT SECTION — SEARCH + SCOPE */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Search Scope Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            {scope}
            <ChevronDown size={14} className="ml-1" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-32">
            {searchScopes.map((item) => (
              <DropdownMenuItem
                key={item}
                onClick={() => {
                  setScope(item);
                  onSearch(value, item);
                }}
              >
                {item}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Input */}
        <div className="relative w-full max-w-[180px] sm:max-w-xs md:max-w-sm">
          <Input
            placeholder="Search"
            className="w-full bg-slate-100 dark:bg-slate-800 pl-9 sm:pl-10 border border-slate-300 dark:border-slate-600 text-xs sm:text-sm py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              onSearch(e.target.value, scope);
            }}
          />
          <Search
            className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none"
            size={16}
          />
        </div>
      </div>

      {/* RIGHT SECTION — NOTIFICATION DROPDOWN */}
      <DropdownMenu>
        <DropdownMenuTrigger className="relative">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform" />

          {/* Notification Badge */}
          <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-red-600 text-[9px] sm:text-xs text-white rounded-full px-1.5 py-0.5">
            5
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => router.push("/cm-dashboard/reviewer-assignments")}>
            New review assignment request
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => router.push("/cm-dashboard/editor-assignments")}>
            Editor finished editing a draft
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => router.push("/cm-dashboard/change-requests")}>
            Author submitted revisions
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => router.push("/cm-dashboard/scheduling")}>
            Upcoming scheduled publication
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-center text-indigo-600 cursor-pointer">
            View All Notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </nav>
  );
}
