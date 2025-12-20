"use client";

import { ArrowRight } from "lucide-react";

export default function EditingPage() {
  const items = [
    { title: "AI in Healthcare", status: "Editing" },
    { title: "Nanotech Materials", status: "Pending" },
    { title: "Blockchain Security", status: "Designing" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 py-2 space-y-8">

      <div>
        <h1 className="text-xl font-semibold text-foreground">Editing & Design Workflow</h1>
        <p className="text-muted-foreground text-sm">Send approved topics to ReadMint and track progress.</p>
      </div>

      {/* SEND TO EDITING TEAM */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
        <h2 className="text-foreground font-medium">Send Papers to Editing Team</h2>
        <button className="px-4 py-2 bg-muted rounded-lg hover:bg-border transition-all flex items-center gap-2">
          Send Now <ArrowRight className="h-4 w-4 text-primary" />
        </button>
      </div>

      {/* STATUS LIST */}
      <div className="space-y-6">
        <h2 className="text-foreground font-medium">Current Editing Status</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {items.map((it, i) => (
            <div key={i} className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
              <h3 className="font-semibold text-foreground">{it.title}</h3>
              <p className="text-sm text-primary font-medium">{it.status}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
