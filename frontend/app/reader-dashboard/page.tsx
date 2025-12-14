"use client";

import { useState, useEffect } from "react";
import { getJSON } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { Loader2, BookOpen, ShoppingCart, Lock, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Article {
  id: string;
  title: string;
  synopsis: string;
  author_name: string;
  category_name: string;
  price: number;
  is_free: number; // 1 or 0
  is_purchased: boolean;
  published_at: string;
}

export default function ReaderDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [library, setLibrary] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Parallel fetch
      const [shopRes, libRes] = await Promise.all([
        getJSON("/reader/articles"),
        getJSON("/reader/library")
      ]);

      if (shopRes.status === "success") setArticles(shopRes.data);
      if (libRes.status === "success") setLibrary(libRes.data);
    } catch (e) {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (article: Article) => {
    addToCart({
      id: article.id,
      title: article.title,
      price: typeof article.price === 'string' ? parseFloat(article.price) : article.price, // handle string/decimal from DB
      author: article.author_name
    });
  };

  const ArticleCard = ({ article, isLibrary = false }: { article: Article, isLibrary?: boolean }) => {
    const hasAccess = article.is_free === 1 || article.is_purchased || isLibrary;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
        <div className="p-5 flex-1 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {article.category_name || "General"}
            </span>
            {hasAccess ? (
              <span className="text-green-600 dark:text-green-400 flex items-center gap-1 text-xs font-bold">
                <CheckCircle size={12} /> Owned
              </span>
            ) : (
              <span className="text-slate-500 font-medium text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                ${Number(article.price).toFixed(2)}
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2">
            {article.title}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
            {article.synopsis || "No synopsis available."}
          </p>

          <div className="text-xs text-slate-500 pt-2">
            By {article.author_name} • {new Date(article.published_at).toLocaleDateString()}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex gap-2">
          {hasAccess ? (
            <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Link href={`/reader/article/${article.id}`}>
                <BookOpen size={16} /> Read Now
              </Link>
            </Button>
          ) : (
            <Button
              onClick={() => handleAddToCart(article)}
              variant="outline"
              className="w-full border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white gap-2"
            >
              <ShoppingCart size={16} /> Add to Cart
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reader Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Explore new magazines and access your library.</p>
        </div>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-8">
          <TabsTrigger value="browse">Browse Content</TabsTrigger>
          <TabsTrigger value="library">My Library</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="animate-in fade-in-50">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <p className="text-slate-500">No published articles yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="animate-in fade-in-50">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : library.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {library.map(article => (
                <ArticleCard key={article.id} article={article} isLibrary={true} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Your library is empty</h3>
              <p className="text-muted-foreground mt-2">Purchased articles will appear here.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
