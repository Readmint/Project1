// app/admin-dashboard/certificates/page.tsx
"use client";

import { Award, Settings2, FileCheck2, RefreshCw, Ban, Search, ShieldCheck,} from "lucide-react";
import { useState } from "react";

export default function CertificatesPage() {
  // Dummy data
  const [criteria, setCriteria] = useState({
    publishedThreshold: "",
    reviewThreshold: "",
  });

  const activeCertificates = [
    {
      id: "CERT-0001",
      user: "Author A",
      role: "Author",
      issued: "2025-11-20",
      status: "Valid",
    },
    {
      id: "CERT-0002",
      user: "Reviewer B",
      role: "Reviewer",
      issued: "2025-11-22",
      status: "Valid",
    },
  ];

  const verificationLogs = [
    {
      timestamp: "2025-12-01 14:20",
      cert: "CERT-0001",
      requester: "External API",
      status: "Success",
    },
    {
      timestamp: "2025-12-01 09:10",
      cert: "CERT-0002",
      requester: "Manual Check",
      status: "Success",
    },
  ];

  // Handlers (stub logic)
  function updateCriteria() {
    console.log("Updated criteria:", criteria);
  }

  function reissueCertificate() {
    console.log("Reissue action triggered");
  }

  function revokeCertificate() {
    console.log("Revoke action triggered");
  }

  return (
    <main className="max-w-7xl mx-auto px-2 py-2 space-y-8">

      {/* ----------------- Section: Overview ----------------- */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Certificates & Recognition
        </h2>
        <p className="text-muted-foreground text-sm">
          Configure generation rules, manage active certificates, and review verification logs.
        </p>
      </section>

      {/* ----------------- Card: Auto-Generation Criteria ----------------- */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-6">
        <h3 className="font-medium flex items-center gap-2 text-foreground">
          <Settings2 className="h-4 w-4 text-primary" />
          Auto-Generation Criteria
        </h3>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">
              Published Works Threshold
            </label>
            <input
              value={criteria.publishedThreshold}
              onChange={(e) =>
                setCriteria({ ...criteria, publishedThreshold: e.target.value })
              }
              placeholder="e.g., 10"
              className="px-3 py-2 bg-muted border border-border rounded-lg w-full"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">
              Approved Reviews Threshold
            </label>
            <input
              value={criteria.reviewThreshold}
              onChange={(e) =>
                setCriteria({ ...criteria, reviewThreshold: e.target.value })
              }
              placeholder="e.g., 20"
              className="px-3 py-2 bg-muted border border-border rounded-lg w-full"
            />
          </div>

        </div>

        <button
          onClick={updateCriteria}
          className="px-3 py-2 rounded border border-border bg-card hover:bg-muted transition-all flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Update Rules
        </button>
      </div>

      {/* ----------------- Section: Active Certificates ----------------- */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-primary" />
          Active Certificates
        </h2>
        <p className="text-muted-foreground text-sm">
          Manage issued certificates for authors, reviewers, editors, and content managers.
        </p>
      </section>

      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-6">

        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search certificates…"
            className="pl-10 pr-3 py-2 bg-muted border border-border rounded-lg w-full"
          />
        </div>

        {/* Certificates Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {activeCertificates.map((c) => (
            <div
              key={c.id}
              className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3 hover:bg-muted transition-all"
            >
              <p className="font-medium text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {c.id}
              </p>

              <p className="text-sm text-muted-foreground">
                {c.user} — {c.role}
              </p>
              <p className="text-sm text-muted-foreground">
                Issued: {c.issued}
              </p>

              <p className="text-sm text-primary">{c.status}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={reissueCertificate}
            className="px-3 py-2 rounded border border-border bg-card hover:bg-muted transition-all flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reissue
          </button>

          <button
            onClick={revokeCertificate}
            className="px-3 py-2 rounded border border-border bg-card hover:bg-muted transition-all flex items-center gap-2"
          >
            <Ban className="h-4 w-4" />
            Revoke
          </button>
        </div>

      </div>

      {/* ----------------- Section: Verification Logs ----------------- */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Certificate Verification Logs
        </h2>
        <p className="text-muted-foreground text-sm">
          Track internal and external verification checks for issued certificates.
        </p>
      </section>

      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-6">
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2">Timestamp</th>
                <th>Certificate</th>
                <th>Requester</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {verificationLogs.map((log, i) => (
                <tr
                  key={i}
                  className="border-b border-border hover:bg-muted transition-all"
                >
                  <td className="py-2">{log.timestamp}</td>
                  <td>{log.cert}</td>
                  <td>{log.requester}</td>
                  <td className="text-primary">{log.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  );
}
