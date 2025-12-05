"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free Plan",
    price: "₹0",
    monthly: "Free Forever",
    features: [
      "Limited reading",
      "Ads shown",
      "Restricted features",
    ],
  },
  {
    name: "Standard Plan",
    price: "₹99 / month",
    monthly: "Billed Monthly",
    features: [
      "Most magazines unlocked",
      "No reading limits",
      "Access on all devices",
    ],
  },
  {
    name: "Premium Plan",
    price: "₹199 / month",
    monthly: "Billed Monthly",
    features: [
      "Unlimited access",
      "Ad-free experience",
      "Exclusive premium content",
      "Early access releases",
    ],
  },
];

export default function SubscriptionPlans() {
  return (
    <div className="max-w-6xl mx-auto px-4 text-center">
      <h2 className="text-3xl font-bold mb-8">Subscription Plans</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {plans.map((plan, i) => (
          <Card key={i} className="p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold">{plan.name}</h3>

            <p className="text-3xl font-semibold mt-4">{plan.price}</p>
            <p className="text-slate-500 mt-1">{plan.monthly}</p>

            <ul className="text-left mt-6 space-y-2">
              {plan.features.map((f, j) => (
                <li key={j}>✓ {f}</li>
              ))}
            </ul>

            <Button className="mt-6 w-full bg-indigo-600 text-white hover:bg-indigo-700">
              Subscribe Now
            </Button>
          </Card>
        ))}

      </div>
    </div>
  );
}
