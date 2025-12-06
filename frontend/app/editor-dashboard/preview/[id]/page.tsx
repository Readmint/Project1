// app/editor/preview/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ArticlePreview, { ArticlePreviewData } from "@/components/articles/ArticlePreview";

export default function EditorPreviewPage() {
  const { id } = useParams();
  const [article, setArticle] = useState<ArticlePreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  // Replace with real backend later — mock for now
  useEffect(() => {
    setTimeout(() => {
      setArticle({
        id: Number(id),
        title: "The Rise of Quantum Computing in 2026",
        author: "John Carter",
        category: "Technology",
        coverImage: "/sample-cover.jpg",
        content: `
          <h2>Introduction</h2>
          <p>Quantum computing continues to evolve…</p>
          <p>The future is closer than ever.</p>
        `,
        lastEdited: "Feb 15, 2026",
      });
      setLoading(false);
    }, 400);
  }, [id]);

  return <ArticlePreview article={article} loading={loading} />;
}
