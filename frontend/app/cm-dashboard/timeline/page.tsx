"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, ArrowRight, FileText, User } from "lucide-react";
import { getJSON } from "@/lib/api";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  author: string;
  status: string;
  date: string;
}

export default function TimelineIndexPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc"); // date-desc, date-asc, status

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await getJSON('/content-manager/submissions');
      setArticles(res.data);
    } catch (err) {
      console.error('Failed to fetch articles', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredArticles = articles
    .filter(a =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.author.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

  return (
    <main className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workflow Timelines</h1>
          <p className="text-slate-500 text-sm">Select an article to view its detailed history and status timeline.</p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search articles or authors..."
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading articles...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => router.push(`/cm-dashboard/submissions/${article.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(article.status)}`}>
                    {article.status.replace('_', ' ')}
                  </div>
                  <Clock size={14} className="text-slate-400" />
                </div>

                <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>

                <div className="flex items-center text-xs text-slate-500 mb-4">
                  <User size={14} className="mr-1" />
                  {article.author}
                  <span className="mx-2">•</span>
                  <span>{article.date}</span>
                </div>

                <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-indigo-600">
                  <span className="text-sm font-medium">View Timeline</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-slate-500">
              No articles found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function getStatusStyle(status: string) {
  const styles: any = {
    submitted: "bg-yellow-100 text-yellow-700 border-yellow-200",
    under_review: "bg-blue-100 text-blue-700 border-blue-200",
    changes_requested: "bg-orange-100 text-orange-700 border-orange-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    published: "bg-purple-100 text-purple-700 border-purple-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };
  return styles[status] || "bg-slate-100 text-slate-700";
}
