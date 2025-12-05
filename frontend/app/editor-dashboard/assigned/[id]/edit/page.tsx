"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  PenTool,
  MessageSquare,
  Save,
  Send,
  Eye,
  FileText,
} from "lucide-react";

import dynamic from "next/dynamic";

// ✅ Correct ReactQuill import for React 19
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";


type ArticleData = {
  id: number;
  title: string;
  category: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  reviewerComments?: string[];
  reviewerHighlights?: string[];
  notes?: string;
};

export default function EditArticlePage() {
  const { id } = useParams();
  const router = useRouter();

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [saving, setSaving] = useState(false);

  // ------------------------------------------------------
  // Mock Fetch — Replace with real backend later
  // ------------------------------------------------------
  useEffect(() => {
    setTimeout(() => {
      setArticle({
        id: Number(id),
        title: "Future of Sustainable Tech in 2026",
        category: "Environment",
        content: "<p>Initial article draft content goes here...</p>",
        metaTitle: "Sustainable Tech 2026 | ReadMint",
        metaDescription: "Exploring eco-friendly innovations shaping 2026.",
        reviewerComments: [
          "Expand introduction to include global trends.",
          "Image 2 needs a copyright-safe replacement.",
        ],
        reviewerHighlights: [
          "Paragraph 3 is unclear",
          "Check factual accuracy in section 5",
        ],
        notes: "Editor must verify sources before final submission.",
      });
    }, 400);
  }, [id]);

  // ------------------------------------------------------
  // Save Draft (mock)
  // ------------------------------------------------------
  const saveDraft = async () => {
    if (!article) return;
    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      alert("Draft Saved (Mock)");
    }, 600);
  };

  // ------------------------------------------------------
  // Finalize Editing (mock)
  // ------------------------------------------------------
  const finalizeEditing = () => {
    alert("Editing Finalized (Mock)");
  };

  if (!article) {
    return (
      <div className="p-6 text-slate-500 text-center">Loading article...</div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">

      {/* LEFT PANEL (Editor) */}
      <div className="lg:col-span-3 space-y-5">

        {/* Header */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full"
          >
            <ArrowLeft size={16} /> Back
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/editor-dashboard/preview/${article.id}`)
              }
              className="rounded-full text-xs flex items-center gap-1"
            >
              <Eye size={12} /> Preview
            </Button>

            <Button
              onClick={saveDraft}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs flex items-center gap-1"
              disabled={saving}
            >
              <Save size={12} /> {saving ? "Saving..." : "Save Draft"}
            </Button>

            <Button
              onClick={finalizeEditing}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full text-xs flex items-center gap-1"
            >
              <Send size={12} /> Finalize
            </Button>
          </div>
        </div>

        {/* Title */}
        <input
          className="w-full text-2xl font-bold bg-transparent border-none outline-none"
          value={article.title}
          onChange={(e) => setArticle({ ...article, title: e.target.value })}
        />

        {/* Category */}
        <input
          className="border text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900"
          placeholder="Category"
          value={article.category}
          onChange={(e) => setArticle({ ...article, category: e.target.value })}
        />

        {/* Editor Component */}
        <div className="rounded-xl overflow-hidden border dark:border-slate-700">
          <ReactQuill
            theme="snow"
            value={article.content}
            onChange={(v: string) => setArticle({ ...article, content: v })}
            className="min-h-[400px]"
          />
        </div>

        {/* SEO Fields */}
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <FileText size={14} /> SEO Settings
          </h3>

          <input
            className="border text-xs px-3 py-2 rounded-lg w-full bg-slate-50 dark:bg-slate-900"
            placeholder="Meta Title"
            value={article.metaTitle || ""}
            onChange={(e) =>
              setArticle({ ...article, metaTitle: e.target.value })
            }
          />

          <textarea
            className="border text-xs px-3 py-2 rounded-lg w-full bg-slate-50 dark:bg-slate-900"
            placeholder="Meta Description"
            rows={3}
            value={article.metaDescription || ""}
            onChange={(e) =>
              setArticle({ ...article, metaDescription: e.target.value })
            }
          />
        </div>
      </div>

      {/* RIGHT SIDEBAR (Reviewer Notes) */}
      <div className="space-y-5">

        {/* Reviewer Comments */}
        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <MessageSquare size={14} /> Reviewer Comments
          </h3>

          {article.reviewerComments?.length ? (
            <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
              {article.reviewerComments.map((c, i) => (
                <li key={i} className="border-b pb-1 border-slate-200 dark:border-slate-700">
                  {c}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">No comments</p>
          )}
        </div>

        {/* Highlights */}
        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <PenTool size={14} /> Highlights
          </h3>

          {article.reviewerHighlights?.length ? (
            <ul className="text-xs space-y-1">
              {article.reviewerHighlights.map((h, i) => (
                <li key={i} className="text-yellow-700 dark:text-yellow-300 text-xs">
                  ▪ {h}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">No highlights</p>
          )}
        </div>

        {/* Editor Notes */}
        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <FileText size={14} /> Editor Notes
          </h3>

          <textarea
            value={article.notes || ""}
            onChange={(e) => setArticle({ ...article, notes: e.target.value })}
            rows={4}
            className="w-full border rounded-lg text-xs p-2 bg-slate-50 dark:bg-slate-900"
          />
        </div>
      </div>
    </div>
  );
}
