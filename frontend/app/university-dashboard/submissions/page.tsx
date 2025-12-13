"use client";

import { Upload, FileText, Users } from "lucide-react";

export default function SubmissionsPage() {
  const topics = [
    { title: "AI in Healthcare", author: "Dr. Mehta", dept: "CS", status: "Extracted" },
    { title: "Sustainable Materials", author: "Prof. Rao", dept: "Physics", status: "Pending" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 py-2 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Submissions</h1>
        <p className="text-muted-foreground text-sm">
          Upload a single Word file and manage extracted topics.
        </p>
      </div>

      {/* UPLOAD CARD */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
        <h2 className="font-medium text-foreground">Upload Word File</h2>
        <p className="text-muted-foreground text-sm">
          Upload one .docx file containing all participants, abstracts, and papers.
        </p>

        <button className="px-4 py-2 bg-muted rounded-lg hover:bg-border transition-all flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" /> Upload File
        </button>
      </div>

      {/* TOPIC LIST */}
      <div>
        <h2 className="text-foreground font-medium">Extracted Topics</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {topics.map((t, i) => (
            <div key={i} className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
              <h3 className="font-semibold text-foreground">{t.title}</h3>
              <div className="text-sm flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" /> {t.author} — {t.dept}
              </div>
              <p className="text-sm text-primary font-medium">{t.status}</p>

              <button className="text-primary text-sm hover:underline flex items-center gap-1">
                <FileText className="w-4 h-4" /> View Submission
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
