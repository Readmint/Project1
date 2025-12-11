// app/admin-dashboard/security/page.tsx
"use client";

export default function SecurityPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Security & Permissions</h2>
        <p className="text-muted-foreground text-sm">Manage roles, 2FA enforcement, IP allowlist, and session control.</p>
      </section>

      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Role-based Access Control</p>
          <div className="mt-2">
            <button className="px-3 py-2 rounded border border-border bg-card">Edit Roles</button>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Two-factor enforcement</p>
          <div className="mt-2 flex gap-2">
            <label className="flex items-center gap-2"><input type="checkbox" /> Enforce 2FA for admins</label>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">IP Allowlist / Blocklist</p>
          <div className="mt-2 flex gap-2">
            <input placeholder="Add IP or CIDR" className="px-3 py-2 bg-muted border border-border rounded-lg" />
            <button className="px-3 py-2 rounded border border-border bg-card">Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
