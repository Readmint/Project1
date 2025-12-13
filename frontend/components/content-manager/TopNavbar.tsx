"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Bell, Search, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { getJSON } from "@/lib/api";
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();

  const searchScopes = ["All", "Articles", "Authors", "Reviewers"];

  const fetchNotifications = async () => {
    try {
      const res = await getJSON('/content-manager/notifications');
      if (res.status === 'success') {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optional: Poll every 30s
    // const interval = setInterval(fetchNotifications, 30000);
    // return () => clearInterval(interval);
  }, []);

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
          {notifications.length > 0 && (
            <span
              className="
                absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2
                bg-destructive text-destructive-foreground
                text-[9px] sm:text-xs rounded-full
                px-1.5 py-0.5 shadow
                "
            >
              {notifications.filter(n => !n.is_read).length || notifications.length}
            </span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="
            w-80 bg-card text-card-foreground
            shadow-xl border border-border
            max-h-96 overflow-y-auto
          "
        >
          <DropdownMenuLabel className="font-semibold">
            Notifications
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            notifications.map((notif: any) => (
              <DropdownMenuItem
                key={notif.id}
                className="cursor-pointer hover:bg-muted hover:text-foreground flex flex-col items-start gap-1 p-3 border-b last:border-0"
                onClick={() => {
                  if (notif.link) router.push(notif.link);
                }}
              >
                <div className="font-medium text-sm">{notif.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{notif.message}</div>
                <div className="text-[10px] text-muted-foreground mt-1 text-right w-full">
                  {new Date(notif.created_at).toLocaleString()}
                </div>
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-primary text-center cursor-pointer hover:bg-muted/60"
            onClick={() => router.push('/cm-dashboard/notifications')} // Optional page if you want
          >
            View All Notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
