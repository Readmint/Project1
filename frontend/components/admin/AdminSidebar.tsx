"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, ShieldAlert, Activity, Settings, LogOut, Menu, AlertTriangle, BarChart3 } from "lucide-react";

import LogoutConfirmation from "@/components/LogoutConfirmation"; // Reusing existing component

/* -----------------------------------------------------------
      ADMIN DASHBOARD NAV STRUCTURE
----------------------------------------------------------- */

const navGroups = [
    {
        label: "Overview",
        items: [
            { label: "Platform Health", path: "/admin-dashboard", icon: LayoutDashboard },
        ],
    },
    {
        label: "Management",
        items: [
            { label: "User Management", path: "/admin-dashboard/users", icon: Users },
            { label: "Content Oversight", path: "/admin-dashboard/content", icon: FileText },
            { label: "Plagiarism Monitor", path: "/admin-dashboard/plagiarism", icon: ShieldAlert },
            { label: "Incident Management", path: "/admin-dashboard/incidents", icon: AlertTriangle },
            { label: "Reports & Analytics", path: "/admin-dashboard/reports", icon: BarChart3 },
            { label: "Audit Logs", path: "/admin-dashboard/audit-logs", icon: Activity },
            { label: "System Settings", path: "/admin-dashboard/settings", icon: Settings },
        ],
    },
    {
        label: "System",
        items: [
            // { label: "Audit Logs", path: "/admin-dashboard/audit-logs", icon: Activity }, // Moved to Management
            // { label: "Settings", path: "/admin-dashboard/settings", icon: Settings }, // Moved to Management
        ],
    },
];

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        // Clear all auth tokens
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");

        // Dispatch event so Navbar updates immediately
        window.dispatchEvent(new Event("userLogout"));

        window.location.href = "/admin/login";
    };

    useEffect(() => {
        // Basic auth check redundant if page is protected, but good for UX
        const handleStorageChange = () => {
            // If needed
        };
        return () => {
        };
    }, []);

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-lg shadow"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Mobile Overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 
  border-r border-slate-200 dark:border-slate-700 shadow-lg
  sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto scrollbar-thin z-10"
            >

                {/* Branding */}
                <div className="p-6 pb-2">
                    <h2 className="text-2xl font-bold text-indigo-600">ReadMint</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Super Admin Portal
                    </p>
                </div>

                {/* Navigation */}
                <nav className="p-6 space-y-6 flex-1">
                    {navGroups.map((group) => (
                        <div key={group.label}>
                            <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2 pl-4">
                                {group.label}
                            </p>

                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const active = pathname === item.path;

                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            router.push(item.path);
                                            setOpen(false);
                                        }}
                                        className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all
                      ${active
                                                ? "bg-indigo-600 text-white shadow"
                                                : "text-slate-700 dark:text-white hover:bg-indigo-50 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Confirm Logout */}
            {showLogoutConfirm && (
                <LogoutConfirmation
                    onConfirm={handleLogout}
                    onCancel={() => setShowLogoutConfirm(false)}
                />
            )}
        </>
    );
}
