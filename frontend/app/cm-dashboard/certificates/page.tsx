"use client";

import { Award, Download, ShieldCheck, Star } from "lucide-react";

const certificates = [
  {
    type: "Workflow Excellence Certificate",
    id: "RM-WE-2025-0012",
    status: "Earned",
    description: "Awarded for managing 500+ submissions with SLA compliance above 95%.",
    link: "https://readmint.example.com/certificates/RM-WE-2025-0012",
  },
  {
    type: "Quality Assurance Certificate",
    id: "RM-QA-2025-0041",
    status: "In Progress",
    description: "Maintain editorial rejection rate below 3% for quality issues.",
    link: "https://readmint.example.com/certificates/RM-QA-2025-0041",
  },
  {
    type: "Special Edition Coordinator Certificate",
    id: "RM-SE-2025-0007",
    status: "Earned",
    description: "Successfully launched 3+ themed monthly issues.",
    link: "https://readmint.example.com/certificates/RM-SE-2025-0007",
  },
];

export default function CertificatesPage() {
  return (
    <main className="px-6 py-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Award className="h-6 w-6 text-indigo-600" />
          Certificates & Achievements
        </h1>
        <p className="text-sm text-slate-500">
          View performance-based certificates, milestones, and verification details.
        </p>
      </header>

      {/* Highlight / Summary */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Total Certificates</p>
          <p className="text-2xl font-semibold mt-1">{certificates.length}</p>
        </div>

        <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 shadow-sm flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
          <div>
            <p className="text-xs uppercase text-slate-400">Auto-Generated</p>
            <p className="text-sm text-slate-600 dark:text-slate-200">
              Certificates are generated based on your workflow performance.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 shadow-sm flex items-center gap-3">
          <Star className="h-8 w-8 text-amber-500" />
          <div>
            <p className="text-xs uppercase text-slate-400">Milestones</p>
            <p className="text-sm text-slate-600 dark:text-slate-200">
              Hit 3 new milestones this quarter.
            </p>
          </div>
        </div>
      </section>

      {/* Certificates List */}
      <section className="space-y-4">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {cert.type}
              </h2>
              <p className="text-xs text-slate-500 mt-1">{cert.description}</p>
              <p className="text-xs text-slate-400 mt-2">
                Certificate ID:{" "}
                <span className="font-mono text-[11px]">{cert.id}</span>
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 break-all">
                Verification Link: {cert.link}
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${
                  cert.status === "Earned"
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                }`}
              >
                {cert.status}
              </span>

              <a
                href={cert.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
