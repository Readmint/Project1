"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  AlertTriangle,
  Loader2,
  FileText
} from "lucide-react";
import { getJSON, postJSON } from "@/lib/api";

export default function QualityCheckPage() {
  const [showPlagiarism, setShowPlagiarism] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState("");

  // Plagiarism State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("Ready to scan");
  const [plagiarismResult, setPlagiarismResult] = useState<any>(null);

  // FORM STATES
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState<number | "">("");
  const [category, setCategory] = useState("Select Category");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [imageVerified, setImageVerified] = useState(false);

  const categories = ["Tech", "Lifestyle", "Science", "Business", "Health"];

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await getJSON('/content-manager/submissions');
      if (res.data) setArticles(res.data);
    } catch (e) {
      console.error("Failed to fetch articles", e);
    } finally {
      setLoadingArticles(false);
    }
  };

  const handleSelectArticle = async (id: string) => {
    setSelectedArticleId(id);
    if (!id) {
      setContent("");
      setWordCount("");
      return;
    }

    try {
      const res = await getJSON(`/content-manager/submissions/${id}`);
      const article = res.data.article;

      setContent(article.content || "");
      setWordCount(article.content ? article.content.split(/\s+/).length : 0);
      setCategory(article.category || "Select Category");
      setSeoTitle(article.title || ""); // Default SEO title to article title
      setPlagiarismResult(null);
      setScanProgress(0);
    } catch (e) {
      console.error("Failed to fetch details", e);
    }
  };

  const runPlagiarismCheck = async () => {
    if (!content) return;

    setIsScanning(true);
    setScanProgress(10);
    setScanStatus("Connecting to database...");

    // Simulate steps for UI effect
    setTimeout(() => { setScanProgress(40); setScanStatus("Analyzing syntax patterns..."); }, 800);
    setTimeout(() => { setScanProgress(70); setScanStatus("Comparing against internal corpus..."); }, 1600);

    try {
      const res = await postJSON('/content-manager/check-plagiarism', {
        content,
        articleId: selectedArticleId
      });

      setTimeout(() => {
        setScanProgress(100);
        setScanStatus("Analysis complete");
        setPlagiarismResult(res);
        setIsScanning(false);
      }, 2200);

    } catch (e) {
      console.error("Check failed", e);
      setIsScanning(false);
      setScanStatus("Check failed. Try again.");
    }
  };

  // VALIDATION LOGIC
  const isWordCountValid = typeof wordCount === "number" && wordCount >= 300;
  const isCategoryValid = category !== "Select Category";
  const isSeoValid = seoTitle.trim().length > 0 && seoDesc.trim().length >= 50;
  const isImageCopyrightValid = imageVerified;
  const isPlagiarismSafe = plagiarismResult && plagiarismResult.score < 10; // Strict pass < 10%

  const allChecksPass =
    isWordCountValid &&
    isCategoryValid &&
    isSeoValid &&
    isImageCopyrightValid &&
    isPlagiarismSafe;

  return (
    <main className="px-6 py-6 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Quality Check</h1>
        <p className="text-slate-500 text-sm">
          Run automated checks and finalize content before publication.
        </p>
      </div>

      {/* 0. Article Selector */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Select Submission to Verify</label>
        <div className="relative">
          <select
            className="w-full pl-10 pr-4 py-2 border rounded-lg appearance-none bg-slate-50 dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={selectedArticleId}
            onChange={(e) => handleSelectArticle(e.target.value)}
            disabled={loadingArticles}
          >
            <option value="">-- Choose an article --</option>
            {articles.map(a => (
              <option key={a.id} value={a.id}>{a.title} (by {a.author})</option>
            ))}
          </select>
          <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
        </div>
        {selectedArticleId && (
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <FileText size={12} />
            <span>Loaded content: {String(wordCount)} words</span>
          </div>
        )}
      </div>

      {selectedArticleId && (
        <>
          {/* 1️⃣ Plagiarism Checker */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all">
            <div
              className="flex justify-between items-center px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => setShowPlagiarism(!showPlagiarism)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${plagiarismResult ? (plagiarismResult.score < 10 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600') : 'bg-indigo-100 text-indigo-600'}`}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Plagiarism Check</h3>
                  <p className="text-xs text-slate-500">
                    {isScanning ? scanStatus : (plagiarismResult ? `Analysis Complete: ${plagiarismResult.score}% Match` : "Not checked yet")}
                  </p>
                </div>
              </div>
              {showPlagiarism ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </div>

            {showPlagiarism && (
              <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                {!isScanning && !plagiarismResult && (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500 mb-4">Scan content against internal database for duplicates.</p>
                    <button
                      onClick={runPlagiarismCheck}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-transform active:scale-95 flex items-center gap-2 mx-auto"
                    >
                      <ShieldCheck size={16} /> Scan Now
                    </button>
                  </div>
                )}

                {isScanning && (
                  <div className="space-y-3 py-4">
                    <div className="flex justify-between text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                      <span>{scanStatus}</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                        style={{ width: `${scanProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {plagiarismResult && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${plagiarismResult.score < 10 ? "text-emerald-500" : "text-rose-500"}`}>
                          {100 - plagiarismResult.score}%
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">Unique Content</div>
                      </div>

                      <div className="flex-1 space-y-2 border-l pl-6 border-slate-100 dark:border-slate-800">
                        <h4 className="text-sm font-medium">Detailed Report</h4>
                        {plagiarismResult.score > 0 ? (
                          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1">
                            <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
                              <span>Highest Match Found:</span>
                              <span className="text-rose-500">{plagiarismResult.score}% Similarity</span>
                            </div>
                            {plagiarismResult.match && (
                              <div className="text-slate-500">
                                Matched with article: <b>{plagiarismResult.match.title}</b>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 p-3 rounded-lg">
                            <CheckCircle2 size={16} /> No plagiarism detected.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 2️⃣ Word Count Check */}
            <div className="p-5 border rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Word Count</label>
                {isWordCountValid ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-orange-400" />}
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">{wordCount || 0}</div>
              <p className="text-xs text-slate-500">Minimum required: 300 words</p>
            </div>

            {/* 3️⃣ Category Check */}
            <div className="p-5 border rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Category</label>
                {isCategoryValid ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-orange-400" />}
              </div>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Select Category</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4️⃣ SEO Fields Validation */}
          <div className="p-5 border rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm">SEO Metadata</h3>
              {isSeoValid ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Optimized</span> : <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Missing info</span>}
            </div>

            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-slate-800 outline-none focus:border-indigo-500"
                  placeholder="SEO Title"
                />
              </div>
              <div>
                <textarea
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-slate-800 outline-none focus:border-indigo-500 min-h-[80px]"
                  placeholder="Meta description (min 50 chars)"
                ></textarea>
                <div className="flex justify-end mt-1">
                  <span className={`text-[10px] ${seoDesc.length >= 50 ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {seoDesc.length} / 50+ chars
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5️⃣ Image Copyright Verification */}
          <label className="flex items-center gap-3 bg-white dark:bg-slate-900 border rounded-xl px-5 py-4 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors">
            <input
              type="checkbox"
              className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
              checked={imageVerified}
              onChange={(e) => setImageVerified(e.target.checked)}
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">I confirm all images used have proper licensing or are original.</span>
          </label>

          {/* 6️⃣ Actions */}
          <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              disabled={!allChecksPass}
              className={`flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all
                    ${allChecksPass
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                  : "bg-slate-300 cursor-not-allowed"
                }
                `}
            >
              <CheckCircle2 size={18} /> Approve & Publish
            </button>

            <button className="flex items-center gap-2 bg-white border border-rose-200 text-rose-600 px-6 py-3 rounded-xl font-medium hover:bg-rose-50 transition-colors">
              <XCircle size={18} /> Reject
            </button>
          </div>
        </>
      )}

      {!selectedArticleId && !loadingArticles && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300">
          <Search className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-500">Select an article to begin quality check</h3>
        </div>
      )}
    </main>
  );
}
