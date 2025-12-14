"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Moon, Sun, LogOut, User, ChevronDown, Settings, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { navLinks } from "@/src/data/navLinks";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import LogoutConfirmation from "../LogoutConfirmation";

export default function Navbar() {
  const { cart } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Listen for user changes (login/logout)
  useEffect(() => {
    const loadUser = () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      } else {
        setUser(null);
      }
    };

    // Load initial user data
    loadUser();

    // Load theme
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    }

    // Listen for storage changes (login/logout from other tabs/components)
    const handleStorageChange = () => {
      loadUser();
    };

    // Listen for custom login event (from login page)
    const handleLoginEvent = () => {
      loadUser();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userLogin", handleLoginEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userLogin", handleLoginEvent);
    };
  }, []);

  // Listen for route changes to update user
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, [pathname]);

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

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(true);
    setUserMenuOpen(false);
    setIsOpen(false);
  };

  const handleLogout = () => {
    // Clear all auth-related data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear any other app-specific data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("app_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Update state
    setUser(null);

    // Dispatch logout event for other components
    window.dispatchEvent(new Event("userLogout"));

    // Hide confirmation modal
    setShowLogoutConfirm(false);

    // Use window.location.href for complete redirect to home page
    window.location.href = "/";
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    const name = user.name || user.displayName || user.email?.split("@")[0] || "User";
    return typeof name === "string" ? name : "User";
  };

  const getUserRole = () => {
    if (!user) return "";

    // Format role for display
    const role = user.role || "";
    if (typeof role !== "string") return "";

    switch (role) {
      case 'author':
        return 'Author';
      case 'reader':
        return 'Reader';
      case 'reviewer':
        return 'Reviewer';
      case 'editor':
        return 'Editor';
      case 'content_manager':
        return 'Content Manager';
      case 'admin':
        return 'Administrator';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  // Get dashboard path based on role
  const getDashboardPath = () => {
    if (!user || !user.role || typeof user.role !== 'string') return "/";

    switch (user.role) {
      case 'author':
        return "/author-dashboard";
      case 'reviewer':
        return "/reviewer-dashboard";
      case 'editor':
        return "/editor-dashboard";
      case 'content_manager':
        return "/content-manager-dashboard";
      case 'admin':
        return "/admin-dashboard";
      default:
        return "/reader-dashboard"; // For readers
    }
  };

  // Get profile path based on role
  const getProfilePath = () => {
    if (!user || !user.role || typeof user.role !== 'string') return "/profile";

    switch (user.role) {
      case 'author':
        return "/author-dashboard/profile";
      case 'reviewer':
        return "/reviewer-dashboard/profile";
      case 'editor':
        return "/editor-dashboard/profile";
      case 'content_manager':
        return "/content-manager-dashboard/profile";
      case 'admin':
        return "/admin-dashboard/profile";
      default:
        return "/reader-dashboard/profile"; // For readers
    }
  };

  const isLoggedIn = !!user;

  return (
    <>
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* ✅ LEFT SIDE */}
            <Link href={isLoggedIn ? getDashboardPath() : "/"}
              className="flex items-center gap-2 flex-shrink-0">
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

            {/* ✅ MIDDLE: Show user info when on role-specific dashboard (except reader) */}
            <div className="hidden md:flex items-center flex-1 justify-center">
              {isLoggedIn && pathname.includes("dashboard") && user?.role !== 'reader' ? (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
                    <User size={16} />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-slate-900 dark:text-white">{getUserDisplayName()}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{getUserRole()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
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
              )}
            </div>

            {/* ✅ RIGHT SIDE */}
            <div className="flex items-center gap-3">

              {/* Shopping Cart */}
              <Link href="/checkout" className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                    {cart.length}
                  </span>
                )}
              </Link>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* User Menu or Login/Signup */}
              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{getUserDisplayName()}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{getUserRole()}</p>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
                      {user.photoURL && typeof user.photoURL === 'string' ? (
                        <img
                          src={user.photoURL}
                          alt={getUserDisplayName()}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <ChevronDown size={16} className="text-slate-500" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{getUserDisplayName()}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {typeof user.email === 'string' ? user.email : ''}
                        </p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">{getUserRole()}</p>
                      </div>

                      <Link
                        href={getDashboardPath()}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <User size={16} />
                        Dashboard
                      </Link>

                      <Link
                        href={getProfilePath()}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Settings size={16} />
                        Profile Settings
                      </Link>

                      <button
                        onClick={handleLogoutConfirm}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Button variant="ghost" size="sm">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Link href="/signup">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 text-slate-600 dark:text-slate-300"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* MOBILE MENU */}
          {isOpen && (
            <div className="md:hidden pb-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col gap-2 pt-4">
                {/* Show user info at top if logged in */}
                {isLoggedIn && (
                  <div className="px-3 py-3 mb-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
                        {user.photoURL && typeof user.photoURL === 'string' ? (
                          // Use a plain <img> for external user.photoURL to avoid next/image host validation
                          <img
                            src={user.photoURL}
                            alt={getUserDisplayName()}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{getUserDisplayName()}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{getUserRole()}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          {typeof user.email === 'string' ? user.email : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation links */}
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

                {/* Conditional buttons based on login state */}
                {isLoggedIn ? (
                  <>
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link href={getDashboardPath()} onClick={() => setIsOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link href={getProfilePath()} onClick={() => setIsOpen(false)}>
                        Profile Settings
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 dark:text-red-400"
                      onClick={() => {
                        setIsOpen(false);
                        handleLogoutConfirm();
                      }}
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        Login
                      </Link>
                    </Button>
                    <Button asChild className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Link href="/signup" onClick={() => setIsOpen(false)}>
                        Sign Up
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <LogoutConfirmation
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
