"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function StartAdvertisingPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-bold mb-4 text-foreground">
        Start Advertising
      </h1>

      <p className="text-muted-foreground mb-8">
        Tell us about your brand and campaign goals. Our team will reach out
        shortly.
      </p>

      <form className="space-y-6">
        <Input placeholder="Company Name" required />
        <Input placeholder="Contact Person" required />
        <Input type="email" placeholder="Business Email" required />
        <Input placeholder="Estimated Budget (₹)" />
        <Textarea
          placeholder="Describe your campaign goals"
          rows={5}
        />

        <Button type="submit" size="lg" className="w-full">
          Submit Inquiry
        </Button>
      </form>
    </main>
  );
}
