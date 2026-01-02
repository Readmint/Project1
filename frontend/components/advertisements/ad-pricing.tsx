"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Plan = {
    id: string;
    name: string;
    description: string;
    price_amount: number;
    price_currency: string;
    features: string[];
};

import { getJSON } from "@/lib/api";

export default function AdPricing({ onContactSales }: { onContactSales: (planName?: string, planId?: string) => void }) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPlans() {
            try {
                const data = await getJSON("/advertisements/plans");
                if (data.status === 'success') {
                    setPlans(data.data.plans);
                }
            } catch (error) {
                console.error("Failed to fetch plans", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPlans();
    }, []);

    if (loading) {
        return <div className="text-center py-12">Loading plans...</div>;
    }

    return (
        <section className="max-w-7xl mx-auto px-6 py-24">
            <h2 className="text-3xl font-bold text-center text-foreground mb-4">
                Simple, Transparent Pricing
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                Choose the plan that best fits your marketing goals.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <Card key={plan.id} className="flex flex-col border-2 hover:border-indigo-600 transition-colors">
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-3xl font-bold mb-6">
                                {plan.price_currency} {plan.price_amount}
                                <span className="text-sm font-normal text-muted-foreground"> / campaign</span>
                            </div>
                            <ul className="space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                onClick={() => onContactSales(plan.name, plan.id)}
                            >
                                Get Started
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </section>
    );
}
