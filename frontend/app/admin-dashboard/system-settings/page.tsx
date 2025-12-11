// app/admin-dashboard/system-settings/page.tsx
"use client";

export default function SystemSettingsPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">System Settings — Plagiarism Engine</h2>
        <p className="text-muted-foreground text-sm">Configure providers, thresholds, retention and webhooks.</p>
      </section>

      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Plagiarism Providers</p>
            <div className="flex gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Provider A
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Provider B
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Default Thresholds</p>
            <div className="flex gap-2">
              <input placeholder="Article %" className="px-3 py-2 bg-muted border border-border rounded-lg w-28" />
              <input placeholder="Research %" className="px-3 py-2 bg-muted border border-border rounded-lg w-28" />
              <button className="px-3 py-2 rounded border border-border bg-card">Save</button>
            </div>
          </div>
        </div>

        <div className="bg-muted border border-border rounded-lg p-3">
          <p className="text-sm text-muted-foreground">Retention Policy</p>
          <div className="mt-2 flex gap-3">
            <input placeholder="Retain reports for (months)" className="px-3 py-2 bg-card border border-border rounded-lg w-40" />
            <button className="px-3 py-2 rounded border border-border bg-card">Update</button>
          </div>
        </div>

        <div className="bg-muted border border-border rounded-lg p-3">
          <p className="text-sm text-muted-foreground">API Keys & Webhooks</p>
          <div className="mt-2">
            <input placeholder="Provider API Key" className="px-3 py-2 bg-card border border-border rounded-lg w-full" />
            <div className="mt-2 flex gap-2">
              <button className="px-3 py-2 rounded border border-border bg-card">Save Key</button>
              <button className="px-3 py-2 rounded border border-border bg-card">Test Connection</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
