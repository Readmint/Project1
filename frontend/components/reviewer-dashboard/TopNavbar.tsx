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
      {/* SEARCH */}
      <div className="relative w-full max-w-sm">
        <input
          aria-label="Search submissions"
          placeholder="Search submissions..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="
            w-full bg-muted border border-border rounded-lg
            pl-9 pr-3 py-2
            text-sm text-foreground
            focus:outline-none focus:ring-2 focus:ring-primary/40
            transition-all
          "
        />

        <Search
          size={16}
          className="
            absolute left-3 top-1/2 -translate-y-1/2
            text-muted-foreground pointer-events-none
          "
        />
      </div>

      {/* NOTIFICATIONS */}
      <div className="relative ml-4">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="relative transition-all hover:bg-muted rounded-lg p-1"
          aria-label="Notifications"
        >
          <Bell className="h-6 w-6 text-primary" />

          <span
            className="
              absolute -top-1 -right-1
              bg-destructive text-destructive-foreground
              text-[10px] rounded-full px-1
            "
          >
            2
          </span>
        </button>

        {open && (
          <div
            className="
              absolute right-0 mt-3 w-80
              bg-card border border-border rounded-lg shadow-sm
              p-4 space-y-4 z-50
            "
          >
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>

            <div className="space-y-3">
              <div className="bg-muted border border-border rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">
                  High plagiarism detected
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Submission requires immediate review
                </p>
              </div>

              <div className="bg-muted border border-border rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">
                  Revision resubmitted
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting re-evaluation
                </p>
              </div>
            </div>

            <Link
              href="/reviewer-dashboard/messages"
              className="block text-sm text-primary font-medium hover:underline"
            >
              View all notifications →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
