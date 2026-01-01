"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileText, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// Types
type Article = {
  id: string;
  title: string;
  status: string;
  author_name?: string; // If available, or use logged in user
  updated_at: string;
};

import { API_BASE } from "@/lib/api";
// Use API_BASE directly instead of manual calculation
const API_ROOT = API_BASE;

export default function PartnerSubmissionsPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("ACCESS_TOKEN") || localStorage.getItem("token") || localStorage.getItem("idToken");
  };

  const fetchSubmissions = async () => {
    try {
      const token = getToken();
      if (!token) return;
      // Reusing list articles endpoint or specific partner endpoint
      // Using author/articles for now as partner is an author too in this context
      const res = await fetch(`${API_BASE}/api/author/my-articles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.status === "success") {
        setArticles(json.data.articles);
      }
    } catch (err) {
      console.error("Failed to fetch submissions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    // Simulate upload and extraction
    setUploading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Fake 2s upload
    setUploading(false);
    alert("File uploaded! Extraction processing started. (Mock)");
    // In real app, this would POST file and trigger extraction job
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "published": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "submitted": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "draft": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
      default: return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  const getStatusLabel = (status: string) => {
    // User asked for "Extracted" status representation
    if (status === 'draft') return 'Extracted (Draft)';
    if (status === 'submitted') return 'Processing';
    if (status === 'published') return 'Completed';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 min-h-screen">

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Submissions & Extraction
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base">
          Upload bulk Word files and manage extracted topics.
        </p>
      </div>

      {/* Upload Section */}
      <Card className="p-6 md:p-8 border-dashed border-2 border-indigo-200 dark:border-slate-700 bg-indigo-50/50 dark:bg-slate-900/50 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 hover:border-indigo-400 transition-colors group cursor-pointer">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
          <UploadCloud className="h-10 w-10 text-indigo-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upload Word File</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Upload one .docx file containing all participants, abstracts, and papers.
            Our AI will extract individual topics automatically.
          </p>
        </div>
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
        >
          {uploading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Extracting...</> : "Upload File"}
        </Button>
      </Card>

      {/* Extracted Topics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-purple-500" /> Extracted Topics
          </h2>
          <Badge variant="outline" className="px-3 py-1">
            {articles.length} Items
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
        ) : articles.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl">No submissions found. Upload a file to start.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <Card key={article.id} className="p-5 hover:shadow-xl transition-all duration-300 border-l-4 border-l-indigo-500 group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      {article.title || "Untitled Extraction"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>ID: {article.id.substring(0, 8)}</span>
                      <span>•</span>
                      <span>{new Date(article.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStatusColor(article.status)}`}>
                    {getStatusLabel(article.status)}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {getStatusLabel(article.status) === 'Extracted (Draft)' ? (
                    <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Ready for Review
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" /> In Process
                    </span>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-xs hover:bg-indigo-50 hover:text-indigo-600"
                    onClick={() => router.push(`/partner-dashboard/create-article?articleId=${article.id}`)}
                  >
                    View Submission
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
