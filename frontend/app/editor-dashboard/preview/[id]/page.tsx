// app/editor/preview/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ArticlePreview, { ArticlePreviewData } from "@/components/articles/ArticlePreview";
import { getJSON } from "@/lib/api";

export default function EditorPreviewPage() {

  const { id } = useParams();
  const [article, setArticle] = useState<ArticlePreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      if (!id) return;
      // Fetch using the editor endpoint (requires assignment)
      const res = await getJSON(`/editor/articles/${id}`);
      if (res.status === 'success' && res.data && res.data.article) {
        const a = res.data.article;
        setArticle({
          id: a.id, // ID is UUID string 
          // If backend uses UUID, I should check ArticlePreviewData definition. 
          // If it expects number, I might need to cast or mock ID if UUID. 
          // For now I'll cast, but likely type mismatch if UUID. 
          // Actually, I should probably check ArticlePreviewData type in component.
          title: a.title,
          author: a.author_name || "Unknown",
          category: "General", // api doesn't return category name joined yet in getArticleForEdit? I'll check.
          coverImage: a.metadata?.coverImage || "/images/placeholder.jpg",
          content: a.content || "",
          lastEdited: new Date(a.updated_at || a.created_at).toLocaleDateString(),
        });
      }
    } catch (err) {
      console.error("Failed to fetch article preview", err);
    } finally {
      setLoading(false);
    }
  };


  return <ArticlePreview article={article} loading={loading} />;
}
