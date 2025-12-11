"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Bell, Search, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function TopNavbar({
  onSearch,
}: {
  onSearch: (v: string, scope: string) => void;
}) {
  const [value, setValue] = useState("");
  const [scope, setScope] = useState("All");
  const router = useRouter();

  const searchScopes = ["All", "Articles", "Authors", "Reviewers"];

  return (
    <nav
      className="
        w-full flex items-center justify-between
        bg-background text-foreground
        border-b border-border
        px-4 sm:px-6 lg:px-8 py-3 sm:py-4
        shadow-sm
        backdrop-blur-xl
      "
    >
      {/* LEFT SECTION — SEARCH + SCOPE */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Search Scope Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="
              flex items-center
              bg-muted text-foreground
              border border-border
              text-xs sm:text-sm
              px-2 sm:px-3 py-2
              rounded-[var(--radius)]
              hover:bg-muted/80
              transition-all
            "
          >
            {scope}
            <ChevronDown size={14} className="ml-1 opacity-70" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="w-32 bg-card text-card-foreground shadow-lg border border-border"
          >
            {searchScopes.map((item) => (
              <DropdownMenuItem
                key={item}
                onClick={() => {
                  setScope(item);
                  onSearch(value, item);
                }}
                className="cursor-pointer hover:bg-muted hover:text-foreground"
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
            className="
              w-full
              bg-muted text-foreground
              pl-9 sm:pl-10
              border border-border
              text-xs sm:text-sm py-2
              rounded-[var(--radius)]
              transition-all
              focus:outline-none
              focus:ring-2 focus:ring-primary
            "
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              onSearch(e.target.value, scope);
            }}
          />
          <Search
            className="
              absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2
              text-muted-foreground
              pointer-events-none
            "
            size={16}
          />
        </div>
      </div>

      {/* RIGHT SECTION — NOTIFICATION MENU */}
      <DropdownMenu>
        <DropdownMenuTrigger className="relative group">
          <Bell
            className="
              h-5 w-5 sm:h-6 sm:w-6
              text-primary
              transition-transform
              group-hover:scale-110
            "
          />

          {/* Notification Badge */}
          <span
            className="
              absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2
              bg-destructive text-destructive-foreground
              text-[9px] sm:text-xs rounded-full
              px-1.5 py-0.5 shadow
            "
          >
            5
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="
            w-64 bg-card text-card-foreground
            shadow-xl border border-border
          "
        >
          <DropdownMenuLabel className="font-semibold">
            Notifications
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer hover:bg-muted hover:text-foreground"
            onClick={() => router.push("/cm-dashboard/reviewer-assignments")}
          >
            New review assignment request
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer hover:bg-muted hover:text-foreground"
            onClick={() => router.push("/cm-dashboard/editor-assignments")}
          >
            Editor finished editing a draft
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer hover:bg-muted hover:text-foreground"
            onClick={() => router.push("/cm-dashboard/change-requests")}
          >
            Author submitted revisions
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer hover:bg-muted hover:text-foreground"
            onClick={() => router.push("/cm-dashboard/scheduling")}
          >
            Upcoming scheduled publication
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-primary text-center cursor-pointer hover:bg-muted/60"
          >
            View All Notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
