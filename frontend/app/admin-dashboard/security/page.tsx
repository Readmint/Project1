// app/admin-dashboard/security/page.tsx
"use client";

import { Shield, KeyRound, Users, Globe2, Plus, Trash2, MonitorSmartphone, LogOut,} from "lucide-react";
import { useState } from "react";

export default function SecurityPage() {
  // Dummy states
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [ipInput, setIpInput] = useState("");
  const [ipList, setIpList] = useState([
    "192.168.0.10",
    "10.0.0.0/24",
  ]);

  const sessions = [
    {
      id: "SESS-0411",
      user: "Admin A",
      device: "Chrome on macOS",
      ip: "1.2.3.4",
      lastActive: "2 min ago",
    },
    {
      id: "SESS-0412",
      user: "Admin B",
      device: "Safari on iPhone",
      ip: "5.6.7.8",
      lastActive: "10 min ago",
    },
  ];

  // Handlers
  function addIp() {
    if (!ipInput.trim()) return;
    setIpList([...ipList, ipInput.trim()]);
    setIpInput("");
  }

  function removeIp(ip: string) {
    setIpList(ipList.filter((x) => x !== ip));
  }

  function toggle2FA() {
    setEnforce2FA(!enforce2FA);
  }

  function forceLogout(id: string) {
    console.log("Force logout:", id);
  }

  return (
    <main className="max-w-7xl mx-auto px-2 py-2 space-y-8">

      {/* ----------------- Section: Overview ----------------- */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Security & Permissions
        </h2>
        <p className="text-muted-foreground text-sm">
          Manage access control, 2FA policies, IP rules, and active sessions.
        </p>
      </section>

      {/* ----------------- Card: RBAC ----------------- */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-6">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Role-Based Access Control (RBAC)
        </h3>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Control which administrative roles exist and what permissions they grant.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg shadow-sm p-4 space-y-2">
              <p className="font-medium text-foreground">Admin</p>
              <p className="text-muted-foreground text-sm">
                Full platform access, moderation, and configuration.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-sm p-4 space-y-2">
              <p className="font-medium text-foreground">Editor</p>
              <p className="text-muted-foreground text-sm">
                Content review, approval, and editorial workflows.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-sm p-4 space-y-2">
              <p className="font-medium text-foreground">Reviewer</p>
              <p className="text-muted-foreground text-sm">
                Review submissions and provide structured feedback.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-sm p-4 space-y-2">
              <p className="font-medium text-foreground">Content Manager (CM)</p>
              <p className="text-muted-foreground text-sm">
                Oversee publishing, schedules, and community content.
              </p>
            </div>
          </div>

          <button className="px-3 py-2 rounded border border-border bg-card hover:bg-muted transition-all">
            Edit Roles
          </button>
        </div>
      </div>

      {/* ----------------- Card: 2FA Enforcement ----------------- */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-6">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          Two-Factor Authentication Enforcement
        </h3>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={enforce2FA}
            onChange={toggle2FA}
            className="accent-primary"
          />
          <span className="text-foreground">Require 2FA for all Admin roles</span>
        </label>
      </div>

      {/* ----------------- Card: IP Allowlist / Blocklist ----------------- */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-6">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-primary" />
          IP Allowlist & Blocklist
        </h3>

        <div className="flex gap-2 max-w-md">
          <input
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            placeholder="Add IP or CIDR"
            className="px-3 py-2 bg-muted border border-border rounded-lg w-full"
          />
          <button
            onClick={addIp}
            className="px-3 py-2 rounded border border-border bg-card hover:bg-muted transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        <div className="space-y-3">
          {ipList.map((ip) => (
            <div
              key={ip}
              className="flex items-center justify-between bg-card border border-border rounded-lg p-3 hover:bg-muted transition-all"
            >
              <p className="text-sm text-foreground">{ip}</p>
              <button
                onClick={() => removeIp(ip)}
                className="text-muted-foreground hover:text-primary transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ----------------- Card: Session Management ----------------- */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-6">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <MonitorSmartphone className="h-4 w-4 text-primary" />
          Active Sessions
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-card border border-border rounded-lg shadow-sm p-4 space-y-2 hover:bg-muted transition-all"
            >
              <p className="font-medium text-foreground">{s.user}</p>
              <p className="text-sm text-muted-foreground">{s.device}</p>
              <p className="text-sm text-muted-foreground">IP: {s.ip}</p>
              <p className="text-sm text-muted-foreground">
                Last active: {s.lastActive}
              </p>

              <button
                onClick={() => forceLogout(s.id)}
                className="px-2 py-1 rounded border border-border bg-card text-sm hover:bg-muted transition-all flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Force Logout
              </button>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}
