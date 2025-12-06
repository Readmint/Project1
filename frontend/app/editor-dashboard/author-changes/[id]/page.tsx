// app/editor/author-changes/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { requestChanges as apiRequestChanges } from "@/lib/api/editor";

export default function RequestAuthorChangesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [sending, setSending] = useState(false);

  const sendRequest = async () => {
    if (!id) return;
    setSending(true);
    try {
      await apiRequestChanges(Array.isArray(id) ? id[0] : id, { message, severity });
      alert("Request sent to author");
      router.push(`/editor-dashboard/author-changes/sent/${id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to send request");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4 flex gap-2 rounded-full">
        <ArrowLeft size={14}/> Back
      </Button>

      <h1 className="text-xl font-bold">Request Changes from Author</h1>
      <p className="text-[11px] text-slate-500 mb-6">Provide a clear summary of changes required.</p>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border dark:border-slate-700 shadow-sm space-y-4">
        <div>
          <label className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            Change Severity
          </label>
          <select
            className="w-full border rounded-lg p-2 bg-slate-50 dark:bg-slate-900 text-xs"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-500 flex items-center gap-1">
            <FileText size={12}/> Change Request Message
          </label>

          <textarea
            rows={6}
            className="w-full border rounded-lg p-3 bg-slate-50 dark:bg-slate-900 text-xs"
            placeholder="Describe the required changes..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <Button
          className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full text-xs px-4 py-2"
          onClick={sendRequest}
          disabled={sending || message.trim().length === 0}
        >
          {sending ? "Sending..." : "Send Request"}
        </Button>
      </div>
    </div>
  );
}
