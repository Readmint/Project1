"use client";

import { useState, useEffect } from "react";
import { getJSON } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Plan {
    id: string;
    name: string;
    description: string;
    price_monthly: number;
    price_yearly: number;
    features: string[];
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const res = await getJSON("/reader/plans");
            if (res.status === "success") {
                setPlans(res.data);
            }
        } catch (e) {
            toast.error("Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = (plan: Plan) => {
        // Mock subscription for now
        toast.success(`Subscribing to ${plan.name} (${billingCycle})...`);
        // Redirect to checkout or Stripe
        // window.location.href = `/checkout/subscription?plan=${plan.id}&cycle=${billingCycle}`;
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" /></div>;
    }

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Choose Your Plan</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                    Unlock unlimited access to premium articles, magazines, and exclusive content.
                </p>

                {/* Toggle */}
                <div className="flex items-center justify-center mt-6 gap-3">
                    <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-indigo-600' : 'text-slate-500'}`}>Monthly</span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${billingCycle === 'yearly' ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : ''}`} />
                    </button>
                    <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-indigo-600' : 'text-slate-500'}`}>Yearly (Save 20%)</span>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {plans.map((plan) => {
                    const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
                    return (
                        <div key={plan.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                            <p className="text-sm text-slate-500 mb-6 min-h-[40px]">{plan.description}</p>

                            <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">
                                ${Number(price).toFixed(2)}
                                <span className="text-base font-normal text-slate-500 ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>

                            <div className="mt-8 space-y-3 flex-1">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="bg-green-100 text-green-600 p-0.5 rounded-full mt-0.5"><Check size={12} /></div>
                                        <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={() => handleSubscribe(plan)}
                                className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                Subscribe Now
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
