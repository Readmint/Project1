"use client";

import { useState, useEffect } from "react";
import { getJSON } from "@/lib/api";
import ArticleCard from "@/components/reader-dashboard/ArticleCard";
import { Loader2, BookmarkX } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const res = await getJSON("/reader/bookmarks");
      if (res.status === "success") {
        setBookmarks(res.data);
      }
    } catch (e) {
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (article: any) => {
    addToCart({
      id: article.id,
      title: article.title,
      price: typeof article.price === 'string' ? parseFloat(article.price) : article.price,
      author: article.author_name
    });
  };

  const handleBookmarkChange = (id: string, isBookmarked: boolean) => {
    if (!isBookmarked) {
      // Remove from local list instantly
      setBookmarks(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookmarkX className="text-indigo-600" /> My Bookmarks
      </h1>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((b) => (
            <ArticleCard
              key={b.id}
              article={b}
              onAddToCart={handleAddToCart}
              onBookmarkChange={handleBookmarkChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <p className="text-slate-500">You haven't bookmarked any articles yet.</p>
        </div>
      )}
    </div>
  );
}
