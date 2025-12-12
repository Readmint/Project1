// app/admin-dashboard/notifications/page.tsx
"use client";

import { Bell, AlertTriangle, CheckCircle, Mail } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-8">

      {/* PAGE HEADER */}
      <section>
        <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
        <p className="text-muted-foreground text-sm">
          View system alerts, plagiarism warnings, announcements, and automated reminders.
        </p>
      </section>

      {/* FILTERS + ACTIONS */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {["All", "Unread", "System", "Plagiarism", "Announcements"].map((f) => (
            <button
              key={f}
              className="
                px-3 py-1.5 rounded-lg border border-border bg-muted 
                text-sm hover:bg-muted-foreground/10 transition-all
              "
            >
              {f}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">
            Mark all as read
          </button>
          <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">
            Clear all
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
        {/* Example notification 1 */}
        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg border border-border">
          <AlertTriangle className="text-destructive h-5 w-5 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Plagiarism alert triggered</p>
            <p className="text-xs text-muted-foreground">
              Submission <span className="font-medium text-foreground">PLG-0028</span> exceeded the similarity threshold.
            </p>
            <p className="text-[10px] text-muted-foreground">2 hours ago</p>
          </div>
        </div>

        {/* Example notification 2 */}
        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg border border-border">
          <Bell className="text-primary h-5 w-5 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Reviewer did not run scan</p>
            <p className="text-xs text-muted-foreground">
              Reviewer for submission <span className="font-medium text-foreground">PLG-0018</span> did not run the required scan.
            </p>
            <p className="text-[10px] text-muted-foreground">5 hours ago</p>
          </div>
        </div>

        {/* Example notification 3 */}
        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg border border-border">
          <Mail className="text-primary h-5 w-5 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">New announcement scheduled</p>
            <p className="text-xs text-muted-foreground">
              System-wide announcement goes live in 1 hour.
            </p>
            <p className="text-[10px] text-muted-foreground">Today, 10:30 AM</p>
          </div>
        </div>

        {/* Example notification 4 */}
        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg border border-border">
          <CheckCircle className="text-accent h-5 w-5 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">System scan completed</p>
            <p className="text-xs text-muted-foreground">
              No major integrity issues detected.
            </p>
            <p className="text-[10px] text-muted-foreground">Yesterday</p>
          </div>
        </div>
      </div>

      {/* PAGINATION PLACEHOLDER */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all">
          Previous
        </button>
        <p>Page 1 of 5</p>
        <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all">
          Next
        </button>
      </div>
    </div>
  );
}
