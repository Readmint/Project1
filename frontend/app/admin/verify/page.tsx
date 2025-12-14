"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { postJSON } from "@/lib/api";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialEmail = searchParams.get("email") || "";

    const [email, setEmail] = useState(initialEmail);
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await postJSON("/admin/verify", { email, otp });

            if (res.status === "success") {
                toast.success("Verification successful!");
                router.push("/admin/login");
            } else {
                toast.error(res.message || "Verification Failed");
            }
        } catch (error) {
            toast.error("System Error: Verification failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-2">
                <div className="bg-slate-900 border border-slate-800 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-900/20">
                    <CheckCircle2 className="text-blue-500 w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Verify Identity</h1>
                <p className="text-slate-500 text-sm">Enter the OTP sent to your email.</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 backdrop-blur-xl p-8 rounded-2xl shadow-xl">
                <form onSubmit={handleVerify} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-slate-950 border-slate-800 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">One-Time Password (OTP)</label>
                        <Input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            className="bg-slate-950 border-slate-800 text-white text-center text-xl tracking-[0.5em] font-mono"
                            placeholder="000000"
                            maxLength={6}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-6 rounded-xl transition-all mt-4"
                    >
                        {loading ? "Verifying..." : "Verify & Login"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function AdminVerifyPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <VerifyContent />
            </Suspense>
        </div>
    )
}
