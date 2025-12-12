"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search } from "lucide-react";
import Link from "next/link";

export default function TopNavbar() {
  const [searchValue, setSearchValue] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on ESC
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div 
      ref={dropdownRef}
      className="flex items-center justify-between h-full px-6"
    >
      {/* LEFT SECTION — ONLY SEARCH */}
      <div className="relative w-full max-w-xs">
        <input
          aria-label="Search"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="
            w-full bg-muted border border-border rounded-lg
            pl-9 pr-3 py-2 
            focus:outline-none focus:ring-2 focus:ring-primary/40
            text-sm text-foreground transition-all
          "
        />

        {/* Search Icon */}
        <Search
          size={16}
          className="
            absolute left-3 top-1/2 -translate-y-1/2
            text-muted-foreground
            pointer-events-none
          "
        />
      </div>

      {/* RIGHT SECTION — BELL + DROPDOWN */}
      <div className="relative ml-4">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="relative hover:scale-110 transition-transform"
          aria-label="Notifications"
        >
          <Bell 
            className="h-6 w-6 text-primary" 
          />

          {/* Badge */}
          <span
            className="
              absolute -top-1.5 -right-1.5
              bg-destructive text-destructive-foreground
              text-[10px] rounded-full px-1 py-0.5
            "
          >
            3
          </span>
        </button>

        {/* DROPDOWN */}
        {open && (
          <div
            className="
              absolute right-0 mt-3 w-72
              bg-card border border-border shadow-lg rounded-lg 
              p-4 space-y-3 z-50
            "
          >
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>

            {/* NOTIFICATION LIST */}
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-sm font-medium text-foreground">
                  New flagged plagiarism report
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PLG-0028 triggered threshold
                </p>
              </div>

              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-sm font-medium text-foreground">
                  Reviewer missed scan on submission
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Admin action required
                </p>
              </div>

              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-sm font-medium text-foreground">
                  System announcement scheduled
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Goes live in 1 hour
                </p>
              </div>
            </div>

            {/* SHOW ALL BUTTON */}
            <Link
              href="/admin-dashboard/alerts"
              className="
                block text-sm text-primary font-medium 
                hover:underline mt-1
              "
            >
              Show all →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
