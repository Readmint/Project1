// app/page.tsx (or pages/index.tsx)
'use client';

import HeroCarousel from "@/components/home/HeroCarousel";
import FeaturedMagazines from "@/components/home/FeaturedMagazines";
import SubscriptionPlans from "@/components/home/SubscriptionPlans";
import AuthorSection from "@/components/home/AuthorSection";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { createOrderAndRedirect, PayPayload } from "@/lib/payments";

type AdvertisementPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  perks: string[];
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

export default function HomePage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const adPlans: AdvertisementPlan[] = [
    {
      id: 'silver',
      name: 'Silver Reach',
      price: 12000,
      description: 'Amplify your brand visibility with long-lasting magazine presence.',
      perks: [
        'Full-page advertisement in 1 issue',
        'Newsletter brand mention',
        'Brand collaborator badge for 1 month'
      ]
    },
    {
      id: 'gold',
      name: 'Gold Spotlight',
      price: 28000,
      description: 'Expand your brand influence across multi-channel promotions.',
      perks: [
        'Ad placement in 3 magazine issues',
        'Homepage logo display',
        'Exclusive brand highlight feature'
      ]
    },
    {
      id: 'platinum',
      price: 80000,
      name: 'Platinum Domination',
      description: 'Premium brand takeover for maximum cultural visibility.',
      perks: [
        'Hero banner placement',
        'Dedicated magazine issue branding',
        'CEO interview + featured article'
      ]
    }
  ];

  // contact modal state for guest ads flow
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactPlan, setContactPlan] = useState<AdvertisementPlan | null>(null);
  const [contactData, setContactData] = useState({ name: '', email: '', phone: '9999999999' });

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

  async function handleEnquire(plan: AdvertisementPlan) {
    if (typeof window === 'undefined') return;

    const user = getStoredUser();
    const hasEmail = !!user?.email;

    if (!hasEmail) {
      openContactModalForPlan(plan);
      toast('Please provide contact details to continue.', { icon: 'ℹ️' });
      return;
    }

    const payload: PayPayload = {
      planId: plan.id,
      amount: plan.price,
      userId: user?.id || 'guest',
      userEmail: user.email,
      userPhone: user.phone || user.mobile || '',
      firstName: user.name || user.firstName || '',
    };

    try {
      setLoadingPlan(plan.id);
      await createOrderAndRedirect(payload);
    } catch (err) {
      // error already handled by helper
      setLoadingPlan(null);
    }
  }

  async function handleModalProceed() {
    if (!contactPlan) return;
    if (!contactData.name || !contactData.email) {
      toast.error('Name & Email are required!');
      return;
    }

    try { localStorage.setItem('guest_contact', JSON.stringify(contactData)); } catch { }

    const payload: PayPayload = {
      planId: contactPlan.id,
      amount: contactPlan.price,
      userId: 'guest',
      userEmail: contactData.email,
      userPhone: contactData.phone,
      firstName: contactData.name,
    };

    closeContactModal();

    try {
      setLoadingPlan(contactPlan.id);
      await createOrderAndRedirect(payload);
    } catch (err) {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <HeroCarousel />

      {/* FEATURED MAGAZINES */}
      <section className="py-16">
        <FeaturedMagazines />
      </section>

      {/* SUBSCRIPTION PLANS (uses same createOrderAndRedirect internally) */}
      <SubscriptionPlans />

      {/* ADVERTISEMENT PLANS */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800" id="advertise">
        <div className="max-w-6xl mx-auto px-4 text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Advertise With Us</h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg max-w-3xl mx-auto">
            Reach a premium, culturally engaged audience with high-impact placements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
          {adPlans.map(ad => (
            <Card key={ad.id} className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold mb-2">{ad.name}</h3>
              <p className="text-xl font-semibold mb-4">₹{ad.price.toLocaleString()}</p>
              <p className="text-slate-500 dark:text-slate-400 mb-6">{ad.description}</p>

              <ul className="space-y-2 mb-6 text-slate-700 dark:text-slate-300">
                {ad.perks.map((perk, i) => (
                  <li key={i}>✓ {perk}</li>
                ))}
              </ul>

              <Button
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={() => router.push('/advertisement')}
                disabled={loadingPlan !== null}
              >
                Learn More & Advertise
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <AuthorSection />

      {/* CTA */}
      <section className="bg-indigo-600 text-white py-20 mt-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Reading?</h2>
          <p className="text-lg opacity-90 mb-8">Join thousands of readers today</p>

          <div className="flex justify-center gap-6">
            <Button className="bg-white text-indigo-600 hover:bg-slate-100" onClick={() => router.push('/signup')}>Get Started</Button>
            <Button className="bg-white text-indigo-600 hover:bg-slate-100" onClick={() => router.push('/issues')}>Browse Issues</Button>
          </div>
        </div>
      </section>

      {/* CONTACT MODAL */}
      {showContactModal && contactPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-2">Your Contact Details</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Required for booking the <strong>{contactPlan.name}</strong> advertising plan.
            </p>

            <div className="space-y-3">
              <input name="name" placeholder="Full Name" value={contactData.name} onChange={handleContactChange} className="w-full px-3 py-2 rounded border" />
              <input name="email" placeholder="Email" value={contactData.email} onChange={handleContactChange} className="w-full px-3 py-2 rounded border" />
              <input name="phone" placeholder="Phone" value={contactData.phone} onChange={handleContactChange} className="w-full px-3 py-2 rounded border" />
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
