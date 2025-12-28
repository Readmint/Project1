"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[]; // Optional: restrict to specific roles
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // 1. Check for token/user in localStorage
        const token = localStorage.getItem("token") || localStorage.getItem("ACCESS_TOKEN");
        const userRaw = localStorage.getItem("user");

        if (!token || !userRaw) {
            console.warn("AuthGuard: No token found, redirecting to login.");
            // Redirect to login, optionally saving the return URL
            router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            return;
        }

        // 2. Optional: Role Check
        if (allowedRoles && allowedRoles.length > 0) {
            try {
                const user = JSON.parse(userRaw);
                if (!allowedRoles.includes(user.role)) {
                    console.warn(`AuthGuard: Role ${user.role} not allowed, redirecting to home.`);
                    router.replace("/unauthorized"); // or home
                    return;
                }
            } catch (e) {
                console.error("AuthGuard: Invalid user data", e);
                router.replace("/login");
                return;
            }
        }

        // 3. Authorized
        setAuthorized(true);
    }, [router, pathname, allowedRoles]);

    if (!authorized) {
        // Render nothing or a loading spinner while checking
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-4 bg-indigo-600 rounded-full animate-bounce mb-2"></div>
                    <span className="text-sm text-slate-500">Verifying access...</span>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
