"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJSON } from "@/lib/api";
import { KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<"request" | "reset">("request");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await postJSON("/admin/forgot-password", { email });
            // The API always returns success for security, or specific error
            if (res.status === "success") {
                toast.success(res.message);
                setStep("reset");
            } else {
                toast.error(res.message || "Failed to send OTP");
            }
        } catch (error) {
            toast.error("System Error: Failed to request OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await postJSON("/admin/reset-password", { email, otp, newPassword });
            if (res.status === "success") {
                toast.success("Password reset successfully");
                router.push("/admin/login");
            } else {
                toast.error(res.message || "Failed to reset password");
            }
        } catch (error) {
            toast.error("System Error: Failed to reset password");
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
                        <KeyRound className="text-indigo-500 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Recovery Console</h1>
                    <p className="text-slate-500 text-sm">
                        {step === "request" ? "Enter your admin email to proceed" : "Enter verification code and new password"}
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-slate-900/50 border border-slate-800 backdrop-blur-xl p-8 rounded-2xl shadow-xl">
                    {step === "request" ? (
                        <form onSubmit={handleRequestOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Admin Email
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

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-6 rounded-xl transition-all shadow-lg shadow-indigo-900/20"
                            >
                                {loading ? "Sending One-Time Password..." : "Send Verification Code"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    One-Time Password (OTP)
                                </label>
                                <Input
                                    type="text"
                                    required
                                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:ring-indigo-500/50 focus:border-indigo-500 tracking-widest text-center text-lg"
                                    placeholder="••••••"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    New Password
                                </label>
                                <Input
                                    type="password"
                                    required
                                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:ring-indigo-500/50 focus:border-indigo-500"
                                    placeholder="New secure password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-6 rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                            >
                                {loading ? "Updating Credentials..." : "Reset Password"}
                            </Button>
                        </form>
                    )}

                    <div className="mt-6 pt-6 border-t border-slate-800 flex justify-center">
                        <Link href="/admin/login" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={14} />
                            <span>Return to Login</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
