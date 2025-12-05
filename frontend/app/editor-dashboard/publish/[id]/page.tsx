"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function ApproveForPublishingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [notes, setNotes] = useState("");

  return (
    <div className="max-w-3xl mx-auto p-6">

      <Button variant="outline" onClick={() => router.back()} className="mb-4 flex gap-2 rounded-full">
        <ArrowLeft size={14} /> Back
      </Button>

      <h1 className="text-xl font-bold mb-1">Approve for Publishing</h1>
      <p className="text-[11px] text-slate-500 mb-6">
        Final checks before sending the article to publication pipeline.
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border dark:border-slate-700 shadow-sm">
        <h2 className="font-semibold text-sm mb-3">Final Notes (Optional)</h2>

        <textarea
          className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs"
          placeholder="Add any last-minute notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
        />

        <Button 
          className="bg-green-600 hover:bg-green-700 text-white rounded-full mt-4 flex gap-2 text-xs"
          onClick={() => router.push(`/editor-dashboard/published/${id}`)}
        >
          <CheckCircle size={14}/> Approve & Publish
        </Button>
      </div>
    </div>
  );
}
