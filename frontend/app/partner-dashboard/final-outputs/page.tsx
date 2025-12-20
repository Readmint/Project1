"use client";

import { FileText, Download } from "lucide-react";

export default function FinalOutputsPage() {
  const outputs = [
    { type: "Edited Version", file: "edited_paper.pdf" },
    { type: "Designed Version", file: "designed_paper.pdf" },
    { type: "Special Issue", file: "special_issue.pdf" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 py-2 space-y-8">

      <div>
        <h1 className="text-xl font-semibold text-foreground">Final Outputs</h1>
        <p className="text-muted-foreground text-sm">Download edited, designed, and compiled final files.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {outputs.map((o, i) => (
          <div key={i} className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> {o.type}
            </h3>

            <button className="text-primary text-sm hover:underline flex items-center gap-1">
              <Download className="w-4 h-4" /> Download ({o.file})
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
