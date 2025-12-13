"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export type ArticlePreviewData = {
  id: string | number;
  title: string;
  author?: string;
  category?: string;
  coverImage?: string;
  content: string;   // HTML or Markdown rendered as HTML
  lastEdited?: string;
};

export default function ArticlePreview({
  article,
  loading = false,
  enableBack = true,
}: {
  article: ArticlePreviewData | null;
  loading?: boolean;
  enableBack?: boolean;
}) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Loading article preview…
      </div>
    );
  }

  if (!article) {
    return (
      <p className="text-center text-red-600 p-6">Article not found.</p>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {enableBack ? (
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full"
          >
            <ArrowLeft size={16} /> Back
          </Button>
        ) : (
          <div></div>
        )}

        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Eye size={18} className="text-indigo-600" /> Article Preview
        </h1>

        <div></div>
      </div>

      {/* ARTICLE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 border border-slate-200 dark:border-slate-700"
      >
        <h1 className="text-2xl font-bold mb-1">{article.title}</h1>

        <p className="text-xs text-slate-500 mb-4">
          {article.author && <>By {article.author} • </>}
          {article.lastEdited && <>Last edited {article.lastEdited} • </>}
          {article.category}
        </p>

        {article.coverImage && (
          <img
            src={article.coverImage}
            className="rounded-xl w-full mb-6 object-cover"
            alt="Cover"
          />
        )}

        <div
          className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </motion.div>
    </div>
  );
}
