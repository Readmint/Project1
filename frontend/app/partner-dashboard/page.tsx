"use client";

import { FileText, FolderOpen, Upload, ClipboardList, CheckCircle2, BookOpen, Settings, CreditCard } from "lucide-react";
import Link from "next/link";

export default function PartnerDashboardHome() {
  const modules = [
    { name: "Create Event", icon: FolderOpen, href: "/partner-dashboard/events" },
    { name: "Upload Word File", icon: Upload, href: "/partner-dashboard/submissions" }, // Assuming submissions page handles upload
    { name: "Extracted Topics", icon: FileText, href: "/partner-dashboard/submissions" },
    { name: "Plagiarism Status", icon: ClipboardList, href: "/partner-dashboard/review" },
    { name: "Review Panel", icon: CheckCircle2, href: "/partner-dashboard/review" },
    { name: "Send to Editing Team", icon: BookOpen, href: "/partner-dashboard/editing" },
    { name: "Final Designed Files", icon: FileText, href: "/partner-dashboard/final-outputs" },
    { name: "Special Issue", icon: BookOpen, href: "/partner-dashboard/final-outputs" },
    { name: "Billing & Invoices", icon: CreditCard, href: "/partner-dashboard/billing-profile" },
    { name: "Partner Profile", icon: Settings, href: "/partner-dashboard/billing-profile" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 py-2 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Partner Dashboard</h1>
        <p className="text-muted-foreground text-sm">A clean overview of your event workflow and submissions.</p>
      </div>

      {/* MODULE GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => (
          <Link key={m.name} href={m.href}>
            <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3 hover:bg-muted transition-all cursor-pointer">
              <m.icon className="h-6 w-6 text-primary" />
              <p className="text-foreground font-medium">{m.name}</p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
