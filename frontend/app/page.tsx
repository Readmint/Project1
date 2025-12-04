'use client';

import HeroCarousel from "@/components/home/HeroCarousel";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AuthorSection from "@/components/home/AuthorSection";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface AdvertisementPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  perks: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const PAYU_PAYMENT_URL =
  process.env.NEXT_PUBLIC_PAYU_MODE === 'production'
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment';

export default function HomePage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const adPlans: AdvertisementPlan[] = [
    {
      id: 'silver',
      name: 'Silver Reach',
      price: 12000,
      description: 'Boost visibility among magazine readers',
      perks: [
        'Full-page ad in one issue',
        'Newsletter shoutout',
        '1 month collaborator badge'
      ]
    },
    {
      id: 'gold',
      name: 'Gold Spotlight',
      price: 28000,
      description: 'High-impact multi-channel presence',
      perks: [
        '3 issue placements',
        'Homepage logo display',
        'Exclusive brand feature'
      ]
    },
    {
      id: 'platinum',
      price: 80000,
      name: 'Platinum Domination',
      description: 'Premium brand takeover experience',
      perks: [
        'Hero banner placement',
        'Dedicated issue branding',
        'CEO interview feature'
      ]
    }
  ];

  // Modal state to collect contact info if user not logged in or missing email
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactPlan, setContactPlan] = useState<AdvertisementPlan | null>(null);
  const [contactData, setContactData] = useState({ name: '', email: '', phone: '9999999999' });

  // Helper to get stored user (if you already save a user object in localStorage)
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

  function openContactModalForPlan(plan: AdvertisementPlan) {
    setContactPlan(plan);
    setShowContactModal(true);
  }

  function closeContactModal() {
    setShowContactModal(false);
    setContactPlan(null);
    setContactData({ name: '', email: '', phone: '9999999999' });
  }

  function handleContactChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setContactData(prev => ({ ...prev, [name]: value }));
  }

  // MAIN: improved handleEnquire that uses stored user or opens inline modal to collect details
  async function handleEnquire(plan: AdvertisementPlan) {
    // guard SSR
    if (typeof window === 'undefined') {
      toast.error('Payment cannot be initiated from the server');
      return;
    }

    // read local user (if any)
    const user = getStoredUser();

    // If we don't have an email or name, open modal to collect contact details
    const hasEmail = !!(user?.email);
    if (!hasEmail) {
      // open modal to collect name/email/phone for this plan
      openContactModalForPlan(plan);
      toast('Please enter contact details to proceed.', { icon: 'ℹ️' });
      return;
    }

    // build payload using stored user
    const userId = user?.id || 'guest';
    const payload = {
      planId: plan.id,
      amount: plan.price,
      userId,
      userEmail: user.email || '',
      userPhone: user.phone || user.mobile || ''
    };

    await createOrderAndRedirect(payload, plan.id);
  }

  // Called either by the modal (guest contact info) or directly from handleEnquire
  async function createOrderAndRedirect(payload: {
    planId: string;
    amount: number;
    userId: string;
    userEmail: string;
    userPhone?: string;
    firstName?: string;
  }, planIdForLoading?: string) {
    setLoadingPlan(planIdForLoading || payload.planId);
    toast.loading('Initiating payment...', { id: 'pay' });

    try {
      const res = await fetch(`${API_BASE}/api/subscription/payu/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          firstName: payload.firstName || ''
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || data.status !== 'success') {
        const msg = data?.message || `Failed to create payment order (status ${res?.status})`;
        throw new Error(msg);
      }

      const params = data.data || {};

      // parse hash safely (backend sends JSON-stringified object { v1, v2 })
      let payuHash = '';
      if (params.hash) {
        try {
          const parsed = typeof params.hash === 'string' ? JSON.parse(params.hash) : params.hash;
          payuHash = parsed.v1 || parsed.v2 || '';
        } catch {
          payuHash = typeof params.hash === 'string' ? params.hash : '';
        }
      }

      // build form and submit to PayU
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = PAYU_PAYMENT_URL;

      const fields: Record<string, string> = {
        key: params.key || '',
        txnid: params.txnid || '',
        amount: (params.amount || '').toString(),
        productinfo: params.productinfo || 'Advertisement Plan',
        firstname: params.firstname || '',
        email: params.email || payload.userEmail || '',
        phone: params.phone || payload.userPhone || '',
        surl: params.surl || `${window.location.origin}/payment/success`,
        furl: params.furl || `${window.location.origin}/payment/failure`,
        hash: payuHash || '',
        service_provider: params.service_provider || 'payu_paisa',
        udf1: params.udf1 || '',
        udf2: params.udf2 || '',
        udf3: params.udf3 || '',
        udf4: params.udf4 || '',
        udf5: params.udf5 || ''
      };

      Object.entries(fields).forEach(([k, v]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        input.value = v ?? '';
        form.appendChild(input);
      });

      document.body.appendChild(form);
      toast.success('Redirecting to payment gateway...', { id: 'pay' });
      form.submit();
    } catch (err: any) {
      console.error('Payment init error', err);
      toast.error(err?.message || 'Payment initialization failed', { id: 'pay' });
    } finally {
      setLoadingPlan(null);
    }
  }

  // Called when user fills modal and hits "Proceed to Pay"
  async function handleModalProceed() {
    if (!contactPlan) return;
    if (!contactData.name || !contactData.email) {
      toast.error('Please enter name and email');
      return;
    }

    // Use 'guest' user id when not logged in
    const stored = getStoredUser();
    const userId = stored?.id || 'guest';

    const payload = {
      planId: contactPlan.id,
      amount: contactPlan.price,
      userId,
      userEmail: contactData.email,
      userPhone: contactData.phone,
      firstName: contactData.name
    };

    // Optionally save guest contact locally for session convenience
    try {
      localStorage.setItem('guest_contact', JSON.stringify({ name: contactData.name, email: contactData.email, phone: contactData.phone }));
    } catch {}

    closeContactModal();
    await createOrderAndRedirect(payload, contactPlan.id);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-y-auto">
      <HeroCarousel />

      {/* ADVERTISEMENT PLANS */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Advertisement Plans</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Reach the audience shaping culture</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
          {adPlans.map((ad) => (
            <Card key={ad.id} className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-lg p-8 flex flex-col border hover:border-indigo-500 transition-all duration-300">
              <h3 className="text-2xl font-bold mb-2">{ad.name}</h3>
              <p className="text-xl font-semibold mb-4">₹{ad.price.toLocaleString()}</p>
              <p className="text-slate-600 dark:text-slate-400 mb-6">{ad.description}</p>
              <ul className="space-y-2 flex-grow text-slate-700 dark:text-slate-300 mb-6">
                {ad.perks.map((perk, idx) => <li key={idx}>✓ {perk}</li>)}
              </ul>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => handleEnquire(ad)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === ad.id ? 'Processing...' : 'Enquire Now'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push(`/subscribe/${ad.id}`)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <AuthorSection />

      {/* CTA */}
      <section className="bg-indigo-600 text-white py-20 mt-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Reading?</h2>
          <p className="text-lg opacity-90 mb-8">Join thousands of readers and get access to premium content today</p>
          <div className="flex justify-center gap-6">
            <Button className="bg-white text-indigo-600 hover:bg-slate-100" onClick={() => router.push('/signup')}>Get Started for Free</Button>
            <Button className="bg-white text-indigo-600 hover:bg-slate-100" onClick={() => router.push('/issues')}>Browse Issues</Button>
          </div>
          <div className="mt-8 text-sm opacity-80"><p>No credit card required for free plan • Cancel anytime • No hidden fees</p></div>
        </div>
      </section>

      {/* CONTACT MODAL (inline) */}
      {showContactModal && contactPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-2">Provide Contact Details</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">We need your name & email to create the payment order for the <strong>{contactPlan.name}</strong> plan.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Full name</label>
                <input name="name" value={contactData.name} onChange={handleContactChange} className="w-full px-3 py-2 rounded border" />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input name="email" value={contactData.email} onChange={handleContactChange} className="w-full px-3 py-2 rounded border" />
              </div>
              <div>
                <label className="block text-sm mb-1">Phone</label>
                <input name="phone" value={contactData.phone} onChange={handleContactChange} className="w-full px-3 py-2 rounded border" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={closeContactModal}>Cancel</Button>
              <Button className="bg-indigo-600 text-white" onClick={handleModalProceed}>Proceed to Pay</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
