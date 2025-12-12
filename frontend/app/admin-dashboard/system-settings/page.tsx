// app/admin-dashboard/system-settings/page.tsx
"use client";

import {
  CheckSquare,
  ShieldCheck,
  Sliders,
  CalendarClock,
  KeyRound,
  Bell,
  Save,
  RefreshCcw,
} from "lucide-react";

export default function SystemSettingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-2 py-2 space-y-8">

      {/* Page Header */}
      <section>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Sliders className="h-5 w-5 text-primary" />
          System Settings — Plagiarism Engine
        </h2>
        <p className="text-muted-foreground text-sm">
          Configure providers, thresholds, retention policies, alerts, and secure API credentials.
        </p>
      </section>

      {/* Providers */}
      <section className="space-y-6">
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Plagiarism Providers
          </h3>
          <p className="text-muted-foreground text-sm">
            Select which providers should be used during similarity checks.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                Provider A (Primary)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                Provider B (Supplementary)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                Provider C (Beta)
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Thresholds */}
      <section className="space-y-6">
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Similarity Thresholds
          </h3>
          <p className="text-muted-foreground text-sm">
            Set actionable similarity scores per content type.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Article</p>
              <input
                placeholder="e.g. 18%"
                defaultValue="18%"
                className="px-3 py-2 bg-muted border border-border rounded-lg w-32"
              />
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Research Paper</p>
              <input
                placeholder="e.g. 12%"
                defaultValue="12%"
                className="px-3 py-2 bg-muted border border-border rounded-lg w-32"
              />
            </div>
          </div>

          <button className="px-4 py-2 rounded border border-border bg-card hover:bg-muted transition-all flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Thresholds
          </button>
        </div>
      </section>

      {/* Auto-Lock Rules & Notifications */}
      <section className="space-y-6">
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Auto-Lock Rules & Notifications
          </h3>
          <p className="text-muted-foreground text-sm">
            Configure automated flags, locks, and alerts for high-risk submissions.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Auto-lock content above threshold
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Notify admin on every high-risk scan
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" />
              Notify user when content is flagged
            </label>
          </div>

          <button className="px-4 py-2 rounded border border-border bg-card hover:bg-muted transition-all flex items-center gap-2">
            <Save className="h-4 w-4" />
            Update Rules
          </button>
        </div>
      </section>

      {/* Retention Policy */}
      <section className="space-y-6">
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            Retention Policy
          </h3>
          <p className="text-muted-foreground text-sm">
            Determine how long plagiarism reports should be stored.
          </p>

          <div className="flex items-center gap-3">
            <input
              placeholder="24 months"
              defaultValue="24"
              className="px-3 py-2 bg-muted border border-border rounded-lg w-40"
            />
            <button className="px-4 py-2 rounded border border-border bg-card hover:bg-muted transition-all flex items-center gap-2">
              <Save className="h-4 w-4" />
              Update Retention
            </button>
          </div>
        </div>
      </section>

      {/* API Keys */}
      <section className="space-y-6">
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            API Keys & Access Controls
          </h3>
          <p className="text-muted-foreground text-sm">
            Securely manage API credentials used for provider verification.
          </p>

          <input
            placeholder="Provider API Key"
            className="px-3 py-2 bg-muted border border-border rounded-lg w-full"
            defaultValue="pk_live_xxxxxxxx"
          />

          <div className="flex gap-2 pt-1">
            <button className="px-4 py-2 rounded border border-border bg-card hover:bg-muted transition-all flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Key
            </button>
            <button className="px-4 py-2 rounded border border-border bg-card hover:bg-muted transition-all flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Test Connection
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
