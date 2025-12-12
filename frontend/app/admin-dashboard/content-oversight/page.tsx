// app/admin-dashboard/content-oversight/page.tsx
"use client";

/**
 * Content Oversight & Moderation
 * SRS mapping: Section 3 — Content Oversight & Moderation
 * - Filters: Title, Author, Category, Status, Date range, Plagiarism flag, Similarity %, Priority
 * - Columns: Title, Author, Category, Status, Plagiarism Flag, Similarity %, Reviewer, Editor, Priority
 * - Admin Actions: Preview, Force re-scan, Reassign, Override (Approve/Reject), Takedown
 *
 * UI rules followed:
 * - Cards: bg-card border border-border rounded-lg shadow-sm p-5
 * - Section titles: text-xl font-semibold text-foreground
 * - Descriptions: text-muted-foreground text-sm
 * - Grids: grid md:grid-cols-* gap-6
 * - Theme tokens only (bg-card, bg-muted, text-foreground, text-muted-foreground, border-border, text-primary)
 */

import { useState } from "react";
import {
  Eye,
  RefreshCcw,
  UserCog,
  ShieldCheck,
  Trash2,
  MoreVertical,
} from "lucide-react";

const DUMMY = [
  {
    id: "CNT-1001",
    title: "AI in Modern Publishing",
    author: "John Smith",
    category: "Technology",
    status: "Pending",
    plagiarismFlag: false,
    similarity: 12,
    reviewer: "Reviewer A",
    editor: "Editor X",
    priority: "High",
    date: "2025-12-02",
  },
  {
    id: "CNT-1002",
    title: "Cultural History of Print Media",
    author: "Priya N.",
    category: "History",
    status: "Flagged",
    plagiarismFlag: true,
    similarity: 68,
    reviewer: "Reviewer C",
    editor: "Editor Y",
    priority: "Medium",
    date: "2025-11-28",
  },
  {
    id: "CNT-1003",
    title: "The Future of Digital Reading",
    author: "Alicia P.",
    category: "Culture",
    status: "Published",
    plagiarismFlag: false,
    similarity: 4,
    reviewer: "Reviewer B",
    editor: "Editor X",
    priority: "Low",
    date: "2025-12-01",
  },
];

export default function ContentOversightPage() {
  // local UI state (placeholder only — wire to real filters later)
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [plagFlag, setPlagFlag] = useState("");
  const [similarityGte, setSimilarityGte] = useState<number | "">("");
  const [priority, setPriority] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // lightweight filtered view for demo
  const filtered = DUMMY.filter((c) => {
    if (query && !(`${c.title} ${c.author} ${c.id}`.toLowerCase().includes(query.toLowerCase()))) return false;
    if (category && c.category !== category) return false;
    if (status && c.status !== status) return false;
    if (plagFlag) {
      const want = plagFlag === "yes";
      if (c.plagiarismFlag !== want) return false;
    }
    if (priority && c.priority !== priority) return false;
    if (similarityGte !== "" && c.similarity < Number(similarityGte)) return false;
    if (fromDate && c.date < fromDate) return false;
    if (toDate && c.date > toDate) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <h2 className="text-xl font-semibold text-foreground">Content Oversight & Moderation</h2>
        <p className="text-muted-foreground text-sm">
          Global list of submissions with precise filters and compact moderation actions.
        </p>
      </section>

      {/* Filters card (compact & two-row) */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
        {/* Row 1: Search + top-level selects */}
        <div className="grid gap-3 md:grid-cols-4">
          <div className="col-span-2">
            <label className="sr-only">Search</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author or content ID"
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
          >
            <option value="">All categories</option>
            <option>Technology</option>
            <option>Science</option>
            <option>History</option>
            <option>Culture</option>
            <option>Arts</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
          >
            <option value="">Status</option>
            <option>Pending</option>
            <option>Flagged</option>
            <option>Published</option>
            <option>Rejected</option>
          </select>
        </div>

        {/* Row 2: advanced filters + actions */}
        <div className="grid gap-3 md:grid-cols-6">
          <select
            value={plagFlag}
            onChange={(e) => setPlagFlag(e.target.value)}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
          >
            <option value="">Plagiarism</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          <input
            value={similarityGte}
            onChange={(e) => setSimilarityGte(e.target.value === "" ? "" : Number(e.target.value))}
            type="number"
            min={0}
            max={100}
            placeholder="Similarity ≥ %"
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
          />

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
          >
            <option value="">Priority</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
            placeholder="From"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
            placeholder="To"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => { /* replace with apply filter handler */ }}
              className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm"
            >
              Apply
            </button>

            <button
              onClick={() => {
                setQuery("");
                setCategory("");
                setStatus("");
                setPlagFlag("");
                setSimilarityGte("");
                setPriority("");
                setFromDate("");
                setToDate("");
              }}
              className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main table card */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
        {/* Summary row (compact stats) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>{filtered.length} results</div>
            <div>Showing recent submissions</div>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">Export CSV</button>
            <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">Bulk Re-scan</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-muted-foreground">
                <th className="py-3">Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Status</th>
                <th>Plagiarism</th>
                <th>Similarity</th>
                <th>Reviewer</th>
                <th>Editor</th>
                <th>Priority</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="py-3 pr-6">
                    <div className="text-sm font-medium text-foreground">{c.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{c.id}</div>
                  </td>

                  <td className="text-sm">{c.author}</td>
                  <td className="text-sm">{c.category}</td>

                  <td className={`text-sm ${c.status === "Flagged" ? "text-destructive" : "text-foreground"}`}>
                    {c.status}
                  </td>

                  <td className="text-sm">{c.plagiarismFlag ? "Yes" : "No"}</td>

                  <td className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{c.similarity}%</span>
                      <div className="text-xs text-muted-foreground">({c.date})</div>
                    </div>
                  </td>

                  <td className="text-sm">{c.reviewer}</td>
                  <td className="text-sm">{c.editor}</td>

                  <td className={`text-sm ${c.priority === "High" ? "text-primary" : c.priority === "Medium" ? "text-accent" : "text-muted-foreground"}`}>
                    {c.priority}
                  </td>

                  <td className="text-right">
                    {/* compact overflow actions to reduce visual noise */}
                    <details className="relative inline-block">
                      <summary className="list-none cursor-pointer px-2 py-1 rounded hover:bg-muted transition-all">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </summary>

                      <div className="absolute right-0 mt-2 w-[220px] bg-card border border-border rounded-lg shadow-sm p-3 z-50">
                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-all text-sm flex items-center gap-2">
                          <Eye className="h-4 w-4" /> Preview
                        </button>

                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-all text-sm flex items-center gap-2 mt-1">
                          <RefreshCcw className="h-4 w-4" /> Force Re-scan
                        </button>

                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-all text-sm flex items-center gap-2 mt-1">
                          <UserCog className="h-4 w-4" /> Reassign Reviewer/Editor
                        </button>

                        <div className="border-t border-border my-2" />

                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-all text-sm flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" /> Override (Approve/Reject)
                        </button>

                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-all text-sm flex items-center gap-2 mt-1 text-destructive">
                          <Trash2 className="h-4 w-4" /> Takedown
                        </button>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted-foreground">
                    No results. Adjust filters or try a broader query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-muted-foreground text-sm">
          Use the preview to inspect similarity highlights and matched sources; reassign reviewers or escalate flagged items as needed.
        </p>
      </div>
    </div>
  );
}
