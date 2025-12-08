"use client";

import { useState } from "react";
import { MessageCircle, Send, Paperclip } from "lucide-react";

const messagesMock = [
  { from: "Reviewer Arjun", text: "Content looks good but needs minor edits." },
  { from: "Editor Anita", text: "Editing completed. Ready for QC." },
];

export default function CommunicationPage() {
  const [msg, setMsg] = useState("");

  return (
    <main className="px-6 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Communication Panel</h1>
      <p className="text-sm text-slate-500">
        Chat with authors, reviewers, and editors.
      </p>

      {/* Messages */}
      <div className="bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm space-y-3">
        {messagesMock.map((m, i) => (
          <div key={i} className="border-b pb-2 last:border-0">
            <p className="font-medium">{m.from}</p>
            <p className="text-xs text-slate-500">{m.text}</p>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2">
        <Paperclip size={20} className="text-slate-500 cursor-pointer" />

        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-3 py-2 dark:bg-slate-800"
        />

        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
          <Send size={16} />
        </button>
      </div>

    </main>
  );
}
