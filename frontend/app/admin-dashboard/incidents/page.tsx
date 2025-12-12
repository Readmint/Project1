"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, FileWarning, UserCog, ArchiveRestore, CheckCircle2 } from "lucide-react";

/* ----------------------------------------------------
   DUMMY INCIDENT DATA
---------------------------------------------------- */
const incidents = [
  {
    id: "INC-001",
    submission: "PLG-0023",
    title: "High similarity detected (78%)",
    owner: "Legal",
    status: "Open",
    actionsTaken: ["Flagged", "Pending review"],
  },
  {
    id: "INC-002",
    submission: "SUB-0145",
    title: "Reviewer misconduct suspected",
    owner: "Compliance",
    status: "Investigating",
    actionsTaken: ["Reviewer notified"],
  },
  {
    id: "INC-003",
    submission: "PLG-0011",
    title: "Repeated plagiarism attempt",
    owner: "Senior Editor",
    status: "Resolved",
    actionsTaken: ["Author suspended", "Content removed"],
  }
];

/* ----------------------------------------------------
   ROW ACTION DROPDOWN COMPONENT
---------------------------------------------------- */
function RowActions({ incident }: { incident: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-2 py-1 rounded-lg border border-border bg-card hover:bg-muted transition-all"
      >
        <MoreVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div
          className="
            absolute right-0 mt-2 w-48 bg-card 
            border border-border rounded-lg shadow-lg 
            p-2 space-y-1 z-50
          "
        >
          <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-all">
            <FileWarning className="h-4 w-4" /> View Incident
          </button>

          <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-all">
            <UserCog className="h-4 w-4" /> Reassign Owner
          </button>

          <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-all">
            <ArchiveRestore className="h-4 w-4" /> Update Status
          </button>

          <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-all">
            <CheckCircle2 className="h-4 w-4" /> Add Resolution
          </button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------
   MAIN PAGE
---------------------------------------------------- */
export default function IncidentsPage() {
  return (
    <div className="space-y-8">
      {/* SECTION HEADER */}
      <section>
        <h2 className="text-xl font-semibold text-foreground">Incidents & Escalations</h2>
        <p className="text-muted-foreground text-sm">
          Track plagiarism escalations, assign owners, and manage resolutions.
        </p>
      </section>

      {/* SUMMARY CARDS */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-5 rounded-lg shadow-sm space-y-1">
          <p className="text-muted-foreground text-sm">Open Incidents</p>
          <h3 className="text-2xl font-semibold text-foreground">
            {incidents.filter((i) => i.status === "Open").length}
          </h3>
        </div>

        <div className="bg-card border border-border p-5 rounded-lg shadow-sm space-y-1">
          <p className="text-muted-foreground text-sm">Under Investigation</p>
          <h3 className="text-2xl font-semibold text-foreground">
            {incidents.filter((i) => i.status === "Investigating").length}
          </h3>
        </div>

        <div className="bg-card border border-border p-5 rounded-lg shadow-sm space-y-1">
          <p className="text-muted-foreground text-sm">Resolved</p>
          <h3 className="text-2xl font-semibold text-foreground">
            {incidents.filter((i) => i.status === "Resolved").length}
          </h3>
        </div>
      </div>

      {/* INCIDENT TABLE CARD */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-6">
        {/* Filter + creation */}
        <div className="flex flex-wrap gap-3">
          <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all">
            New Incident
          </button>

          <input
            placeholder="Search incidents by ID, submission, or owner"
            className="px-3 py-2 bg-muted border border-border rounded-lg flex-1 min-w-[200px]"
          />
        </div>

        {/* Table */}
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
              {incidents.map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="py-3">
                    <span className="font-medium text-foreground">{i.id}</span>
                    <p className="text-xs text-muted-foreground">{i.title}</p>
                  </td>

                  <td>{i.submission}</td>
                  <td>{i.owner}</td>

                  <td>
                    <span
                      className={`text-sm ${
                        i.status === "Open"
                          ? "text-primary"
                          : i.status === "Investigating"
                          ? "text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>

                  {/* Dropdown actions */}
                  <td className="py-3 whitespace-nowrap">
                    <RowActions incident={i} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTNOTE */}
        <p className="text-muted-foreground text-sm">
          Every incident update is stored in the audit trail with full lifecycle history
          (owner changes, resolutions, escalations).
        </p>
      </div>
    </div>
  );
}
