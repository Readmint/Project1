"use client";

import { useState, useEffect } from "react";
import { Check, Download, History, CreditCard, Shield, Star, Zap } from "lucide-react";
import { createOrderAndRedirect } from "@/lib/payments";
import { toast } from "react-hot-toast";

// API base normalization
const rawApi = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");
const API_BASE = rawApi.endsWith("/api") ? rawApi.replace(/\/api$/, "") : rawApi;
const API_ROOT = `${API_BASE}/api`.replace(/\/+$/, "");

export default function AuthorSubscriptionPage() {
    const [plans, setPlans] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Get user from local storage
        const storedUser = localStorage.getItem("user");
        let userId = "";
        if (storedUser) {
            const u = JSON.parse(storedUser);
            setUser(u);
            userId = u.id || u.userId;
        }

        const fetchData = async () => {
            try {
                // Fetch Plans
                const plansRes = await fetch(`${API_ROOT}/subscription/plans/author`);
                const plansData = await plansRes.json();
                if (plansData.status === "success") {
                    setPlans(plansData.data.plans);
                }

                // Fetch History
                if (userId) {
                    const historyRes = await fetch(`${API_ROOT}/subscription/history/${userId}`);
                    const historyData = await historyRes.json();
                    if (historyData.status === "success") {
                        setHistory(historyData.data.history);
                    }
                }
            } catch (err) {
                console.error("Failed to load subscription data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleUpgrade = async (plan: any) => {
        if (!user) {
            toast.error("Please login to upgrade");
            return;
        }

        if (plan.price_monthly === 0) {
            toast.success("You are already on the Free plan");
            return;
        }

        try {
            await createOrderAndRedirect({
                planId: plan.id,
                amount: plan.price_monthly,
                userId: user.id || user.userId,
                userEmail: user.email,
                firstName: user.firstname || user.name,
                lastName: user.lastname || "",
                // Redirect back to this page after success/failure
                surl: `${window.location.origin}/author-dashboard/subscription?status=success`,
                furl: `${window.location.origin}/author-dashboard/subscription?status=failure`,
            });
        } catch (error) {
            console.error("Payment initiation failed", error);
        }
    };

    const getBadgeIcon = (badge: string) => {
        if (badge === 'Gold') return <div className="p-2 bg-yellow-100 text-yellow-700 rounded-full"><Star size={20} fill="currentColor" /></div>;
        if (badge === 'Bronze') return <div className="p-2 bg-orange-100 text-orange-700 rounded-full"><Shield size={20} /></div>;
        return <div className="p-2 bg-gray-100 text-gray-500 rounded-full"><Zap size={20} /></div>;
    };

    if (loading) return <div className="p-10 text-center">Loading subscription details...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">

            {/* HEADER */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Author Plans & Pricing</h1>
                <p className="text-xl text-muted-foreground w-full max-w-2xl mx-auto">
                    Choose the plan that suits your publishing needs. Upgrade anytime to unlock faster reviews and unlimited plagiarism checks.
                </p>
            </div>

            {/* PRICING CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan: any) => (
                    <div
                        key={plan.id}
                        className={`relative flex flex-col p-8 bg-card rounded-2xl border ${plan.id === 'author_premium' ? 'border-primary shadow-lg scale-105' : 'border-border shadow-sm'
                            }`}
                    >
                        {plan.id === 'author_premium' && (
                            <div className="absolute top-0 right-0 -mt-4 mr-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                Recommended
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                            </div>
                            {getBadgeIcon(plan.badge)}
                        </div>

                        <div className="mb-6">
                            <span className="text-4xl font-extrabold text-foreground">₹{plan.price_monthly}</span>
                            <span className="text-muted-foreground ml-2">/ month</span>
                        </div>

                        <ul className="flex-1 space-y-4 mb-8">
                            {plan.features.map((feature: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                    <Check className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                                    <span className="text-sm text-foreground">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleUpgrade(plan)}
                            className={`w-full py-3 rounded-lg font-semibold transition-all ${plan.id === 'author_premium'
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg'
                                : 'bg-muted text-foreground hover:bg-muted/80'
                                }`}
                        >
                            {plan.price_monthly === 0 ? "Current Plan" : "Upgrade Now"}
                        </button>
                    </div>
                ))}
            </div>

            {/* PAYMENT HISTORY / RECEIPTS */}
            <div className="pt-12 border-t border-border">
                <div className="flex items-center mb-6">
                    <History className="mr-3 text-muted-foreground" />
                    <h2 className="text-2xl font-bold text-foreground">Payment History & Receipts</h2>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    {history.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground bg-muted/20">
                            <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-20" />
                            <p>No payment history found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Transaction ID</th>
                                        <th className="px-6 py-4">Plan</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {history.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">{tx.txnid}</td>
                                            <td className="px-6 py-4 capitalize">{tx.plan_id.replace('author_', '').replace('_', ' ')}</td>
                                            <td className="px-6 py-4 font-medium">₹{tx.amount}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'completed' || tx.status === 'success' ? 'bg-green-100 text-green-700' :
                                                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {tx.status === 'completed' && (
                                                    <button className="inline-flex items-center text-primary hover:underline text-xs">
                                                        <Download size={14} className="mr-1" /> Download
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
