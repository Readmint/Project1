"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search } from "lucide-react";
import Link from "next/link";

export default function TopNavbar() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      className="
      w-full flex items-center justify-between
      bg-background border-b border-border
      px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-sm
    "
      ref={dropdownRef}
    >
      {/* SEARCH */}
      <div className="relative w-full max-w-[220px] sm:max-w-xs md:max-w-sm">
        <input
          placeholder="Search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="
            w-full bg-muted border border-border 
            pl-9 sm:pl-10 
            text-xs sm:text-sm py-2 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-primary/40 
            transition-all text-foreground
          "
        />

        <Search
          className="
            absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 
            text-muted-foreground pointer-events-none
          "
          size={16}
        />
      </div>

      {/* NOTIFICATION BELL + DROPDOWN */}
      <div className="relative ml-4 sm:ml-6">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="relative flex-shrink-0"
        >
          <Bell
            className="
              h-5 w-5 sm:h-6 sm:w-6 
              text-primary hover:scale-110 transition-transform
            "
          />

          {/* Badge */}
          <span
            className="
              absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 
              bg-destructive text-destructive-foreground 
              text-[9px] sm:text-xs 
              rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0
            "
          >
          </span>
        </button>

        {/* DROPDOWN PANEL */}
        {open && (
          <div
            className="
              absolute right-0 mt-3 w-72 sm:w-80
              bg-card border border-border shadow-lg rounded-lg 
              p-4 space-y-3 z-50
            "
          >
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>

            {/* Example notifications */}
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-sm text-foreground font-medium">
                  New plagiarism report flagged
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Submission PLG-0023 exceeds threshold.
                </p>
              </div>

              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-sm text-foreground font-medium">
                  Reviewer did not run scan
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Admin action required on PLG-0018.
                </p>
              </div>

              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-sm text-foreground font-medium">
                  System announcement scheduled
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Goes live in 2 hours.
                </p>
              </div>
            </div>

            {/* Footer CTA */}
            <Link
              href="/admin-dashboard/notifications"
              className="
                block text-primary text-sm font-medium 
                hover:underline mt-2
              "
            >
              View all notifications →
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
