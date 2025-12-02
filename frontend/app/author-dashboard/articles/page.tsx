"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
} from "lucide-react";

type Status = "Published" | "In Review" | "Revise" | "Draft" | "Rejected";

type Article = {
  id: string;
  title: string;
  category: string;
  status: Status;
  views?: number;
  likes?: number;
  publishedAt?: string; // ISO date or display string
  slug?: string;
};

const initialArticles: Article[] = [
  {
    id: "1",
    title: "The Future of Artificial Intelligence in Healthcare",
    category: "Technology",
    status: "Published",
    views: 12450,
    likes: 324,
    publishedAt: "2025-11-15",
    slug: "future-of-ai-healthcare",
  },
  {
    id: "2",
    title: "Sustainable Business Practices for Modern Enterprises",
    category: "Business",
    status: "In Review",
  },
  {
    id: "3",
    title: "Machine Learning: A Comprehensive Guide",
    category: "Technology",
    status: "Published",
    views: 8920,
    likes: 217,
    publishedAt: "2025-10-28",
    slug: "ml-comprehensive-guide",
  },
  {
    id: "4",
    title: "The Psychology of Consumer Behavior",
    category: "Business",
    status: "Draft",
  },
  {
    id: "5",
    title: "Climate Change and Its Global Impact",
    category: "Science",
    status: "Revise",
  },
  {
    id: "6",
    title: "Digital Marketing Trends for 2026",
    category: "Business",
    status: "Published",
    views: 15680,
    likes: 428,
    publishedAt: "2025-11-10",
    slug: "digital-marketing-trends-2026",
  },
];

export default function MyArticlesPage() {
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<string | "All">("All");

  // ---- Derived values ----
  const stats = useMemo(() => {
    const total = articles.length;
    const published = articles.filter((a) => a.status === "Published").length;
    const inReview = articles.filter((a) => a.status === "In Review").length;
    const drafts = articles.filter((a) => a.status === "Draft").length;
    return { total, published, inReview, drafts };
  }, [articles]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => set.add(a.category));
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

  const handleViewArticle = (article: Article) => {
    // Change this to your real public article URL
    if (article.slug) {
      router.push(`/articles/${article.slug}`);
    } else {
      router.push(`/author-dashboard/articles/${article.id}/preview`);
    }
  };

  const handleEditArticle = (article: Article) => {
    // The submit page can read `articleId` from the query and pre-fill the form.
    router.push(`/author-dashboard/submit?articleId=${article.id}`);
  };

  const handleDeleteDraft = (article: Article) => {
    const ok = window.confirm(
      `Delete draft "${article.title}"? This action cannot be undone.`
    );
    if (!ok) return;
    setArticles((prev) => prev.filter((a) => a.id !== article.id));
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

  const formatDate = (iso?: string) => {
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

        <Button
          onClick={handleWriteNewArticle}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-full px-4"
        >
          <Plus className="h-4 w-4" /> Write New Article
        </Button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
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
              <option value="Revise">Revise</option>
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 flex items-center gap-1"
                          onClick={() => handleEditArticle(article)}
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </Button>
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
                    No articles found. Try adjusting filters or search terms.
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
    </div>
  );
}
