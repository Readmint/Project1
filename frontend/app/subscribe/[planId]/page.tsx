// app/subscribe/[planId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { createOrderAndRedirect } from '@/lib/payments';
import { getJSON } from '@/lib/api';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  duration: string;
}



export default function SubscribePage() {
  const params: any = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '9999999999'
  });

  // ... 

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data: any = await getJSON('/subscription/plans');
        const fetchedRaw = data?.data?.plans ?? data?.plans ?? data ?? [];
        const fetchedPlans = (Array.isArray(fetchedRaw) ? fetchedRaw : []).map((p: any) => ({
          ...p,
          price_monthly: Number(p.price_monthly) || Number(p.price) || 0,
          price_yearly: Number(p.price_yearly) || 0
        }));
        if (!fetchedPlans.length) throw new Error('No plans');
        setPlans(fetchedPlans);
        const selected =
          fetchedPlans.find((p: SubscriptionPlan) => p.id === params.planId) ||
          fetchedPlans.find((p: SubscriptionPlan) => p.name.toLowerCase().includes((params.planId as string)?.toLowerCase()));
        if (!selected) {
          toast.error('Plan not found');
          router.push('/');
          return;
        }
        setPlan(selected);
        // prefill user info if logged
        const currentUser = getCurrentUser();
        if (currentUser) {
          setFormData({ name: currentUser.name || '', email: currentUser.email || '', phone: currentUser.phone || '9999999999' });
        }
      } catch (e) {
        console.warn('Failed to fetch plans, using fallback', e);
        toast.error('Failed to load plans. Using fallback plans.');
        const fallback = getFallbackPlans();
        setPlans(fallback);
        const selected = fallback.find(p => p.id === params.planId) || fallback[0];
        setPlan(selected);
      }
    };

    fetchPlans();
  }, [params.planId, router]);

  const getFallbackPlans = (): SubscriptionPlan[] => [
    {
      id: 'free',
      name: 'Free Plan',
      description: 'Perfect for casual readers',
      price_monthly: 0,
      price_yearly: 0,
      features: ['Access to free issues', 'Limited article views', 'Basic bookmarking', 'Community access'],
      duration: 'monthly'
    },
    {
      id: 'basic',
      name: 'Basic Plan',
      description: 'For regular readers',
      price_monthly: 100,
      price_yearly: 1000,
      features: [
        'All Free features',
        '5 premium issues per month',
        'Unlimited bookmarks',
        'Download for offline reading',
        'Ad-free experience',
        'Email support'
      ],
      duration: 'monthly'
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      description: 'For passionate readers',
      price_monthly: 200,
      price_yearly: 2000,
      features: [
        'All Basic features',
        'Unlimited premium issues',
        'Early access to new releases',
        'Exclusive author content',
        'Priority support',
        'Certificate of achievements',
        'Monthly webinars'
      ],
      duration: 'monthly'
    }
  ];

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  function getCurrentUser() {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  const handlePayment = async () => {
    if (!plan) return;
    if (!formData.name || !formData.email) {
      toast.error('Please enter required details');
      return;
    }

    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      const userId = currentUser?.id || 'guest';

      const requestData = {
        planId: plan.id,
        amount: plan.price_monthly,
        userId,
        userEmail: formData.email,
        userPhone: formData.phone,
        firstName: formData.name,
        lastName: ''
      };

      // Use shared helper
      await createOrderAndRedirect(requestData);
      // If it returns without redirect, something failed (helper throws on error).
    } catch (error: any) {
      console.error('Payment initiation error', error);
      // createOrderAndRedirect already shows toast; additional handling here if needed
    } finally {
      setLoading(false);
    }
  };

  const renderFeatures = (features: string[]) =>
    features?.map((f, i) => (
      <li key={i} className="flex items-start py-1 text-slate-700 dark:text-slate-300">
        <span className="text-green-500 mr-2 mt-1">✓</span> {f}
      </li>
    ));

  const formatPrice = (p: number) => (typeof p === 'number' ? p.toFixed(2) : '0.00');

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Loading plan details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-4 text-slate-900 dark:text-white">
        <h1 className="text-3xl font-bold text-center mb-8">Complete Your Subscription</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
            <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{plan.description}</p>

            <div className="mb-6">
              <div className="text-3xl font-bold text-indigo-600">
                ₹{formatPrice(plan.price_monthly)}
                <span className="text-lg text-slate-500 dark:text-slate-400">/month</span>
              </div>

              {plan.price_yearly > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Or ₹{formatPrice(plan.price_yearly)}/year
                </p>
              )}
            </div>

            <h3 className="font-semibold text-lg mb-3">Features</h3>
            <ul>{renderFeatures(plan.features)}</ul>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Payment Details</h2>

            <div className="space-y-4 mb-6">
              <Input label="Full Name *" name="name" formData={formData} handler={handleInputChange} />
              <Input label="Email Address *" name="email" formData={formData} handler={handleInputChange} />
              <Input label="Phone Number *" name="phone" formData={formData} handler={handleInputChange} />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
              <SummaryRow label="Plan" value={plan.name} />
              <SummaryRow label="Billing Cycle" value={plan.duration} />
              <SummaryRow label="Total Amount" value={`₹${formatPrice(plan.price_monthly)}`} bold />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center">
              By subscribing, you agree to our <a href="/refund-policy" target="_blank" className="text-indigo-600 underline">Refund Policy</a> and <a href="/terms" target="_blank" className="text-indigo-600 underline">Terms</a>.
            </p>

            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Processing…' : `Pay ₹${formatPrice(plan.price_monthly)} Now`}
            </Button>

            <p className="text-center text-sm mt-6 text-slate-500 dark:text-slate-400 cursor-pointer"
              onClick={() => router.back()}>
              ← Back to plans
            </p>
          </div>
        </div>

        {plans.length > 1 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-6">Other Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans
                .filter((p) => p.id !== plan.id)
                .map((other) => (
                  <div key={other.id} className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-lg mb-2">{other.name}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">{other.description}</p>
                    <p className="text-xl font-bold text-indigo-600">₹{formatPrice(other.price_monthly)}/month</p>

                    <Button onClick={() => router.push(`/subscribe/${other.id}`)} variant="outline" className="w-full mt-4 border-slate-300 dark:border-slate-600">
                      View Details
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Small helper components */
function Input({ label, name, formData, handler }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={formData[name]}
        onChange={handler}
        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none"
      />
    </div>
  );
}
function SummaryRow({ label, value, bold = false }: any) {
  return (
    <div className="flex justify-between items-center py-1 text-sm text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      <span className={bold ? 'font-bold text-indigo-600' : 'font-medium'}>{value}</span>
    </div>
  );
}
