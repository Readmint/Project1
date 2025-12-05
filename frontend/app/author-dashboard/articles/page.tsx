"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {LayoutDashboard, Plus, FileText, CheckCircle2, Clock3, FilePenLine, FileClock, Search, Filter, Download, BarChart3, Eye, Edit2, Trash2, RefreshCw,} from "lucide-react";

type Status = "Published" | "In Review" | "Revise" | "Draft" | "Rejected";

type Article = {
  id: string;
  title: string;
  category: string;
  status: Status;
  views?: number;
  likes?: number;
  publishedAt?: string | null;
  slug?: string | null;
  attachment_url?: string | null;
  summary?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export default function MyArticlesPage() {
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<string | "All">("All");

  const getToken = () => localStorage.getItem("token") || "";

  // status mapping between backend and UI
  const mapBackendToUIStatus = (s: string | null): Status => {
    if (!s) return "Draft";
    const st = s.toLowerCase().trim();
    
    if (st === "published" || st === "approved") return "Published";
    if (st === "under_review" || st === "submitted") return "In Review";
    if (st === "changes_requested" || st === "revise") return "Revise";
    if (st === "draft") return "Draft";
    if (st === "rejected") return "Rejected";
    
    console.warn("Unknown status:", s);
    return "Draft";
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

      console.log("Fetching articles from:", `${API_BASE}/article/author/my-articles`);
      
      // fetch all articles for this author with limit parameter
      const res = await fetch(`${API_BASE}/article/author/my-articles?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Response status:", res.status);
      
      const body = await res.json();
      console.log("Response body:", body);
      
      if (!res.ok) {
        throw new Error(body.message || body.error || `Failed to fetch articles: ${res.status}`);
      }

      // The data is in body.data.articles
      const rows = body.data?.articles || [];
      console.log("Articles data:", rows);

      // map DB rows to UI Article
      const mapped: Article[] = rows.map((r: any) => {
        // Safely extract category
        let category = "General";
        try {
          // First try metadata.category
          if (r.metadata && typeof r.metadata === 'object' && r.metadata.category) {
            category = r.metadata.category;
          } 
          // Then try r.category (which might be set from backend)
          else if (r.category && typeof r.category === 'string') {
            category = r.category;
          }
          // Then try parsing metadata string
          else if (r.metadata && typeof r.metadata === 'string') {
            const metadata = JSON.parse(r.metadata);
            if (metadata.category) {
              category = metadata.category;
            }
          }
        } catch (err) {
          console.warn("Failed to parse category for article:", r.id, err);
        }

        // Safely extract summary
        let summaryText = '';
        try {
          if (r.summary && typeof r.summary === 'string') {
            summaryText = r.summary;
          } else if (r.metadata && typeof r.metadata === 'object' && r.metadata.summary) {
            summaryText = r.metadata.summary;
          }
        } catch (err) {
          console.warn("Failed to parse summary for article:", r.id);
        }

        return {
          id: r.id || '',
          title: r.title || 'Untitled',
          category: category,
          status: mapBackendToUIStatus(r.status),
          views: r.views || 0,
          likes: r.likes || 0,
          publishedAt: r.published_at || r.created_at || null,
          slug: r.slug || null,
          attachment_url: r.attachment_url || null,
          summary: summaryText
        };
      });

      console.log("Mapped articles:", mapped);
      setArticles(mapped);
    } catch (err: any) {
      console.error("Fetch articles error:", err.message, err);
      alert(`Failed to load articles: ${err.message}`);
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
    const published = articles.filter((a) => a.status === "Published").length;
    const inReview = articles.filter((a) => a.status === "In Review").length;
    const drafts = articles.filter((a) => a.status === "Draft").length;
    const revise = articles.filter((a) => a.status === "Revise").length;
    const rejected = articles.filter((a) => a.status === "Rejected").length;
    
    return { total, published, inReview, drafts, revise, rejected };
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
      const matchesStatus =
        statusFilter === "All" ? true : a.status === statusFilter;
      const matchesCategory =
        categoryFilter === "All" ? true : a.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [articles, search, statusFilter, categoryFilter]);

  // ---- Actions ----
  const handleExport = () => {
    const headers = [
      "Title",
      "Category",
      "Status",
      "Views",
      "Likes",
      "Published Date",
    ];
    const rows = filteredArticles.map((a) => [
      a.title,
      a.category,
      a.status,
      a.views ?? "",
      a.likes ?? "",
      a.publishedAt ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
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

 // replace existing handleViewArticle with this version
const handleViewArticle = async (article: Article) => {
  // Basic guard
  if (!article || !article.id || article.id.trim() === "") {
    alert("Cannot preview: missing article id. Please refresh the page.");
    console.error("Preview blocked: missing article id for", article);
    return;
  }

  // If article has a public slug, go to public article page
  if (article.slug) {
    router.push(`/articles/${article.slug}`);
    return;
  }

  // Otherwise: verify article exists on server before navigating
  try {
    const token = getToken();
    if (!token) {
      alert("Not authenticated. Please log in.");
      router.push("/login");
      return;
    }

    // Build URL — ensure API_BASE is set correctly (no double 'article')
    // Expected: API_BASE = 'http://localhost:5000/api/article'
    const url = `${API_BASE}/article/author/articles/${encodeURIComponent(article.id)}`;
    console.log("Preview: fetching article details from", url);

    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    let body: any = null;
    try { body = await res.json(); } catch (e) { /* ignore */ }

    console.log("Preview fetch status:", res.status, body);

    if (!res.ok) {
      // Show useful message to user
      const message = body?.message || `Preview fetch failed (${res.status})`;
      alert(`Cannot preview article: ${message}`);
      return;
    }

    // success — navigate to preview page (your Next route)
    router.push(`/author-dashboard/articles/${article.id}/preview`);
  } catch (err: any) {
    console.error("Preview error:", err);
    alert("Failed to load article preview: " + (err.message || String(err)));
  }
};


  const handleEditArticle = (article: Article) => {
    router.push(`/author-dashboard/submit?articleId=${article.id}`);
  };

  const handleDeleteDraft = async (article: Article) => {
    const ok = window.confirm(`Delete draft "${article.title}"? This action cannot be undone.`);
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/article/author/articles/${article.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Failed to delete");
      // remove locally
      setArticles(prev => prev.filter(a => a.id !== article.id));
    } catch (err) {
      console.error("Delete draft error:", err);
      alert("Failed to delete draft");
    }
  };

  // Optional: allow author to submit a draft from list
  const submitDraft = async (article: Article) => {
    const ok = window.confirm(`Submit "${article.title}" for review?`);
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/article/author/articles/${article.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: "submitted", note: "Submitted by author" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Failed to submit");
      // refresh list
      await fetchArticles();
    } catch (err) {
      console.error("Submit draft error:", err);
      alert("Failed to submit draft");
    }
  };

  // ---- Small UI helpers ----
  const renderStatusBadge = (status: Status) => {
    const base =
      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium";
    switch (status) {
      case "Published":
        return (
          <span className={`${base} bg-emerald-100 text-emerald-700`}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Published
          </span>
        );
      case "In Review":
        return (
          <span className={`${base} bg-blue-100 text-blue-700`}>
            <FileClock className="h-3 w-3 mr-1" /> Under Review
          </span>
        );
      case "Revise":
        return (
          <span className={`${base} bg-amber-100 text-amber-700`}>
            <FilePenLine className="h-3 w-3 mr-1" /> Revision Required
          </span>
        );
      case "Draft":
        return (
          <span className={`${base} bg-slate-100 text-slate-700`}>
            <FileText className="h-3 w-3 mr-1" /> Draft
          </span>
        );
      case "Rejected":
        return (
          <span className={`${base} bg-rose-100 text-rose-700`}>
            <FileText className="h-3 w-3 mr-1" /> Rejected
          </span>
        );
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
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage and track all your submitted articles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchArticles}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            onClick={handleWriteNewArticle}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-full px-4"
          >
            <Plus className="h-4 w-4" /> Write New Article
          </Button>
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Articles</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/40">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Published</p>
                <p className="text-2xl font-semibold">{stats.published}</p>
              </div>
              <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/40">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Under Review</p>
                <p className="text-2xl font-semibold">{stats.inReview}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/40">
                <Clock3 className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Drafts</p>
                <p className="text-2xl font-semibold">{stats.drafts}</p>
              </div>
              <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-800">
                <FileText className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search + filters + export */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
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

        {/* Filters */}
        <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-end">
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-slate-400 hidden md:block" />
            <select
              className="text-xs md:text-sm border rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-900"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as Status | "All")
              }
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="In Review">Under Review</option>
              <option value="Revise">Revision Required</option>
              <option value="Draft">Drafts</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <select
            className="text-xs md:text-sm border rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-900"
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as string | "All")
            }
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-1 rounded-full text-xs md:text-sm"
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Views</th>
                <th className="text-right px-4 py-3 font-medium">Likes</th>
                <th className="text-left px-4 py-3 font-medium">
                  Published Date
                </th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredArticles.map((article, idx) => (
                <motion.tr
                  key={article.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                      {article.title}
                    </div>
                    {article.summary && (
                      <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {article.summary}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {article.category}
                  </td>
                  <td className="px-4 py-3">{renderStatusBadge(article.status)}</td>
                  <td className="px-4 py-3 text-right">
                    {formatNumber(article.views)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatNumber(article.likes)}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {formatDate(article.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    {/* Actions based on status */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {article.status === "Published" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 flex items-center gap-1"
                            onClick={() => handleViewStats(article)}
                          >
                            <BarChart3 className="h-3 w-3" />
                            Stats
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 flex items-center gap-1"
                            onClick={() => handleViewArticle(article)}
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </>
                      )}

                      {article.status === "In Review" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 flex items-center gap-1"
                          onClick={() => handleViewArticle(article)}
                        >
                          <Eye className="h-3 w-3" />
                          Preview
                        </Button>
                      )}

                      {article.status === "Revise" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 flex items-center gap-1"
                            onClick={() => handleEditArticle(article)}
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 flex items-center gap-1"
                            onClick={() => handleViewArticle(article)}
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </Button>
                        </>
                      )}

                      {article.status === "Draft" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 flex items-center gap-1"
                            onClick={() => handleEditArticle(article)}
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 flex items-center gap-1 text-rose-600 border-rose-200 dark:border-rose-800"
                            onClick={() => handleDeleteDraft(article)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 flex items-center gap-1"
                            onClick={() => submitDraft(article)}
                          >
                            <FileClock className="h-3 w-3" />
                            Submit
                          </Button>
                        </>
                      )}

                      {article.status === "Rejected" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 flex items-center gap-1"
                          onClick={() => handleViewArticle(article)}
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}

              {filteredArticles.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    {loading ? "Loading articles..." : "No articles found. Try adjusting filters or search terms."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span>
            Showing {filteredArticles.length} of {articles.length} articles
          </span>
          {/* You can wire this up to real pagination later */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="h-7">
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Empty state with retry button */}
      {!loading && articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">No articles found. Try creating a new article!</p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={handleWriteNewArticle}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" /> Write Your First Article
            </Button>
            <Button 
              onClick={fetchArticles} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Loading
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}