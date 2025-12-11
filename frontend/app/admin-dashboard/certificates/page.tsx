// app/admin-dashboard/certificates/page.tsx
"use client";

export default function CertificatesPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Certificates & Recognition</h2>
        <p className="text-muted-foreground text-sm">Configure generation criteria, reissue and revoke certificates.</p>
      </section>

      <div className="bg-card border border-border rounded-lg shadow-sm p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Auto-generation rules</p>
            <div className="mt-2 space-y-3">
              <label className="text-sm text-muted-foreground"># Published & Approved Reviews</label>
              <input placeholder="e.g., 10 published" className="px-3 py-2 bg-muted border border-border rounded-lg w-full" />
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Active Certificates</p>
            <div className="mt-2">
              <div className="bg-muted border border-border rounded p-3 text-sm">No certificates yet</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="px-3 py-2 rounded border border-border bg-card">Issue</button>
          <button className="px-3 py-2 rounded border border-border bg-card">Revoke</button>
        </div>
      </div>
    </div>
  );
}
