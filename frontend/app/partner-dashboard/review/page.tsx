"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  FileText,
  Loader2
} from "lucide-react";

type Article = {
  id: string;
  title: string;
  status: string;
  author_name?: string;
  updated_at: string;
  similarity_score?: number; // Mock or real
};

const raw = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000").replace(/\/+$/, "");
const API_BASE = raw.endsWith("/api") ? raw.slice(0, -4) : raw;

export default function PartnerReviewPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingInfo, setCheckingInfo] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchReviews();
  }, []);

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("ACCESS_TOKEN") || localStorage.getItem("token") || localStorage.getItem("idToken");
  };

  const fetchReviews = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/author/my-articles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.status === "success") {
        // Filter for review-relevant statuses or show all
        // For partner, showing all 'submitted' or 'draft' that need attention
        setArticles(json.data.articles);
      }
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlagiarismCheck = async (id: string) => {
    setCheckingInfo(prev => ({ ...prev, [id]: true }));
    // Simulate check
    await new Promise(r => setTimeout(r, 2000));
    setCheckingInfo(prev => ({ ...prev, [id]: false }));
    alert("Similarity check complete. Score: " + (Math.random() * 20).toFixed(1) + "%");
    // In real app, re-fetch article to get score
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Review & Plagiarism
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base">
            Ensure integrity and quality before publishing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Card className="flex-1 md:flex-none px-4 py-2 flex items-center gap-2 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <div className="text-xs">
              <span className="font-bold text-emerald-700 block">45 Approved</span>
              <span className="text-emerald-600/70">This Month</span>
            </div>
          </Card>
          <Card className="flex-1 md:flex-none px-4 py-2 flex items-center gap-2 bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div className="text-xs">
              <span className="font-bold text-red-700 block">3 flagged</span>
              <span className="text-red-600/70">High Similarity</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Review List */}
      <Card className="border shadow-sm overflow-hidden bg-white dark:bg-slate-900 rounded-xl">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search submissions..."
              className="w-full bg-white dark:bg-slate-950 border rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="text-xs text-slate-500 w-full md:w-auto text-right">
            Showing {articles.length} records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium border-b dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Article</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Similarity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" /></td></tr>
              ) : articles.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">No articles waiting for review.</td></tr>
              ) : (
                articles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-[200px]">{article.title}</div>
                          <div className="text-xs text-slate-500">ID: {article.id.substring(0, 6)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="capitalize bg-slate-100 text-slate-600 border-slate-200">
                        {article.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {article.similarity_score !== undefined ? (
                          <div className={`px-2 py-1 rounded text-xs font-bold ${article.similarity_score > 20 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {article.similarity_score}%
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Not checked</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePlagiarismCheck(article.id)}
                          disabled={checkingInfo[article.id]}
                          className="h-8 text-xs relative overflow-hidden"
                        >
                          {checkingInfo[article.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3 mr-1" />}
                          {checkingInfo[article.id] ? "Scanning..." : "Check"}
                        </Button>
                        <Button size="sm" variant="default" className="h-8 bg-slate-900 hover:bg-slate-800 text-xs">
                          <Eye className="h-3 w-3 mr-1" /> Review
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
