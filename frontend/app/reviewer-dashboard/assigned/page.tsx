"use client";

import { useState, useEffect } from "react";
import { getJSON } from "@/lib/api";
import {
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  ArrowRight,
  Search
} from "lucide-react";
import Link from 'next/link';

export default function AssignedReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await getJSON('/reviewer/assignments');
      if (res.data) setReviews(res.data);
    } catch (e) {
      console.error("Failed to fetch assignments", e);
      // Fallback for demo if backend not fully wired with auth yet
      // setReviews([]); 
    } finally {
      setLoading(false);
    }
  };

  const filtered = reviews.filter(r => {
    const authorName = typeof r.author === 'object' ? r.author.name : r.author;
    return r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(authorName).toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assigned Reviews</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage and complete your content evaluations.</p>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300">
          <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500">No pending reviews found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((review) => {
            const authorName = typeof review.author === 'object' ? review.author.name : review.author;
            return (
              <div key={review.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
                            ${review.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}
                        `}>
                      {review.status}
                    </span>
                    {review.priority && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
                            ${review.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                          review.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}
                        `}>
                        {review.priority} Priority
                      </span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> Due: {review.dueDate}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">
                    {review.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><FileText size={14} /> {review.category}</span>
                    <span>•</span>
                    <span>By {authorName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Link
                    href={`/reviewer-dashboard/workspace?id=${review.articleId}`}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors w-full md:w-auto justify-center"
                  >
                    Start Review <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
