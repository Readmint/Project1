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
      className="flex items-center justify-between w-full h-full px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900"
    >
      {/* Search Section */}
      <div className="relative w-full max-w-[220px] sm:max-w-xs md:max-w-sm">
        <input
          aria-label="Search submissions"
          placeholder="Search submissions..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-800 pl-9 sm:pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
        />

        <Search
          size={16}
          className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none"
        />
      </div>

      {/* Notification Section */}
      <div className="relative ml-4 sm:ml-6 flex-shrink-0">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="relative flex items-center justify-center p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform" />

          <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-red-600 text-[9px] sm:text-[10px] text-white font-bold rounded-full px-1.5 py-0.5 border border-white dark:border-slate-900">
            2
          </span>
        </button>

        {open && (
          <div
            className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-0 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Notifications
              </h3>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              <div className="p-2 space-y-1">
                <div className="group flex flex-col gap-1 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    High plagiarism detected
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Submission requires immediate review
                  </p>
                </div>

                <div className="group flex flex-col gap-1 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Revision resubmitted
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Awaiting re-evaluation
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <Link
                href="/reviewer-dashboard/messages"
                className="block text-center text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
              >
                View all notifications →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
