"use client";

import { useState } from "react";
import { Bell, CheckCircle2, AlertTriangle, FileText, BookOpen, Filter, Trash2,} from "lucide-react";

type NotificationType =
  | "submission"
  | "plagiarism"
  | "review"
  | "editing"
  | "final"
  | "billing";

const notifications = [
  {
    id: 1,
    type: "submission" as NotificationType,
    title: "New topics extracted",
    description: "5 submissions were added from your uploaded Word file.",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    type: "plagiarism" as NotificationType,
    title: "Plagiarism report available",
    description: "Similarity score generated for 'AI in Healthcare'.",
    time: "5 hours ago",
    unread: true,
  },
  {
    id: 3,
    type: "review" as NotificationType,
    title: "Reviewer decision received",
    description: "Reviewer marked 'Quantum Materials' as Needs Correction.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: 4,
    type: "editing" as NotificationType,
    title: "Paper moved to Designing",
    description: "‘Blockchain Security’ is now in design stage.",
    time: "2 days ago",
    unread: false,
  },
  {
    id: 5,
    type: "final" as NotificationType,
    title: "Final PDF ready",
    description: "Designed version available for approval.",
    time: "3 days ago",
    unread: false,
  },
  {
    id: 6,
    type: "billing" as NotificationType,
    title: "Invoice generated",
    description: "Invoice INV-2025-002 is ready for download.",
    time: "4 days ago",
    unread: false,
  },
];

function getIcon(type: NotificationType) {
  switch (type) {
    case "submission":
      return <FileText className="h-5 w-5 text-primary" />;
    case "plagiarism":
      return <AlertTriangle className="h-5 w-5 text-primary" />;
    case "review":
      return <CheckCircle2 className="h-5 w-5 text-primary" />;
    case "editing":
      return <BookOpen className="h-5 w-5 text-primary" />;
    case "final":
      return <Bell className="h-5 w-5 text-primary" />;
    case "billing":
      return <FileText className="h-5 w-5 text-primary" />;
  }
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationType | "all">("all");
  const [showUnread, setShowUnread] = useState(false);

  const filteredNotifications = notifications.filter((n) => {
    if (showUnread && !n.unread) return false;
    if (filter !== "all" && n.type !== filter) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-2 py-2 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
        <p className="text-muted-foreground text-sm">
          Track updates across submissions, reviews, editing, and billing.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Filter className="h-4 w-4 text-primary" />
            Filter by:
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="submission">Submissions</option>
            <option value="plagiarism">Plagiarism</option>
            <option value="review">Reviews</option>
            <option value="editing">Editing & Design</option>
            <option value="final">Final Files</option>
            <option value="billing">Billing</option>
          </select>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showUnread}
              onChange={(e) => setShowUnread(e.target.checked)}
            />
            Show unread only
          </label>

          <button className="ml-auto text-sm text-primary hover:underline">
            Mark all as read
          </button>
        </div>
      </div>

      {/* NOTIFICATION LIST */}
      <div className="space-y-6">
        {filteredNotifications.length === 0 ? (
          <div className="bg-card border border-border rounded-lg shadow-sm p-5 text-sm text-muted-foreground">
            No notifications match the selected filters.
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`bg-card border border-border rounded-lg shadow-sm p-5 space-y-3 transition-all ${
                n.unread ? "hover:bg-muted" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  {getIcon(n.type)}

                  <div className="space-y-1">
                    <p className="text-foreground font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {n.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{n.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {n.unread && (
                    <span className="text-xs text-primary font-medium">
                      New
                    </span>
                  )}

                  <button
                    className="text-muted-foreground hover:text-foreground transition-all"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
