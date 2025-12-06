"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Send,
  Save,
  XCircle,
  Clock,
  UploadCloud,
  Upload,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

type UploadResult = {
  attachmentId: string;
  publicUrl?: string | null;
  sizeBytes?: number | null;
  mimeType?: string | null;
};

type Category = {
  id: string;
  name: string;
  description?: string;
};

type PlagiarismSummaryPair = {
  a: string;
  b: string;
  similarity: number;
};

type PlagiarismSummary = {
  max_similarity?: number;
  avg_similarity?: number;
  pairs?: PlagiarismSummaryPair[];
  notice?: string;
  files?: string[];
};

type SimilarityPair = {
  aId: string;
  bId: string;
  score: number;
};

type SimilarityDoc = {
  id: string;
  filename: string;
  textExcerpt: string;
};

// -------------------------
// API base normalization
// -------------------------
// Accepts NEXT_PUBLIC_API_BASE = "http://localhost:5000" or "http://localhost:5000/api"
// Produces API_BASE that we use with route names like "/article/author/articles"
const rawApi = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");
const API_BASE = rawApi.endsWith("/api") ? rawApi.replace(/\/api$/, "") : rawApi;
// final root for requests including the /api prefix on every call:
const API_ROOT = `${API_BASE}/api`.replace(/\/+$/, ""); // e.g. http://localhost:5000/api

export default function SubmitArticlePage() {
  const router = useRouter();

  // Article form state
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category_id, setCategory_id] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [issue_id, setIssue_id] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [articleId, setArticleId] = useState<string | null>(null);

  // Plagiarism UI state (JPlag)
  const [plagiarismLoading, setPlagiarismLoading] = useState(false);
  const [plagiarismStatus, setPlagiarismStatus] = useState<string | null>(null);
  const [plagiarismSummary, setPlagiarismSummary] = useState<PlagiarismSummary | null>(null);
  const [plagiarismReportUrl, setPlagiarismReportUrl] = useState<string | null>(null);
  const [plagLanguage, setPlagLanguage] = useState<string>("python3");

  // Similarity check UI state (TF-IDF)
  const [similarityLoading, setSimilarityLoading] = useState(false);
  const [similarityStatus, setSimilarityStatus] = useState<string | null>(null);
  const [similarityPairs, setSimilarityPairs] = useState<SimilarityPair[]>([]);
  const [similarityDocs, setSimilarityDocs] = useState<SimilarityDoc[]>([]);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.6);
  const [similarityTopN, setSimilarityTopN] = useState<number>(20);

  // authorization bits (client-side minimal)
  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthorizedToRun, setIsAuthorizedToRun] = useState<boolean>(false);
  const privilegedRoles = ["admin", "content_manager", "editor"];

  // Controls & modals
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [similarityModalOpen, setSimilarityModalOpen] = useState(false);
  // we hold the last run similarity 'top score' to decide if we must block auto submission
  const [lastTopSimilarity, setLastTopSimilarity] = useState<number | null>(null);
  // If true, user explicitly confirmed to proceed despite high similarity
  const [forceSubmitDespiteSimilarity, setForceSubmitDespiteSimilarity] = useState(false);

  const strip = (t: string) => t.replace(/<[^>]+>/g, "");
  const words = strip(content).split(/\s+/).filter(Boolean).length;
  const chars = strip(content).length;
  const mins = Math.ceil(words / 200);

  function parseJwt(token: string | null) {
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserRole(localStorage.getItem("role") || "");
      setUserId(localStorage.getItem("userId") || null);
      setIsAuthorizedToRun(privilegedRoles.includes(localStorage.getItem("role") || ""));
      return;
    }
    const payload = parseJwt(token);
    if (payload) {
      setUserRole((payload.role as string) || (localStorage.getItem("role") || ""));
      setUserId((payload.userId as string) || (payload.sub as string) || (localStorage.getItem("userId") || null));
      setIsAuthorizedToRun(privilegedRoles.includes((payload.role as string) || ""));
    } else {
      setUserRole(localStorage.getItem("role") || "");
      setUserId(localStorage.getItem("userId") || null);
      setIsAuthorizedToRun(privilegedRoles.includes(localStorage.getItem("role") || ""));
    }
  }, []);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  /**
   * Safe getToken(): checks several keys that your app uses in different places.
   * Returns null if none found.
   */
  const getToken = () => {
    try {
      if (typeof window === "undefined") return null;
      // check common keys you used in different pages
      const k1 = localStorage.getItem("ACCESS_TOKEN");
      if (k1 && k1.trim()) return k1.trim();
      const k2 = localStorage.getItem("token");
      if (k2 && k2.trim()) return k2.trim();
      const k3 = localStorage.getItem("idToken");
      if (k3 && k3.trim()) return k3.trim();
      return null;
    } catch (err) {
      console.warn("getToken error", err);
      return null;
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_ROOT}/article/categories`, {
        headers,
      });
      if (!res.ok) {
        setStatusMsg("⚠️ Could not load categories");
        setIsLoadingCategories(false);
        return;
      }
      const data = await res.json();
      setCategories(data.data?.categories || data.categories || []);
      setStatusMsg("Categories loaded");
    } catch (err) {
      console.error("Error fetching categories:", err);
      setStatusMsg("⚠️ Error loading categories");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Auto restore draft
  useEffect(() => {
    const saved = localStorage.getItem("draft");
    if (saved) {
      try {
        const d = JSON.parse(saved);
        setTitle(d.title || "");
        setSummary(d.summary || "");
        setContent(d.content || "");
        setCategory_id(d.category_id || "");
        setTags(d.tags || []);
        setIssue_id(d.issue_id || "");
        setStatusMsg("✅ Draft Loaded");
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Auto Save to localStorage
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        localStorage.setItem(
          "draft",
          JSON.stringify({
            title,
            summary,
            content,
            category_id,
            tags,
            issue_id,
          })
        );
        setStatusMsg("Draft autosaved...");
      } catch {
        // ignore storage errors
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [title, summary, content, category_id, tags, issue_id]);

  // Helper API calls

  // Create article (we will create as draft first, then finalize)
  const createArticleOnServer = async (payload: any) => {
    const token = getToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_ROOT}/article/author/articles`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const body = await (async () => {
      try {
        return await res.json();
      } catch {
        return null;
      }
    })();
    if (!res.ok) {
      const errorMsg = body?.errors
        ? `Validation failed: ${JSON.stringify(body.errors)}`
        : body?.message || `Failed to create article (${res.status})`;
      const err: any = new Error(errorMsg);
      err.res = res;
      err.body = body;
      throw err;
    }
    return body;
  };

  // Upload one file to server attachments endpoint
  const uploadFileToServer = async (file: File, articleIdParam: string) => {
    const form = new FormData();
    form.append("file", file);
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_ROOT}/article/author/articles/${encodeURIComponent(articleIdParam)}/attachments`, {
      method: "POST",
      headers,
      body: form,
    });

    let body: any = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }

    if (!res.ok) {
      throw new Error(body?.message || `Upload failed for ${file.name} (${res.status})`);
    }
    return body?.data || body;
  };

  // Finalize (patch status to submitted)
  const finalizeSubmission = async (articleIdParam: string) => {
    const token = getToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_ROOT}/article/author/articles/${encodeURIComponent(articleIdParam)}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "submitted" }),
    });
    if (!res.ok) {
      const body = await (async () => {
        try {
          return await res.json();
        } catch {
          return null;
        }
      })();
      throw new Error(body?.message || "Failed to update status");
    }
    return true;
  };

  // Run similarity check
  // NOTE: backend route: POST /author/articles/:articleId/similarity (mounted under /article)
  const runSimilarityCheck = async (articleIdParam?: string) => {
    const aid = articleIdParam || articleId;
    if (!aid) throw new Error("missing-article-id");

    setSimilarityLoading(true);
    setSimilarityStatus("Starting similarity check...");
    setSimilarityPairs([]);
    setSimilarityDocs([]);

    try {
      const params = new URLSearchParams();
      if (typeof similarityThreshold !== "undefined") params.append("threshold", String(similarityThreshold));
      if (typeof similarityTopN !== "undefined") params.append("top", String(similarityTopN));

      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_ROOT}/article/author/articles/${encodeURIComponent(aid)}/similarity?${params.toString()}`, {
        method: "POST",
        headers,
      });

      const body = await (async () => {
        try {
          return await res.json();
        } catch {
          return null;
        }
      })();

      if (!res.ok) {
        if (res.status === 404) throw new Error("Similarity check endpoint not available. Contact administrator.");
        throw new Error(body?.message || `Similarity check failed (${res.status})`);
      }

      const data = body?.data || { docs: [], pairs: [] };
      setSimilarityDocs(data.docs || []);
      setSimilarityPairs(data.pairs || []);
      setSimilarityStatus("Completed");

      // compute top score
      const top = (data.pairs || []).reduce((m: number, p: any) => Math.max(m, Number(p.score || 0)), 0);
      setLastTopSimilarity(top || 0);

      setSimilarityLoading(false);
      return { docs: data.docs || [], pairs: data.pairs || [], top };
    } catch (err: any) {
      console.error("runSimilarityCheck error:", err);
      setSimilarityStatus("❌ " + (err.message || "Failed"));
      setSimilarityLoading(false);
      throw err;
    }
  };

  // Plagiarism (JPlag) call (kept as your previous UI)
  const runPlagiarismCheck = async () => {
    if (!articleId) {
      setPlagiarismStatus("Please create or select an article first");
      return;
    }
    if (!isAuthorizedToRun) {
      setPlagiarismStatus("You are not authorized to run a plagiarism check for this article.");
      return;
    }

    setPlagiarismLoading(true);
    setPlagiarismStatus("Starting plagiarism check...");
    setPlagiarismSummary(null);
    setPlagiarismReportUrl(null);

    try {
      const token = getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_ROOT}/article/articles/${encodeURIComponent(articleId)}/plagiarism`, {
        method: "POST",
        headers,
        body: JSON.stringify({ language: plagLanguage }),
      });

      const body = await (async () => {
        try {
          return await res.json();
        } catch {
          return null;
        }
      })();

      if (!res.ok) {
        const msg = body?.message || `Plagiarism check failed (${res.status})`;
        throw new Error(msg);
      }

      const data = body?.data;
      setPlagiarismStatus("Completed");
      setPlagiarismReportUrl(data?.reportUrl || data?.report_url || null);
      setPlagiarismSummary(data?.summary || data?.similarity_summary || null);
    } catch (err: any) {
      console.error("Plagiarism check error:", err);
      setPlagiarismStatus("❌ " + (err.message || "Failed"));
    } finally {
      setPlagiarismLoading(false);
    }
  };

  // UI helpers
  const escapeHtml = (unsafe: string) =>
    unsafe
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const saveDraft = async () => {
    setStatusMsg("Saving draft...");
    try {
      const payload = {
        title,
        summary: summary || "",
        content: content || "",
        category_id: category_id || null,
        tags: tags || [],
        status: "draft",
        issue_id: issue_id || null,
      };

      const body = await createArticleOnServer(payload);
      const newArticleId = body?.data?.id || body?.id;
      if (!newArticleId) throw new Error("Article ID not returned by server");
      setArticleId(newArticleId);
      setStatusMsg("✅ Draft saved to server");
      localStorage.removeItem("draft");
    } catch (err: any) {
      console.error("Save draft error:", err);
      setStatusMsg("❌ Failed to save draft: " + (err.message || ""));
    }
  };

  // SUBMIT FLOW:
  // 1) create article with status 'draft' (if not present)
  // 2) upload attachments (if any)
  // 3) run similarity check
  // 4) show similarity modal with results
  // 5) if user confirms (and/or similarity below threshold), call finalizeSubmission (PATCH status)
  const submit = async () => {
    if (!title.trim()) {
      setStatusMsg("Title is required");
      return;
    }

    setIsSubmitting(true);
    setStatusMsg("Creating article...");

    try {
      // Step 1: create article as draft if not already created
      let newArticleId = articleId;
      if (!newArticleId) {
        const payload: any = {
          title: title.trim(),
          summary: summary.trim() || "",
          content: content || "",
          tags: tags || [],
          status: "draft",
        };
        if (category_id && category_id.trim()) payload.category_id = category_id.trim();
        if (issue_id && issue_id.trim()) payload.issue_id = issue_id.trim();

        const createBody = await createArticleOnServer(payload);
        newArticleId = createBody?.data?.id || createBody?.id;
        if (!newArticleId) throw new Error("Article ID not returned by server");
        setArticleId(newArticleId);
        setStatusMsg("Article created (draft)");
      }

      // Step 2: upload attachments if any
      if (attachments.length > 0) {
        setStatusMsg("Uploading attachments...");
        const uploadResults: UploadResult[] = [];
        for (const file of attachments) {
          setStatusMsg(`Uploading ${file.name}...`);
          const res = await uploadFileToServer(file, newArticleId);
          uploadResults.push({
            attachmentId: res?.attachmentId || res?._id || res?.id,
            publicUrl: res?.publicUrl ?? null,
            sizeBytes: res?.size ?? res?.size_bytes ?? null,
            mimeType: res?.mime_type ?? res?.mimeType ?? null,
          });
        }
        setStatusMsg("Attachments uploaded");
      }

      // Step 3: run similarity check
      setStatusMsg("Running similarity check...");
      let similarityResult;
      try {
        similarityResult = await runSimilarityCheck(newArticleId);
      } catch (err: any) {
        // If similarity endpoint missing or not authorized, we stop and show error
        setStatusMsg("❌ Similarity check failed: " + (err.message || ""));
        setIsSubmitting(false);
        return;
      }

      // Step 4: show similarity report modal
      setSimilarityModalOpen(true);

      // Auto-decide:
      const topScore = similarityResult?.top || 0;
      setLastTopSimilarity(topScore);

      // If topScore >= similarityThreshold (strictness for blocking), we require explicit confirmation
      if (topScore >= similarityThreshold && !forceSubmitDespiteSimilarity) {
        // open confirm modal (user must accept)
        setConfirmModalOpen(true);
        setStatusMsg(`Similarity top score is ${(topScore * 100).toFixed(1)}% — confirm to submit`);
        setIsSubmitting(false);
        return;
      }

      // Else finalize automatically (similarity acceptable)
      setStatusMsg("Similarity acceptable — finalizing submission...");
      await finalizeSubmission(newArticleId);
      setStatusMsg("Article submitted");
      localStorage.removeItem("draft");
      router.push("/author-dashboard/articles");
    } catch (err: any) {
      console.error("Submit error:", err);
      setStatusMsg("❌ Submission failed: " + (err.message || ""));
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Called when user confirms in the modal despite high similarity
  const confirmAndSubmit = async () => {
    if (!articleId) {
      setStatusMsg("Missing article id");
      return;
    }
    setConfirmModalOpen(false);
    setForceSubmitDespiteSimilarity(true);
    setIsSubmitting(true);
    setStatusMsg("Finalizing after confirmation...");

    try {
      await finalizeSubmission(articleId);
      setStatusMsg("Article submitted");
      localStorage.removeItem("draft");
      router.push("/author-dashboard/articles");
    } catch (err: any) {
      setStatusMsg("❌ Finalize failed: " + (err.message || ""));
      setIsSubmitting(false);
    }
  };

  // Similarity modal helpers
  const closeSimilarityModal = () => {
    setSimilarityModalOpen(false);
  };

  // Tag helpers
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setTagInput("");
  };
  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  // Attachment handlers
  const attachUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };
  const removeAttachment = (name: string) => {
    setAttachments((files) => files.filter((f) => f.name !== name));
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setAttachments((prev) => [...prev, ...droppedFiles]);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  // Simple preview
  const preview = () => {
    const w = window.open();
    w?.document.write(`<h1>${escapeHtml(title)}</h1><p>${escapeHtml(summary)}</p><div>${content}</div>`);
  };

  // Small UI: button to re-run similarity for existing article
  const reRunSimilarity = async () => {
    if (!articleId) {
      setSimilarityStatus("Create an article first");
      return;
    }
    try {
      await runSimilarityCheck(articleId);
      setSimilarityModalOpen(true);
    } catch (err) {
      // error message already set in runSimilarityCheck
    }
  };

  // Render
  return (
    <div className="p-4">
      {/* HEADER ROW */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Write Article</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and submit your article for publication</p>
          {statusMsg && <p className="text-xs mt-1 text-indigo-600">{statusMsg}</p>}
          {articleId && (
            <p className="text-xs mt-1 text-green-600">
              Article ID: <span className="font-mono">{articleId}</span>
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={saveDraft} className="flex items-center gap-1" disabled={isSubmitting}>
            <Save size={14} /> Save Draft
          </Button>

          <Button variant="outline" onClick={preview} className="flex items-center gap-1" disabled={isSubmitting}>
            <Eye size={14} /> Preview
          </Button>

          <Button
            onClick={submit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1"
            disabled={isSubmitting}
          >
            <Send size={14} /> {isSubmitting ? "Submitting..." : "Submit for Review"}
          </Button>
        </div>
      </div>

      {/* 2–COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT (Main Editor) */}
        <div className="lg:col-span-2 space-y-5">
          {/* CONTENT CARD */}
          <Card className="p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-3">Article Content</h3>

            <label className="text-sm font-medium">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title"
              className="w-full mt-1 mb-4 border bg-slate-100 dark:bg-slate-900 text-sm p-3 rounded-xl"
              disabled={isSubmitting}
            />

            <label className="text-sm font-medium">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={300}
              placeholder="Write short summary (optional)..."
              className="w-full mt-1 border bg-slate-100 dark:bg-slate-900 text-sm p-3 rounded-xl h-28"
              disabled={isSubmitting}
            />

            <p className="text-[10px] text-slate-500 text-right mt-1 mb-4">{summary.length}/300 characters</p>

            {/* TOOLBAR */}
            <div className="flex items-center justify-between border rounded-xl bg-white dark:bg-slate-900 p-2 mt-2 mb-3">
              <div className="flex items-center gap-3 pl-2 text-sm">
                <button onClick={() => document.execCommand("bold")} disabled={isSubmitting}>
                  <b>B</b>
                </button>
                <button onClick={() => document.execCommand("italic")} disabled={isSubmitting}>
                  <i>I</i>
                </button>
                <button onClick={() => document.execCommand("underline")} disabled={isSubmitting}>
                  <u>U</u>
                </button>
                <button onClick={() => document.execCommand("insertUnorderedList")} disabled={isSubmitting}>
                  •
                </button>
                <button onClick={() => document.execCommand("insertOrderedList")} disabled={isSubmitting}>
                  ≡
                </button>
                <button
                  onClick={() => {
                    const url = prompt("Enter URL");
                    if (url) document.execCommand("createLink", false, url);
                  }}
                  disabled={isSubmitting}
                >
                  🔗
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = prompt("Paste Image URL");
                    if (url) document.execCommand("insertImage", false, url);
                  }}
                  className="h-7 text-xs px-3 flex items-center gap-1"
                  disabled={isSubmitting}
                >
                  🖼 Image
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById("fileInput") as HTMLInputElement;
                    input?.click();
                  }}
                  className="h-7 text-xs px-3 flex items-center gap-1"
                  disabled={isSubmitting}
                >
                  <Upload size={12} /> Upload
                </Button>
              </div>
            </div>

            {/* EDITOR */}
            <div
              contentEditable={!isSubmitting}
              onInput={(e) => setContent(e.currentTarget.innerHTML)}
              className="w-full min-h-[250px] border bg-white dark:bg-slate-900 text-sm p-3 rounded-xl"
              suppressContentEditableWarning
            />
          </Card>

          {/* ATTACHMENTS CARD */}
          <Card className="p-5 rounded-2xl border shadow-sm">
            <h3 className="text-base font-semibold mb-2 flex items-center gap-2 justify-center">
              <UploadCloud size={18} /> Upload Attachments
            </h3>

            <input id="fileInput" type="file" multiple onChange={attachUpload} className="hidden" disabled={isSubmitting} />

            <div
              onClick={() => !isSubmitting && (document.getElementById("fileInput") as HTMLInputElement).click()}
              onDrop={!isSubmitting ? handleDrop : undefined}
              onDragOver={!isSubmitting ? handleDragOver : undefined}
              onDragLeave={handleDragLeave}
              onDragEnter={!isSubmitting ? handleDragOver : undefined}
              className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 mt-2 ${
                !isSubmitting ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
            >
              <UploadCloud size={28} />
              <p className="text-xs text-slate-500 mt-2 text-center">{isDragging ? "Drop files to upload" : "Drag and drop files here or click"}</p>
            </div>

            <div className="mt-3 space-y-2 max-h-40 overflow-auto">
              {attachments.map((file) => (
                <div key={file.name} className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 text-xs p-2 rounded-xl">
                  <span className="truncate max-w-[85%]">{file.name}</span>
                  <button onClick={() => !isSubmitting && removeAttachment(file.name)} className={`${isSubmitting ? "text-gray-400 cursor-not-allowed" : "text-red-600"}`} disabled={isSubmitting}>
                    <XCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-5">
          {/* DETAILS */}
          <Card className="p-5 rounded-2xl border shadow-sm">
            <h3 className="text-base font-semibold mb-3">Article Details</h3>

            <label className="text-xs font-medium mb-1 block">Category</label>
            <div className="relative mb-3">
              <select
                value={category_id}
                onChange={(e) => setCategory_id(e.target.value)}
                className="w-full border bg-slate-100 dark:bg-slate-900 text-xs p-2 rounded-lg appearance-none pr-8"
                disabled={isSubmitting || isLoadingCategories}
              >
                <option value="">Select a category (optional)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
              {isLoadingCategories && <p className="text-[10px] text-slate-500 mt-1">Loading categories...</p>}
            </div>

            <label className="text-xs font-medium">Tags</label>
            <div className="flex">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                className="flex-1 border bg-slate-100 dark:bg-slate-900 text-xs p-2 rounded-l-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSubmitting) {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={isSubmitting}
              />
              <button onClick={addTag} className={`bg-indigo-600 text-white text-xs px-3 rounded-r-lg ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`} disabled={isSubmitting}>
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mt-2 mb-3">
              {tags.map((tag) => (
                <span key={tag} className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                  {tag}
                  {!isSubmitting && (
                    <XCircle size={10} className="cursor-pointer" onClick={() => removeTag(tag)} />
                  )}
                </span>
              ))}
            </div>

            <label className="text-xs font-medium">Assign to Issue ID (Optional)</label>
            <input value={issue_id} onChange={(e) => setIssue_id(e.target.value)} placeholder="Enter issue ID if applicable" className="w-full border bg-slate-100 dark:bg-slate-900 text-xs p-2 rounded-lg" disabled={isSubmitting} />
          </Card>

          {/* Similarity Card */}
          <Card className="p-5 rounded-2xl border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Similarity Check (TF-IDF)</h3>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded">{similarityStatus || "idle"}</span>
            </div>

            <p className="text-xs mb-2 text-slate-500">Quick similarity check between attachments using TF-IDF.</p>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <label className="text-xs w-20">Threshold:</label>
                <input type="number" min="0" max="1" step="0.05" value={similarityThreshold} onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setSimilarityThreshold(isNaN(v) ? 0 : Math.max(0, Math.min(1, v)));
                }} className="flex-1 border text-xs p-1 rounded" disabled={similarityLoading} />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs w-20">Top N:</label>
                <input type="number" min="1" max="200" value={similarityTopN} onChange={(e) => {
                  const v = parseInt(e.target.value || "20", 10);
                  setSimilarityTopN(isNaN(v) ? 20 : Math.max(1, Math.min(200, v)));
                }} className="flex-1 border text-xs p-1 rounded" disabled={similarityLoading} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => reRunSimilarity()} disabled={similarityLoading || !articleId} variant="outline" className={`${similarityLoading || !articleId ? "opacity-60 cursor-not-allowed" : ""} flex-1`}>
                {similarityLoading ? "Running..." : "Run Similarity Check"}
              </Button>
            </div>

            <div className="mt-2 text-[11px] text-slate-500">
              <AlertCircle className="inline mr-1" size={12} />
              The similarity check compares text in attachments using a TF-IDF method.
            </div>

            {similarityPairs.length > 0 && (
              <div className="mt-3 text-xs">
                <p className="font-medium">Top similarity pairs</p>
                <ul className="list-disc pl-4">
                  {similarityPairs.slice(0, 10).map((p, i) => (
                    <li key={i}>
                      {p.aId} ↔ {p.bId} — {p.score}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {similarityDocs.length > 0 && (
              <div className="mt-3 text-xs">
                <p className="font-medium">Documents</p>
                <ul className="list-disc pl-4">
                  {similarityDocs.slice(0, 10).map((d) => (
                    <li key={d.id}>
                      {d.filename} — {d.textExcerpt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Plagiarism Card */}
          <Card className="p-5 rounded-2xl border">
            <h3 className="text-sm font-semibold mb-2 text-center">Plagiarism Check (JPlag)</h3>
            <p className="text-xs mb-2">Run JPlag plagiarism check on attachments (requires Docker).</p>

            <div className="flex gap-2 items-center mb-3">
              <label className="text-xs mr-2">Language</label>
              <select value={plagLanguage} onChange={(e) => setPlagLanguage(e.target.value)} className="border bg-white text-xs p-1 rounded" disabled={plagiarismLoading}>
                <option value="python3">Python 3</option>
                <option value="java">Java</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={runPlagiarismCheck} disabled={plagiarismLoading || !isAuthorizedToRun || !articleId} className={`flex-1 ${plagiarismLoading ? "opacity-60 cursor-not-allowed" : ""}`}>
                {plagiarismLoading ? "Running..." : "Run Plagiarism Check"}
              </Button>
            </div>

            {!isAuthorizedToRun && articleId && (
              <div className="text-[11px] text-slate-500 mt-2">
                <AlertCircle className="inline mr-1" size={12} />
                {privilegedRoles.includes(userRole) ? "Preparing..." : userRole === "author" ? "You can run plagiarism checks on your own articles." : "Only admins/editors/content managers/authors can run checks."}
              </div>
            )}

            {plagiarismStatus && <p className="text-xs mt-3">{plagiarismStatus}</p>}

            {plagiarismReportUrl && (
              <div className="mt-3 text-xs">
                <a href={plagiarismReportUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                  Download JPlag Report
                </a>
              </div>
            )}

            {plagiarismSummary && (
              <div className="mt-3 text-xs">
                <p><b>Max similarity:</b> {String(plagiarismSummary.max_similarity ?? "N/A")}</p>
                <p><b>Avg similarity:</b> {String(plagiarismSummary.avg_similarity ?? "N/A")}</p>
                {plagiarismSummary.pairs && plagiarismSummary.pairs.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Top pairs</p>
                    <ul className="list-disc pl-4">
                      {plagiarismSummary.pairs.slice(0, 5).map((p, i) => (
                        <li key={i}>
                          {p.a} ↔ {p.b} — {p.similarity}%
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {plagiarismSummary.notice && <p className="mt-2 text-xs text-slate-500">{plagiarismSummary.notice}</p>}
              </div>
            )}
          </Card>

          {/* Tips */}
          <Card className="p-5 rounded-2xl border">
            <h3 className="text-sm font-semibold mb-2 text-center">Writing Tips</h3>
            <ul className="text-[11px] space-y-1 list-disc pl-4 text-slate-700 dark:text-slate-300">
              <li>Keep your title engaging</li>
              <li>Aim for 800–2000 words</li>
              <li>Use subheadings</li>
              <li>Add relevant images</li>
              <li>Proofread before submitting</li>
            </ul>
          </Card>

          {/* Stats */}
          <Card className="p-5 rounded-2xl border text-center">
            <h3 className="text-sm font-semibold mb-2 flex items-center justify-center gap-1">
              <Clock size={14} /> Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><b>{words}</b> Words</div>
              <div><b>{chars}</b> Characters</div>
              <div><b>{mins}</b> Min Read</div>
              <div><b>{tags.length}</b> Tags</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Similarity Modal */}
      {similarityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-3xl overflow-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Similarity Report</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setSimilarityModalOpen(false); }}><XCircle size={14} /></Button>
              </div>
            </div>

            <div className="mb-3 text-sm text-slate-700 dark:text-slate-300">
              <p><b>Top similarity score:</b> {(lastTopSimilarity ?? 0).toFixed(4)}</p>
              <p className="text-xs text-slate-500">Pairs with score {">="} {similarityThreshold} are highlighted below.</p>
            </div>

            <div className="grid gap-4">
              <div>
                <p className="font-medium">Top pairs</p>
                <ul className="list-disc pl-4 text-xs max-h-40 overflow-auto">
                  {similarityPairs.length === 0 && <li>No pairs found</li>}
                  {similarityPairs.map((p, i) => (
                    <li key={i}>
                      {p.aId} ↔ {p.bId} — <b>{p.score}</b>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-medium">Documents</p>
                <ul className="list-disc pl-4 text-xs max-h-40 overflow-auto">
                  {similarityDocs.length === 0 && <li>No documents found</li>}
                  {similarityDocs.map((d) => (
                    <li key={d.id}>
                      <b>{d.filename}</b> — {d.textExcerpt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSimilarityModalOpen(false)}>Close</Button>
              <Button
                onClick={() => {
                  // If similarity top >= threshold, require confirmation modal
                  if ((lastTopSimilarity || 0) >= similarityThreshold) {
                    setConfirmModalOpen(true);
                  } else {
                    // similarity acceptable, finalize
                    if (articleId) {
                      setIsSubmitting(true);
                      finalizeSubmission(articleId)
                        .then(() => {
                          localStorage.removeItem("draft");
                          router.push("/author-dashboard/articles");
                        })
                        .catch((e) => setStatusMsg("❌ Finalize failed: " + (e.message || "")))
                        .finally(() => setIsSubmitting(false));
                    } else {
                      setStatusMsg("Missing article ID");
                    }
                  }
                }}
                className="bg-indigo-600 text-white"
              >
                {((lastTopSimilarity || 0) >= similarityThreshold) ? "Confirm & Submit (requires confirmation)" : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal (when similarity high) */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">High similarity detected</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
              The similarity check reported a top score of {(lastTopSimilarity ?? 0).toFixed(4)} which is above your threshold ({similarityThreshold}). Submitting this article may indicate copied content. Are you sure you want to proceed?
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
              <Button
                className="bg-red-600 text-white"
                onClick={async () => {
                  setConfirmModalOpen(false);
                  await confirmAndSubmit();
                }}
              >
                Yes — submit anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
