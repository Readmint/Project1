"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJSON } from "@/lib/api";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminRegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await postJSON("/admin/register", formData);

            if (res.status === "success") {
                toast.success("Account created! Please verify your email.");
                // Redirect to verify page with email pre-filled
                router.push(`/admin/verify?email=${encodeURIComponent(formData.email)}`);
            } else {
                toast.error(res.message || "Registration Failed");
            }
        } catch (error) {
            toast.error("System Error: Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">

                <div className="text-center space-y-2">
                    <div className="bg-slate-900 border border-slate-800 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-900/20">
                        <ShieldCheck className="text-emerald-500 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Admin Enrollment</h1>
                    <p className="text-slate-500 text-sm">Create your administrative account</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 backdrop-blur-xl p-8 rounded-2xl shadow-xl">
                    <form onSubmit={handleRegister} className="space-y-4">

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Full Name</label>
                            <Input name="name" onChange={handleChange} required className="bg-slate-950 border-slate-800 text-white" placeholder="Admin Name" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Admin Email</label>
                            <Input name="email" type="email" onChange={handleChange} required className="bg-slate-950 border-slate-800 text-white" placeholder="admin@domain.com" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
                            <Input name="password" type="password" onChange={handleChange} required className="bg-slate-950 border-slate-800 text-white" placeholder="••••••••" />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-6 rounded-xl transition-all mt-4"
                        >
                            {loading ? "Processing..." : "Create Admin Account"}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <Link href="/admin/login" className="text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1">
                            Already have an account? Login <ArrowRight size={10} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
