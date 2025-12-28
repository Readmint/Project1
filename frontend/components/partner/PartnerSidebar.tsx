"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Calendar, Settings, LogOut, Menu, ClipboardList, BookOpen, CheckCircle2, CreditCard } from "lucide-react";
import LogoutConfirmation from "@/components/LogoutConfirmation";

const navGroups = [
    {
        label: "Overview",
        items: [
            { label: "Dashboard Home", path: "/partner-dashboard", icon: LayoutDashboard },
        ],
    },
    {
        label: "Management",
        items: [
            { label: "Create Article", path: "/partner-dashboard/create-article", icon: FileText },
            { label: "Events", path: "/partner-dashboard/events", icon: Calendar },
            { label: "Submissions", path: "/partner-dashboard/submissions", icon: FileText },
            { label: "My Users", path: "/partner-dashboard/users", icon: Users },
        ],
    },
    {
        label: "Workflow",
        items: [
            { label: "Review & Plagiarism", path: "/partner-dashboard/review", icon: ClipboardList },
            { label: "Editing & Design", path: "/partner-dashboard/editing", icon: BookOpen },
            { label: "Final Outputs", path: "/partner-dashboard/final-outputs", icon: FileText },
            { label: "Publishing", path: "/partner-dashboard/publishing", icon: CheckCircle2 },
        ],
    },
    {
        label: "Account",
        items: [
            { label: "Billing & Profile", path: "/partner-dashboard/billing-profile", icon: CreditCard },
            { label: "Settings", path: "/partner-dashboard/settings", icon: Settings },
        ],
    },
];

export default function PartnerSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("userLogout"));
        router.push("/login");
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-lg shadow"
            >
                <Menu className="h-5 w-5" />
            </button>

            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={`flex flex-col w-64 bg-white dark:bg-slate-900 
  border-r border-slate-200 dark:border-slate-700 shadow-lg
  sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto scrollbar-thin z-10
  ${open ? "fixed inset-y-0 left-0 z-40" : "hidden md:flex"}`}
            >
                <div className="p-6 pb-2">
                    <h2 className="text-2xl font-bold text-indigo-600">MindRadix</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Partner Dashboard
                    </p>
                </div>

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

            {showLogoutConfirm && (
                <LogoutConfirmation
                    onConfirm={handleLogout}
                    onCancel={() => setShowLogoutConfirm(false)}
                />
            )}
        </>
    );
}

