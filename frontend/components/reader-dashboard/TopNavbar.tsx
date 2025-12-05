"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Bell, Search, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

export default function TopNavbar({
  onSearch,
  onOpenCart,
}: {
  onSearch: (v: string) => void;
  onOpenCart: () => void;
}) {
  const [value, setValue] = useState("");
  const [cartCount, setCartCount] = useState(0);

  // Load cart count from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("cart_items") || "[]");
        setCartCount(stored.length);
      } catch {
        setCartCount(0);
      }
    }
  }, []);

  // Listen to cart updates across tabs/components
  useEffect(() => {
    const handler = () => {
      const stored = JSON.parse(localStorage.getItem("cart_items") || "[]");
      setCartCount(stored.length);
    };

    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

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
        
        <Search
          className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none"
          size={16}
        />
      </div>

      {/* Right Side Buttons */}
      <div className="flex items-center gap-4 sm:gap-6">

        {/* Notification Bell */}
        <button className="relative flex-shrink-0">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform" />
          <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-red-600 text-[9px] sm:text-xs text-white rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0"></span>
        </button>

        {/* Cart Button */}
        <motion.button
          onClick={onOpenCart}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 sm:p-2.5 shadow-md transition-all"
        >
          <ShoppingCart size={18} />

          {/* Cart Item Count */}
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] text-white rounded-full px-1.5 py-0.5 shadow-sm">
              {cartCount}
            </span>
          )}
        </motion.button>

      </div>
    </nav>
  );
}
