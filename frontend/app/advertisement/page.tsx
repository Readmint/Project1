"use client";

import { useState } from "react";
import AdHero from "@/components/advertisements/ad-hero";
import AdStats from "@/components/advertisements/ad-stats";
import AdFormatsSection from "@/components/advertisements/ad-formats";
import AdCTA from "@/components/advertisements/ad-cta";
import ContactSalesModal from "@/components/advertisements/contact-sales-modal";
import AdPricing from "@/components/advertisements/ad-pricing";

export default function AdvertisementsPage() {
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name?: string, id?: string }>({});

  const handleOpenContact = (planName?: string, planId?: string) => {
    setSelectedPlan({ name: planName, id: planId });
    setContactOpen(true);
  };

  return (
    <main className="relative bubble-bg min-h-screen">
      <div className="relative z-10">
        <AdHero onContactSales={() => handleOpenContact()} />
        <AdStats />
        <AdFormatsSection />
        <AdPricing onContactSales={handleOpenContact} />
        <AdCTA onContactSales={() => handleOpenContact()} />
      </div>

      <ContactSalesModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        initialPlanName={selectedPlan.name}
        initialPlanId={selectedPlan.id}
      />
    </main>
  );
}
