// components/home/SubscriptionPlans.tsx
'use client';

import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { Card } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { getJSON } from "@/lib/api";
import { toast } from 'react-hot-toast';
import { createOrderAndRedirect, PayPayload } from '@/lib/payments';
import { useRouter } from 'next/navigation';

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number; // normalized price (number)
  raw?: any; // original raw object for debugging if needed
  interval?: string;
  benefits: string[];
  description?: string;
};

function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Normalize a raw plan object from backend to SubscriptionPlan
 * Accepts multiple shapes: { price }, { price_monthly }, { price_yearly }, or nested shapes.
 */
function normalizePlan(raw: any): SubscriptionPlan {
  // Try different fields in order of preference
  const rawPrice =
    raw?.price ??
    raw?.price_monthly ??
    raw?.price_month ??
    raw?.monthly_price ??
    raw?.amount ??
    raw?.cost ??
    0;

  const price = Number(rawPrice) || 0;

  const benefits =
    raw?.benefits ||
    raw?.features ||
    (Array.isArray(raw?.features_list) ? raw.features_list : undefined) ||
    [];

  return {
    id: String(raw?.id ?? raw?.planId ?? raw?.slug ?? raw?.name ?? Math.random().toString(36).slice(2, 8)),
    name: String(raw?.name ?? raw?.title ?? 'Unnamed Plan'),
    price,
    interval: raw?.interval ?? raw?.duration ?? undefined,
    description: raw?.description ?? raw?.desc ?? '',
    benefits: Array.isArray(benefits) ? benefits : [],
    raw
  };
}

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const data: any = await getJSON('/subscription/plans');

      // log the raw response so you can inspect it if shapes differ
      console.log('Subscription plans raw response:', data);

      // support multiple response shapes: { data: { plans: [] } } | { plans: [] } | []
      const rawList: any[] = data?.data?.plans ?? data?.plans ?? data ?? [];

      const normalized = (Array.isArray(rawList) ? rawList : []).map(normalizePlan);
      if (normalized.length === 0) throw new Error('No plans returned');
      setPlans(normalized);
    } catch (err) {
      console.error('fetchPlans error', err);
      toast.error('Could not load subscription plans. Showing defaults.');
      // fallback static plans (normalized)
      setPlans([
        normalizePlan({ id: 'free', name: 'Free Plan', price: 0, description: 'Free forever', benefits: ['Limited reading', 'Ads shown'] }),
        normalizePlan({ id: 'standard', name: 'Standard Plan', price: 99, description: 'Billed Monthly', benefits: ['Most magazines unlocked', 'No reading limits'] }),
        normalizePlan({ id: 'premium', name: 'Premium Plan', price: 199, description: 'Billed Monthly', benefits: ['Unlimited access', 'Ad-free experience'] })
      ]);
    }
  }

  async function handleSubscribe(plan: SubscriptionPlan) {
    console.log('handleSubscribe clicked', plan);
    if (typeof window === 'undefined') return;

    const user = getStoredUser();
    if (!user?.email) {
      toast('Please sign up or log in to subscribe.', { icon: 'ℹ️' });
      router.push('/signup');
      return;
    }

    const payload: PayPayload = {
      planId: plan.id,
      amount: plan.price,
      userId: user?.id || 'guest',
      userEmail: user.email,
      userPhone: user.phone || user.mobile || '',
      firstName: user.name || user.firstName || ''
    };

    try {
      setLoadingPlan(plan.id);
      await createOrderAndRedirect(payload);
      // If function returns without redirect, show message
      toast.error('Payment did not redirect. Check console for errors.');
    } catch (err) {
      console.error('createOrderAndRedirect failed', err);
      // toasts already shown in helper; we clear loading below
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6 text-center">Subscription Plans</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card key={plan.id} className="p-6 flex flex-col rounded-2xl shadow-md">
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-lg font-semibold mt-2">₹{(plan.price ?? 0).toLocaleString()}</p>
                <p className="text-sm text-slate-600 mt-2">{plan.description}</p>

                <ul className="mt-4 space-y-1 text-left text-slate-700">
                  {plan.benefits.length > 0 ? (
                    plan.benefits.map((b, i) => <li key={i}>✓ {b}</li>)
                  ) : (
                    <li className="text-slate-500">No listed benefits</li>
                  )}
                </ul>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => handleSubscribe(plan)}
                  // disable only the clicked plan button
                  disabled={loadingPlan !== null && loadingPlan !== plan.id}
                >
                  {loadingPlan === plan.id ? 'Processing...' : 'Subscribe Now'}
                </Button>

                <Button variant="outline" onClick={() => router.push(`/subscribe/${plan.id}`)}>
                  Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
