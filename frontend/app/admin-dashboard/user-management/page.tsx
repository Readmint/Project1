// app/admin-dashboard/user-management/page.tsx
"use client";

export default function UserManagementPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">User & Role Management</h2>
        <p className="text-muted-foreground text-sm">Search users, view profiles, edit roles, suspend/reactivate, audit changes.</p>
      </section>

      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-3">
          <input placeholder="Search by name / email / id" className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg" />
          <select className="px-3 py-2 bg-muted border border-border rounded-lg">
            <option>All roles</option>
            <option>Author</option>
            <option>Reviewer</option>
            <option>Editor</option>
            <option>CM</option>
          </select>
          <button className="px-3 py-2 rounded-lg border border-border bg-card">Apply</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-muted-foreground">
                <th className="py-2">User</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Placeholder row */}
              <tr className="border-t border-border">
                <td className="py-3">Jane Doe — jane@example.com</td>
                <td>Author</td>
                <td>2024-06-12</td>
                <td>2025-12-01</td>
                <td className="space-x-2">
                  <button className="px-2 py-1 rounded border border-border bg-card">View</button>
                  <button className="px-2 py-1 rounded border border-border bg-card">Impersonate</button>
                  <button className="px-2 py-1 rounded border border-border bg-card">Suspend</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-muted-foreground text-sm">Audit logs are accessible via Audit Logs section for detailed change history.</p>
      </div>
    </div>
  );
}
