"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Moon, Sun } from "lucide-react";
import { navLinks } from "@/src/data/navLinks";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* ✅ LEFT SIDE (locked) */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/icons/icon.png"
              alt="E-Magazine Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-slate-900 dark:text-white font-semibold text-lg hidden sm:block">
              E-Magazine
            </span>
          </Link>

          {/* ✅ RIGHT SIDE (takes remaining space and distributes properly) */}
          <div className="flex flex-1 justify-end items-center gap-6">

            {/* DESKTOP NAV LINKS */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-slate-600 dark:text-slate-300 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-3 py-2 text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <Button variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>

              <Link href="/signup">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Sign Up
                </Button>
              </Link>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 text-slate-600 dark:text-slate-300"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

        </div>

        {/* MOBILE MENU */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col gap-2 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300"
                >
                  {link.label}
                </Link>
              ))}

              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
              </Button>
            </div>
          </div>
        )}

      </div>
    </nav>
  );
}
