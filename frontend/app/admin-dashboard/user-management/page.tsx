"use client";

import {
  Eye,
  UserCog,
  UserX,
  UserCheck,
  UserCircle2,
  MoreVertical,
} from "lucide-react";

import { useState, useRef, useEffect } from "react";

/* ----------------------------------------------------
   DUMMY USER DATA
---------------------------------------------------- */
const dummyUsers = [
  {
    name: "Jane Doe",
    email: "jane@example.com",
    role: "Author",
    designation: "Writer",
    organization: "Global Media",
    registered: "2024-06-12",
    lastActive: "2025-12-01",
    status: "Active",
  },
  {
    name: "Mark Reynolds",
    email: "mark@example.com",
    role: "Reviewer",
    designation: "Subject Matter Reviewer",
    organization: "ReadMint",
    registered: "2023-11-08",
    lastActive: "2025-11-29",
    status: "Suspended",
  },
  {
    name: "Priya Natarajan",
    email: "priya@example.com",
    role: "Editor",
    designation: "Senior Editor",
    organization: "ReadMint Publishing",
    registered: "2024-02-18",
    lastActive: "2025-12-02",
    status: "Active",
  },
];

/* ----------------------------------------------------
   ROW ACTION DROPDOWN COMPONENT
---------------------------------------------------- */
function RowActions({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* BUTTON */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="
          px-2 py-1 rounded-lg border border-border bg-card 
          hover:bg-muted transition-all
        "
      >
        <MoreVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* DROPDOWN MENU */}
      {open && (
        <div
          className="
            absolute right-0 mt-2 w-44 bg-card 
            border border-border rounded-lg shadow-lg 
            p-2 space-y-1 z-50
          "
        >
          <button className="flex items-center gap-2 w-full text-left px-3 py-2 rounded hover:bg-muted text-sm text-foreground transition-all">
            <Eye className="h-4 w-4" /> View Profile
          </button>

          <button className="flex items-center gap-2 w-full text-left px-3 py-2 rounded hover:bg-muted text-sm text-foreground transition-all">
            <UserCog className="h-4 w-4" /> Edit Role
          </button>

          <button className="flex items-center gap-2 w-full text-left px-3 py-2 rounded hover:bg-muted text-sm text-foreground transition-all">
            <UserCircle2 className="h-4 w-4" /> Impersonate
          </button>

          {user.status === "Active" ? (
            <button className="flex items-center gap-2 w-full text-left px-3 py-2 rounded hover:bg-muted text-sm text-destructive transition-all">
              <UserX className="h-4 w-4" /> Suspend
            </button>
          ) : (
            <button className="flex items-center gap-2 w-full text-left px-3 py-2 rounded hover:bg-muted text-sm text-primary transition-all">
              <UserCheck className="h-4 w-4" /> Reactivate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------
   MAIN PAGE COMPONENT
---------------------------------------------------- */
export default function UserManagementPage() {
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <section>
        <h2 className="text-xl font-semibold text-foreground">
          User & Role Management
        </h2>
        <p className="text-muted-foreground text-sm">
          Search users, view profiles, edit roles, impersonate, and manage
          account status.
        </p>
      </section>

      {/* FILTER PANEL */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
        <div className="grid md:grid-cols-4 gap-3">
          <input
            placeholder="Search by name / email / ID"
            className="px-3 py-2 bg-muted border border-border rounded-lg"
          />

          <select className="px-3 py-2 bg-muted border border-border rounded-lg">
            <option>All roles</option>
            <option>Author</option>
            <option>Reviewer</option>
            <option>Editor</option>
            <option>Content Manager</option>
            <option>Admin</option>
          </select>

          <select className="px-3 py-2 bg-muted border border-border rounded-lg">
            <option>Any Status</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Suspended</option>
          </select>

          <input
            type="date"
            className="px-3 py-2 bg-muted border border-border rounded-lg"
          />
        </div>

        <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all">
          Apply Filters
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-muted-foreground">
                <th className="py-2">User</th>
                <th>Role</th>
                <th>Designation</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Last Active</th>
                <th className="whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody>
              {dummyUsers.map((u, idx) => (
                <tr key={idx} className="border-t border-border">
                  <td className="py-3">
                    <span className="font-medium text-foreground">{u.name}</span>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>

                  <td>{u.role}</td>
                  <td>{u.designation}</td>
                  <td>{u.organization}</td>

                  <td>
                    <span
                      className={`text-sm ${
                        u.status === "Active"
                          ? "text-primary"
                          : u.status === "Suspended"
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>

                  <td>{u.registered}</td>
                  <td>{u.lastActive}</td>

                  {/* CLEAN ACTION DROPDOWN */}
                  <td className="py-3 whitespace-nowrap">
                    <RowActions user={u} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-muted-foreground text-sm">
          Audit logs are automatically generated for every role change,
          impersonation, suspension, and reactivation.
        </p>
      </div>
    </div>
  );
}
