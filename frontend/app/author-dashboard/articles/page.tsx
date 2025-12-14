"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner"; // Assuming sonner is used, or alert/console fallback

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  LayoutDashboard,
  Plus,
  FileText,
  CheckCircle2,
  Clock3,
  FilePenLine,
  FileClock,
  Search,
  Filter,
  Download,
  BarChart3,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";
import { StatusTracker } from "@/components/author/StatusTracker";

type Status = "Published" | "In Review" | "Revise" | "Draft" | "Rejected";

// -------------------------
// API base normalization (robust)
// Accepts NEXT_PUBLIC_API_BASE = "http://localhost:5000" or "http://localhost:5000/api"
// Produces API_ROOT that you can use with /article/... routes
const rawApi = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");
const API_BASE = rawApi.endsWith("/api") ? rawApi.replace(/\/api$/, "") : rawApi;
const API_ROOT = `${API_BASE}/api`.replace(/\/+$/, "");

type Article = {
  id: string;
  title: string;
  category: string;
  status: string; // Keep raw status for tracker
  views?: number;
  likes?: number;
  comments?: number;
  publishedAt?: string | null;
  slug?: string | null;
  attachment_url?: string | null;
  summary?: string;
};

export default function MyArticlesPage() {
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<string | "All">("All");

  // Robust getToken (checks common keys and trims)
  const getToken = () => {
    try {
      if (typeof window === "undefined") return null;
      const keys = ["ACCESS_TOKEN", "token", "idToken"];
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v && v.trim()) return v.trim();
      }
      return null;
    } catch (err) {
      console.warn("getToken error", err);
      return null;
    }
  };

  // ---- load articles ----
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        console.error("No authentication token found");
        router.push("/login");
        return;
      }

      const url = `${API_ROOT}/article/author/my-articles?limit=100`;
      console.log("Fetching articles from:", url);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", res.status);

      const body = await (async () => {
        try {
          return await res.json();
        } catch {
          return null;
        }
      })();

      console.log("Response body:", body);

      if (!res.ok) {
        throw new Error(body?.message || body?.error || `Failed to fetch articles: ${res?.status}`);
      }

      // The data is in body.data.articles
      const rows = body?.data?.articles || [];
      console.log("Articles data:", rows);

      // map DB rows to UI Article
      const mapped: Article[] = rows.map((r: any) => {
        // Safely extract category
        let category = "General";
        try {
          if (r.metadata && typeof r.metadata === "object" && r.metadata.category) {
            category = r.metadata.category;
          } else if (r.category && typeof r.category === "string") {
            category = r.category;
          } else if (r.metadata && typeof r.metadata === "string") {
            const metadata = JSON.parse(r.metadata);
            if (metadata.category) {
              category = metadata.category;
            }
          }
        } catch (err) {
          console.warn("Failed to parse category for article:", r.id, err);
        }

        // Safely extract summary
        let summaryText = "";
        try {
          if (r.summary && typeof r.summary === "string") {
            summaryText = r.summary;
          } else if (r.metadata && typeof r.metadata === "object" && r.metadata.summary) {
            summaryText = r.metadata.summary;
          }
        } catch (err) {
          console.warn("Failed to parse summary for article:", r.id);
        }

        return {
          id: r.id || "",
          title: r.title || "Untitled",
          category: category,
          status: r.status || "draft", // Use raw status
          views: r.views || 0,
          likes: r.likes || 0,
          comments: r.comments || 0,
          publishedAt: r.published_at || r.created_at || null,
          slug: r.slug || null,
          attachment_url: r.attachment_url || null,
          summary: summaryText,
        };
      });

      console.log("Mapped articles:", mapped);
      setArticles(mapped);
    } catch (err: any) {
      console.error("Fetch articles error:", err?.message ?? err);
      // alert(`Failed to load articles: ${err?.message ?? String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Derived values ----
  const stats = useMemo(() => {
    const total = articles.length;
    // Map status for simple counters - status strings might vary, adjust as needed
    const published = articles.filter((a) => a.status === "published" || a.status === "Published").length;
    const inReview = articles.filter((a) => a.status === "submitted" || a.status === "under_review").length;
    const drafts = articles.filter((a) => a.status === "draft").length;

    // Just group rejected/revise/etc into general buckets if needed, or stick to simpler stats
    return { total, published, inReview, drafts };
  }, [articles]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => set.add(a.category || "General"));
    return Array.from(set);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase());

      // Status filter might need mapping if dropdown uses "All/Published/Draft" but internal status is snake_case
      const matchesStatus = statusFilter === "All" ? true :
        (statusFilter === "Published" ? (a.status === "published" || a.status === "approved") :
          statusFilter === "In Review" ? (a.status === "submitted" || a.status === "under_review") :
            statusFilter === "Draft" ? (a.status === "draft") :
              statusFilter === "Rejected" ? (a.status === "rejected") :
                true); // Simple mapping

      const matchesCategory = categoryFilter === "All" ? true : a.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [articles, search, statusFilter, categoryFilter]);

  // ---- Actions ----
  const handleExport = () => {
    const headers = ["Title", "Category", "Status", "Views", "Likes", "Comments", "Published Date"];
    const rows = filteredArticles.map((a) => [a.title, a.category, a.status, a.views ?? "", a.likes ?? "", a.comments ?? "", a.publishedAt ?? ""]);

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-articles.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleWriteNewArticle = () => {
    router.push("/author-dashboard/submit");
  };

  const handleViewStats = (article: Article) => {
    router.push(`/author-dashboard/articles/${article.id}/stats`);
  };

  const handleViewArticle = async (article: Article) => {
    if (!article || !article.id || article.id.trim() === "") {
      alert("Cannot preview: missing article id.");
      return;
    }
    // author preview or live view depending on status? for now just preview in dashboard
    router.push(`/author-dashboard/articles/${article.id}/preview`);
  };

  const handleEditArticle = (article: Article) => {
    router.push(`/author-dashboard/submit?articleId=${article.id}`);
  };

  const handleDeleteDraft = async (article: Article) => {
    const ok = window.confirm(`Delete draft "${article.title}"? This action cannot be undone.`);
    if (!ok) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_ROOT}/article/author/articles/${article.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
    } catch (err) {
      console.error("Delete draft error:", err);
      alert("Failed to delete draft");
    }
  };

  const submitDraft = async (article: Article) => {
    const ok = window.confirm(`Submit "${article.title}" for review?`);
    if (!ok) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_ROOT}/article/author/articles/${article.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ status: "submitted", note: "Submitted by author" }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      await fetchArticles();
    } catch (err) {
      console.error("Submit draft error:", err);
      alert("Failed to submit draft");
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatNumber = (n?: number) => {
    if (n == null) return "-";
    return n.toLocaleString();
  };

  return (
    <div className="space-y-6 p-3 md:p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-indigo-600" />
            My Articles
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage and track all your submitted articles</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={fetchArticles} variant="outline" size="sm" className="flex items-center gap-2" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={handleWriteNewArticle} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-full px-4">
            <Plus className="h-4 w-4" /> Write New Article
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Total Articles</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Published</p>
            <p className="text-2xl font-semibold">{stats.published}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Under Review</p>
            <p className="text-2xl font-semibold">{stats.inReview}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Drafts</p>
            <p className="text-2xl font-semibold">{stats.drafts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1 flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-end">
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-slate-400 hidden md:block" />
            <select
              className="text-xs md:text-sm border rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-900"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | "All")}
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="In Review">Under Review</option>
              {/* <option value="Revise">Revision Required</option> */}
              <option value="Draft">Drafts</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1 rounded-full text-xs md:text-sm">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Articles List (Cards) */}
      <div className="space-y-4">
        {filteredArticles.map((article, idx) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="rounded-xl overflow-hidden hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
              <CardContent className="p-0">
                {/* Upper Content Section */}
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1 mr-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                          {article.category}
                        </span>
                        {(article.status === "rejected" || article.status === "published") && (
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${article.status === "rejected" ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                            {article.status}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                        {article.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 max-w-3xl">
                        {article.summary || "No summary available."}
                      </p>
                    </div>

                    {/* Desktop Actions (Top Right) */}
                    <div className="hidden md:flex items-center gap-2">
                      {article.status === "published" && (
                        <Button size="sm" variant="outline" onClick={() => handleViewArticle(article)} className="gap-2">
                          <Eye size={14} /> View Live
                        </Button>
                      )}
                      {article.status === "draft" && (
                        <Button size="sm" onClick={() => handleEditArticle(article)} className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
                          <Edit2 size={14} /> Edit
                        </Button>
                      )}
                      {(article.status === "draft" || article.status === "submitted" || article.status === "rejected") && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:text-rose-600" onClick={() => handleDeleteDraft(article)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-6 pt-1">
                    <div className="flex items-center gap-2 text-slate-500 text-sm" title="Views">
                      <BarChart3 size={16} />
                      <span className="font-medium">{formatNumber(article.views)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm" title="Likes">
                      <ThumbsUp size={16} />
                      <span className="font-medium">{formatNumber(article.likes)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm" title="Comments">
                      <MessageCircle size={16} />
                      <span className="font-medium">{formatNumber(article.comments)}</span>
                    </div>
                    <div className="text-xs text-slate-400 border-l pl-4 border-slate-200 dark:border-slate-700">
                      Updated {formatDate(article.publishedAt)}
                    </div>
                  </div>
                </div>

                {/* Status Tracker Footer (Full Width) */}
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-6 py-6">
                  <StatusTracker status={article.status} />

                  {/* Mobile Actions Footer */}
                  <div className="md:hidden mt-4 pt-4 border-t border-slate-200/50 flex justify-end gap-2">
                    {article.status === "draft" && (
                      <Button size="sm" onClick={() => handleEditArticle(article)}>Edit</Button>
                    )}
                    {article.status === "published" && (
                      <Button size="sm" variant="outline" onClick={() => handleViewArticle(article)}>View Live</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {!loading && filteredArticles.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No articles found</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't created any articles matching your filters yet.
            </p>
            <Button onClick={handleWriteNewArticle} className="mt-6">
              <Plus className="h-4 w-4 mr-2" /> Create New Article
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}
