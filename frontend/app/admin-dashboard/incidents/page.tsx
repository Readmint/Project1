// app/admin-dashboard/incidents/page.tsx
"use client";

export default function IncidentsPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Incidents & Escalations</h2>
        <p className="text-muted-foreground text-sm">Create and manage incident tickets linking submissions and reports.</p>
      </section>

      <div className="bg-card border border-border rounded-lg shadow-sm p-5">
        <div className="flex gap-3 mb-4">
          <button className="px-3 py-2 rounded border border-border bg-card">New Incident</button>
          <input placeholder="Search incidents" className="px-3 py-2 bg-muted border border-border rounded-lg flex-1" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2">Ticket</th>
                <th>Submission</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="py-3">INC-001</td>
                <td>PLG-0003</td>
                <td>Legal</td>
                <td>Open</td>
                <td>
                  <button className="px-2 py-1 rounded border border-border bg-card">Open</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
