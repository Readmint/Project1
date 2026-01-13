"use client";

import { BookText, Info, Mail } from "lucide-react";

export default function GuidelinesPage() {
  return (
    <main className="px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <BookText className="h-6 w-6 text-indigo-600" />
          Publishing Guidelines & Support
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Reference platform rules, formatting standards, and contact support when needed.
        </p>
      </header>

      {/* Sections */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Guidelines */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-2">Platform Publishing Guidelines</h2>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>Content must be original and properly attributed.</li>
              <li>Follow category relevance and tagging rules strictly.</li>
              <li>Avoid sensitive or restricted content without approvals.</li>
              <li>Ensure compliance with local and international regulations.</li>
            </ul>
          </div>

          <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-2">Format Rules</h2>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>Use heading hierarchy: H1 → H2 → H3.</li>
              <li>Keep paragraphs short (2–4 lines each).</li>
              <li>Ensure images follow recommended dimensions & compression.</li>
              <li>Use bullet points for lists, avoid long unstructured blocks.</li>
            </ul>
          </div>
        </div>

        {/* Policies & Support */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-2">Content Policies & Quality Standards</h2>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>Zero tolerance for plagiarism or IP violations.</li>
              <li>Maintain consistency in tone and voice across categories.</li>
              <li>Fact-check claims, stats, and quotes before publishing.</li>
              <li>Ensure SEO fields (title, description, keywords) are meaningful and non-spammy.</li>
            </ul>
          </div>

          <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 shadow-sm flex flex-col gap-2">
            <h2 className="text-sm font-semibold mb-1 flex items-center gap-1">
              <Info className="h-4 w-4 text-indigo-600" />
              Contact Support
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              If you encounter workflow issues, role conflicts, or technical errors, reach out to the support team.
            </p>
            <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
              <p>Email: <span className="text-indigo-600">info.mindradix@gmail.com</span></p>
              <p>Slack Channel: <span className="text-indigo-600">#cm-support</span></p>
            </div>
            <button className="mt-2 inline-flex items-center gap-2 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg w-fit">
              <Mail className="h-3 w-3" />
              Open Support Ticket
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
