"use client";

import { useState } from "react";

export default function NotificationsPage() {
  const [announcement, setAnnouncement] = useState({
    title: "",
    message: "",
    target: "All Users",
  });

  const dummyHistory = [
    {
      id: 1,
      title: "Maintenance Window",
      target: "All Users",
      sentAt: "2025-01-10",
      method: "Email + In-App",
    },
    {
      id: 2,
      title: "Reviewer Reminder",
      target: "Reviewers",
      sentAt: "2025-01-07",
      method: "In-App",
    },
  ];

  const dummyAutomation = [
    { id: 1, type: "Pending Verifications Reminder", frequency: "Daily", status: "Active" },
    { id: 2, type: "Author Certificate Eligibility Notice", frequency: "Weekly", status: "Paused" },
  ];

  return (
    <main className="max-w-7xl mx-auto px-2 py-2 space-y-8">
      {/* Section Header */}
      <section>
        <h2 className="text-xl font-semibold text-foreground">Notifications & Communication</h2>
        <p className="text-muted-foreground text-sm">
          Send announcements, targeted messages, and manage automated reminder systems.
        </p>
      </section>

      {/* Create Announcement */}
      <section className="space-y-6">
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="text-lg font-medium text-foreground">Create Announcement</h3>
          <p className="text-sm text-muted-foreground">Send a global or targeted system message.</p>

          <div className="space-y-3">
            <input
              placeholder="Title"
              value={announcement.title}
              onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
            />

            <textarea
              placeholder="Message"
              value={announcement.message}
              onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg h-28"
            />

            <div className="flex flex-wrap gap-3 pt-1">
              <select
                className="px-3 py-2 bg-muted border border-border rounded-lg"
                value={announcement.target}
                onChange={(e) => setAnnouncement({ ...announcement, target: e.target.value })}
              >
                <option>All Users</option>
                <option>Authors</option>
                <option>Reviewers</option>
                <option>Editors</option>
                <option>Content Managers</option>
              </select>

              <button className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">
                Send Announcement
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Automated Reminders */}
      <section className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-foreground">Automated Reminders</h3>
          <p className="text-muted-foreground text-sm">
            Configure periodic reminders and workflow nudges for contributors.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {dummyAutomation.map((a) => (
              <div
                key={a.id}
                className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-2 hover:bg-muted transition-all"
              >
                <div className="text-foreground font-medium">{a.type}</div>
                <p className="text-sm text-muted-foreground">Frequency: {a.frequency}</p>
                <p className="text-primary text-sm font-semibold">{a.status}</p>

                <div className="flex gap-2 pt-2">
                  <button className="px-3 py-1 text-xs rounded border border-border bg-card hover:bg-muted transition-all">
                    Edit
                  </button>
                  <button className="px-3 py-1 text-xs rounded border border-border bg-card hover:bg-muted transition-all">
                    Disable
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">
            Add New Automation Rule
          </button>
        </div>
      </section>

      {/* Announcement History */}
      <section className="space-y-6 pb-4">
        <div>
          <h3 className="text-lg font-medium text-foreground">Announcement History</h3>
          <p className="text-muted-foreground text-sm">
            Review previously sent system communications.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dummyHistory.map((h) => (
              <div
                key={h.id}
                className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-3 hover:bg-muted transition-all"
              >
                <div className="text-foreground font-medium">{h.title}</div>
                <p className="text-sm text-muted-foreground">{h.target}</p>
                <p className="text-sm text-muted-foreground">Sent: {h.sentAt}</p>
                <p className="text-primary text-sm font-semibold">{h.method}</p>

                <button className="px-3 py-1 text-xs rounded border border-border bg-card hover:bg-muted transition-all">
                  View Details
                </button>
              </div>
            ))}
          </div>

          {dummyHistory.length === 0 && (
            <div className="bg-muted border border-border rounded-lg p-4 text-sm text-muted-foreground">
              No announcements have been sent yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
