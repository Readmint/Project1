// app/admin-dashboard/page.tsx
"use client";

import {
  Users,
  Activity,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Megaphone,
  ScanSearch,
} from "lucide-react";

const statItems = [
  { label: "Total Users", value: "—", icon: Users },
  { label: "Active Sessions", value: "—", icon: Activity },
  { label: "Submissions Today", value: "—", icon: FileText },
  { label: "Pending Reviews", value: "—", icon: Clock },
  { label: "Content Published Today", value: "—", icon: CheckCircle2 },
  { label: "System Alerts", value: "—", icon: AlertTriangle },
];

const actionItems = [
  { label: "Suspend User", description: "Action description", icon: UserX },
  { label: "Create Announcement", description: "Action description", icon: Megaphone },
  { label: "Run System Scan", description: "Action description", icon: ScanSearch },
];

export default function AdminDashboardHome() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Overview</h2>
        <p className="text-muted-foreground text-sm">
          High-level summary of platform health and quick actions.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        {statItems.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <p className="text-sm">{s.label}</p>
              </div>
              <p className="text-2xl font-semibold">{s.value}</p>
            </div>
          );
        })}
      </div>

      <section>
        <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
        <p className="text-muted-foreground text-sm">
          Common admin operations for urgent workflows.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        {actionItems.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              className="bg-card border border-border rounded-lg shadow-sm p-5 hover:bg-muted transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{a.label}</p>
              </div>
              <p className="text-muted-foreground text-sm mt-2">
                {a.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
