// app/editor/version-history/page.tsx
"use client";


import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  History,
  Clock,
  FileDiff,
  User,
  XCircle,
  Layers,
  Eye,
  RefreshCw,
  Search,
  ChevronDown
} from "lucide-react";
import { getJSON, postJSON } from "@/lib/api";
import { useRouter } from "next/navigation";

// Types matching backend response
type VersionEntry = {
  id: string; // UUID from backend
  editor: string;
  timestamp: string;
  status: string; // we'll map or use raw
  note?: string;
  title: string;
};

type ArticleOption = {
  id: number;
  title: string;
};

export default function VersionHistoryPage() {
  const router = useRouter();

  // State
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);

  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const [selectedVersion, setSelectedVersion] = useState<VersionEntry | null>(null);
  const [search, setSearch] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  // 1. Fetch Assigned Articles for selection dropdown
  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await getJSON("/editor/assigned");
        if (res.status === 'success') {
          const opts = res.data.map((a: any) => ({ id: a.article_id, title: a.title }));
          setArticles(opts);
          if (opts.length > 0) setSelectedArticleId(opts[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch articles", e);
      }
    }
    fetchArticles();
  }, []);

  // 2. Fetch Versions when article selected
  useEffect(() => {
    if (!selectedArticleId) return;
    fetchVersions(selectedArticleId);
  }, [selectedArticleId, refreshKey]);

  const fetchVersions = async (artId: number) => {
    setLoadingVersions(true);
    try {
      const res = await getJSON(`/editor/articles/${artId}/versions`);
      if (res.status === 'success') {
        const mapped: VersionEntry[] = res.data.map((v: any) => ({
          id: v.id,
          editor: v.editor_name || "Unknown Editor",
          timestamp: new Date(v.created_at).toLocaleString(),
          status: "Saved Version", // default as backend doesn't store distinct status per version yet
          note: v.note,
          title: v.title
        }));
        setVersions(mapped);
      } else {
        setVersions([]);
      }
    } catch (e) {
      console.error("Failed to fetch versions", e);
      setVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  // 3. Restore Handler
  const handleRestore = async () => {
    if (!selectedVersion) return;
    if (!confirm("Are you sure you want to restore this version? This will become the new current content.")) return;

    try {
      const res = await postJSON(`/editor/version/${selectedVersion.id}/restore`, {});
      if (res.status === 'success') {
        alert("Version restored successfully!");
        setSelectedVersion(null);
        setRefreshKey(p => p + 1); // refresh list
      }
    } catch (e: any) {
      alert("Failed to restore: " + (e.message || "Unknown error"));
    }
  };

  const currentArticleTitle = articles.find(a => a.id === selectedArticleId)?.title || "Select Article";

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History size={24} className="text-indigo-600" />
            <h1 className="text-2xl font-bold">Version History</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View and restore previous edits.
          </p>
        </div>

        {/* Article Selector */}
        <div className="relative w-full md:w-64">
          <select
            className="w-full appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-8 text-sm outline-none focus:ring-2 ring-indigo-500"
            value={selectedArticleId || ""}
            onChange={(e) => setSelectedArticleId(Number(e.target.value))}
          >
            {articles.length === 0 && <option value="">No assignments</option>}
            {articles.map(a => (
              <option key={a.id} value={a.id}>{truncate(a.title, 30)}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar / List */}
        <div className="flex-1">
          {/* Search */}
          <div className="relative mb-6">
            <input
              placeholder="Search by editor or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 pl-9 py-2 border border-slate-200 dark:border-slate-700 rounded-full text-sm outline-none focus:border-indigo-600 shadow-sm"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          </div>

          {loadingVersions ? (
            <div className="text-center py-10 text-slate-500">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed">
              No version history found for this article.
            </div>
          ) : (
            <div className="space-y-4">
              {versions
                .filter(v =>
                  v.editor.toLowerCase().includes(search.toLowerCase()) ||
                  (v.note || "").toLowerCase().includes(search.toLowerCase())
                )
                .map((v) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 items-start group"
                  >
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center pt-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/30"></div>
                      <div className="w-[1px] h-full bg-slate-200 dark:bg-slate-800 group-last:hidden min-h-[50px]"></div>
                    </div>

                    <Card
                      onClick={() => setSelectedVersion(v)}
                      className={`flex-1 border shadow-none hover:shadow-md transition-all cursor-pointer ${selectedVersion?.id === v.id ? 'ring-2 ring-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'bg-white dark:bg-slate-800'}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1.5 rounded-full text-indigo-600">
                              <User size={12} />
                            </div>
                            <span className="font-medium text-sm">{v.editor}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-full">{v.timestamp}</span>
                        </div>

                        {v.note && (
                          <div className="text-xs text-slate-600 dark:text-slate-300 italic mb-2 relative pl-3 border-l-2 border-slate-300">
                            "{v.note}"
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            version ID: {v.id.slice(0, 8)}...
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          )}
        </div>

      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedVersion && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVersion(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <FileDiff size={18} className="text-indigo-600" /> Version Details
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">ID: {selectedVersion.id}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedVersion(null)} className="rounded-full hover:bg-slate-100">
                  <XCircle size={20} className="text-slate-400" />
                </Button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-indigo-600 shadow-sm border">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Editor</p>
                      <p className="font-medium text-sm">{selectedVersion.editor}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="font-medium text-sm">{selectedVersion.timestamp}</p>
                  </div>
                </div>

                {selectedVersion.note && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 rounded-xl text-sm border border-indigo-100 dark:border-indigo-800/50">
                    <p className="flex items-center gap-2 mb-1 text-xs font-bold uppercase tracking-wide opacity-70"><Layers size={10} /> Change Note</p>
                    {selectedVersion.note}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl h-12"
                  disabled // Diff not implemented yet
                >
                  <Eye size={16} className="mr-2" /> View Diff
                </Button>

                <Button
                  onClick={handleRestore}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  <RefreshCw size={16} className="mr-2" /> Restore Version
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function truncate(str: string, n: number) {
  return (str.length > n) ? str.slice(0, n - 1) + '...' : str;
}

