// app/admin-dashboard/notifications/page.tsx
"use client";

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Notifications & Communication</h2>
        <p className="text-muted-foreground text-sm">Send announcements and configure automated reminders.</p>
      </section>

      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Create Announcement</p>
          <input placeholder="Title" className="w-full px-3 py-2 bg-muted border border-border rounded-lg mt-2" />
          <textarea placeholder="Message" className="w-full px-3 py-2 bg-muted border border-border rounded-lg mt-2 h-28" />
          <div className="mt-3 flex gap-2">
            <select className="px-3 py-2 bg-muted border border-border rounded-lg">
              <option>All users</option>
              <option>Authors</option>
              <option>Reviewers</option>
              <option>Editors</option>
            </select>
            <button className="px-3 py-2 rounded border border-border bg-card">Send</button>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Automation</p>
          <div className="mt-2">
            <button className="px-3 py-2 rounded border border-border bg-card">Configure Reminders</button>
          </div>
        </div>
      </div>
    </div>
  );
}
