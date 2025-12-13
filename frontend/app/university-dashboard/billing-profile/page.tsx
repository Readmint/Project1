"use client";

import { CreditCard, Landmark, User } from "lucide-react";

export default function BillingProfilePage() {
  const bill = [
    { service: "Editing", qty: 70, rate: "₹X", total: "₹XX" },
    { service: "Designing", qty: 70, rate: "₹Y", total: "₹YY" },
    { service: "Special Issue", qty: 1, rate: "₹Z", total: "₹Z" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 py-2 space-y-8">

      <div>
        <h1 className="text-xl font-semibold text-foreground">Billing & Profile</h1>
        <p className="text-muted-foreground text-sm">
          View invoices, payments, and university account details.
        </p>
      </div>

      {/* BILL TABLE */}
      <section className="space-y-6">
        <h2 className="text-foreground font-medium flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> Billing Summary
        </h2>

        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          {bill.map((b, i) => (
            <div key={i} className="flex justify-between text-sm border-b border-border pb-2">
              <span>{b.service} (x{b.qty})</span>
              <span>{b.total}</span>
            </div>
          ))}

          <button className="mt-4 text-primary text-sm hover:underline">Download Invoice</button>
        </div>
      </section>

      {/* PROFILE */}
      <section className="space-y-6">
        <h2 className="text-foreground font-medium flex items-center gap-2">
          <User className="h-5 w-5 text-primary" /> University Profile
        </h2>

        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>Name:</strong> ABC University</p>
            <p><strong>Email:</strong> admin@abcuniv.ac.in</p>
            <p><strong>Address:</strong> Campus Road, New Delhi</p>
            <p><strong>Contact Person:</strong> Dr. Sharma</p>
          </div>

          <button className="text-primary text-sm hover:underline">Edit Profile</button>
        </div>
      </section>

    </div>
  );
}
