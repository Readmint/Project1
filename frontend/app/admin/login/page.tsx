"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJSON } from "@/lib/api";
import { Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await postJSON("/admin/login", { email, password });

            if (res.status === "success" && res.data?.token) {
                // Set standard keys so Global Navbar picks it up
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("user", JSON.stringify(res.data.user));

                // Keep admin specific keys if needed for legacy compatibility, but standardize mainly
                localStorage.setItem("adminToken", res.data.token);
                localStorage.setItem("adminUser", JSON.stringify(res.data.user));

                // Dispatch event so Navbar updates immediately
                window.dispatchEvent(new Event("userLogin"));

                toast.success("Welcome back, Administrator.");
                router.push("/admin-dashboard");
            } else {
                toast.error(res.message || "Access Denied");
            }
        } catch (error) {
            toast.error("System Error: Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="bg-slate-900 border border-slate-800 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-900/20">
                        <Lock className="text-indigo-500 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Admin Console</h1>
                    <p className="text-slate-500 text-sm">Secure Access Required</p>
                </div>

                {/* Form Card */}
                <div className="bg-slate-900/50 border border-slate-800 backdrop-blur-xl p-8 rounded-2xl shadow-xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Admin ID / Email
                            </label>
                            <Input
                                type="email"
                                required
                                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:ring-indigo-500/50 focus:border-indigo-500"
                                placeholder="admin@readmint.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Passkey
                            </label>
                            <Input
                                type="password"
                                required
                                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:ring-indigo-500/50 focus:border-indigo-500"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-6 rounded-xl transition-all shadow-lg shadow-indigo-900/20"
                        >
                            {loading ? "Authenticating..." : "Access Console"}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-800 flex justify-center">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <ShieldAlert size={12} />
                            <span>Unauthorized access is logged and monitored.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
