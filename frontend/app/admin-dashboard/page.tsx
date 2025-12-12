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
  ClipboardList,
  Bell,
} from "lucide-react";

//
// OVERVIEW METRICS (with icons + realistic dummy data)
//
const statItems = [
  { label: "Total Users", value: "12,540", icon: Users },
  { label: "Active Sessions (DAU)", value: "1,284", icon: Activity },
  { label: "Submissions Today", value: "67", icon: FileText },
  { label: "Pending Reviews", value: "14", icon: Clock },
  { label: "Editors Queue", value: "8", icon: ClipboardList }, // SRS requirement
  { label: "Content Published Today", value: "23", icon: CheckCircle2 },
];

//
// ALERTS & SYSTEM NOTIFICATIONS
//
const alerts = [
  {
    label: "High similarity detected",
    icon: AlertTriangle,
    description: "Submission PLG-0028 exceeded similarity threshold.",
  },
  {
    label: "Reviewer missed required scan",
    icon: AlertTriangle,
    description: "Reviewer assigned to PLG-0018 did not run scan.",
  },
  {
    label: "System update scheduled",
    icon: Bell,
    description: "Platform maintenance planned for tonight at 2 AM.",
  },
];

//
// QUICK ACTIONS
//
const actionItems = [
  { label: "Suspend User", description: "Immediately suspend a user account", icon: UserX },
  { label: "Create Announcement", description: "Send a platform-wide message", icon: Megaphone },
  { label: "Run System Scan", description: "Check for vulnerabilities and issues", icon: ScanSearch },
];

export default function AdminDashboardHome() {
  return (
    <div className="space-y-8">

      {/* HEADER */}
      <section>
        <h2 className="text-xl font-semibold text-foreground">Overview</h2>
        <p className="text-muted-foreground text-sm">
          High-level summary of platform health and quick actions.
        </p>
      </section>

      {/* METRICS GRID */}
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

      {/* ALERTS & SYSTEM NOTIFICATIONS (SRS REQUIREMENT) */}
      <section>
        <h2 className="text-xl font-semibold text-foreground">Alerts & System Notifications</h2>
        <p className="text-muted-foreground text-sm">
          Important system messages requiring your attention.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        {alerts.map((a, idx) => {
          const Icon = a.icon;
          return (
            <div
              key={idx}
              className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-destructive" />
                <p className="font-medium text-foreground">{a.label}</p>
              </div>
              <p className="text-muted-foreground text-sm">{a.description}</p>
            </div>
          );
        })}
      </div>

      {/* QUICK ACTIONS */}
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
              className="
                bg-card border border-border rounded-lg shadow-sm 
                p-5 hover:bg-muted transition-all text-left
              "
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{a.label}</p>
              </div>
              <p className="text-muted-foreground text-sm mt-2">{a.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
