"use client";

import { PlusCircle, Calendar, FileText } from "lucide-react";

export default function EventsPage() {
  const sampleEvents = [
    { name: "National Research Conference", type: "Conference", department: "Science", date: "12–14 Feb 2025" },
    { name: "AI Workshop", type: "Workshop", department: "Computer Science", date: "03 Mar 2025" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 py-2 space-y-8">

      <div>
        <h1 className="text-xl font-semibold text-foreground">Events</h1>
        <p className="text-muted-foreground text-sm">
          Create and manage seminars, workshops, and conferences.
        </p>
      </div>

      {/* CREATE EVENT */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground font-medium">Create New Event</h2>
          <button className="px-4 py-2 bg-muted rounded-lg hover:bg-border transition-all flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-primary" />
            Create Event
          </button>
        </div>
      </div>

      {/* EVENT LIST */}
      <div className="space-y-6">
        <h2 className="text-foreground font-medium">Your Events</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {sampleEvents.map((evt, i) => (
            <div key={i} className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{evt.name}</h3>
              <p className="text-muted-foreground text-sm">{evt.type} — {evt.department}</p>

              <div className="flex items-center gap-2 text-sm text-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                {evt.date}
              </div>

              <div className="pt-3">
                <button className="text-primary text-sm hover:underline flex items-center gap-1">
                  <FileText className="w-4 h-4" /> View Event Folder
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
