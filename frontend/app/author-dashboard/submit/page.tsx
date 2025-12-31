"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  Languages,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SUPPORTED_LANGUAGES } from "@/constants/languages";

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
  ai_score?: number;
  ai_details?: string[];
  web_score?: number;
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

function SubmitArticleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryArticleId = searchParams.get("articleId");

  // Article form state
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("en");
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

  // Partner Event & Visibility support
  const [event_id, setEvent_id] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [visibility, setVisibility] = useState("public");
  // Co-authors support (comma separated string)
  const [co_authors, setCoAuthors] = useState("");

  // Plagiarism UI state (JPlag)
  const [plagiarismLoading, setPlagiarismLoading] = useState(false);
  const [plagiarismStatus, setPlagiarismStatus] = useState<string | null>(null);
  const [plagiarismSummary, setPlagiarismSummary] = useState<PlagiarismSummary | null>(null);
  const [plagiarismReportUrl, setPlagiarismReportUrl] = useState<string | null>(null);
  const [plagLanguage, setPlagLanguage] = useState<string>("text");

  // Authorship Liability Agreement
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  // University Liability Agreement (Partner)
  const [universityAgreementFile, setUniversityAgreementFile] = useState<File | null>(null);

  // Similarity check UI state (TF-IDF)
  const [similarityLoading, setSimilarityLoading] = useState(false);
  const [similarityStatus, setSimilarityStatus] = useState<string | null>(null);
  const [similarityPairs, setSimilarityPairs] = useState<SimilarityPair[]>([]);
  const [similarityDocs, setSimilarityDocs] = useState<SimilarityDoc[]>([]);
  const [webResults, setWebResults] = useState<string[]>([]);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.6);
  const [similarityTopN, setSimilarityTopN] = useState<number>(20);

  // authorization bits (client-side minimal)
  const [userRole, setUserRole] = useState<string>("");
  const isPartner = (userRole && userRole.toLowerCase() === "partner") || pathname?.includes("/partner-dashboard");
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthorizedToRun, setIsAuthorizedToRun] = useState<boolean>(false);
  const privilegedRoles = ["admin", "content_manager", "editor", "author", "partner"];

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
    console.log("SubmitPage Auth Check - Token:", !!token);

    // Helper to get role from multiple sources
    const getRole = () => {
      let r = localStorage.getItem("role");
      if (!r) {
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const userObj = JSON.parse(userStr);
            r = userObj.role;
          }
        } catch (e) { console.error("Error parsing user from storage", e); }
      }
      return r || "";
    };

    if (!token) {
      const r = getRole();
      console.log("SubmitPage Role (No Token):", r);
      setUserRole(r);
      setUserId(localStorage.getItem("userId") || null);

      const isAuth = privilegedRoles.includes(r.toLowerCase());
      console.log("Authorized (No Token)?", isAuth);
      setIsAuthorizedToRun(isAuth);
      return;
    }

    const payload = parseJwt(token);
    if (payload) {
      const role = (payload.role as string) || getRole();
      console.log("SubmitPage Role (JWT):", role);
      setUserRole(role);
      setUserId((payload.userId as string) || (payload.sub as string) || (localStorage.getItem("userId") || null));
      const isAuth = privilegedRoles.includes(role.toLowerCase());
      console.log("Authorized (JWT)?", isAuth);
      setIsAuthorizedToRun(isAuth);
    } else {
      const role = getRole();
      console.log("SubmitPage Role (Bad JWT):", role);
      setUserRole(role);
      setUserId(localStorage.getItem("userId") || null);
      const isAuth = privilegedRoles.includes(role.toLowerCase());
      console.log("Authorized (Bad JWT)?", isAuth);
      setIsAuthorizedToRun(isAuth);
    }
  }, []);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
    fetchEvents();
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

  const fetchEvents = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_ROOT}/partner/events`, { headers });
      if (res.ok) {
        const json = await res.json();
        setEvents(json.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch events", e);
    }
  };

  // Fetch article content if editing
  useEffect(() => {
    if (queryArticleId) {
      setArticleId(queryArticleId);
      // Fetch details
      const fetchDetails = async () => {
        try {
          const token = getToken();
          const res = await fetch(`${API_ROOT}/article/author/articles/${queryArticleId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (res.ok) {
            const json = await res.json();
            const art = json.data?.article;
            if (art) {
              setTitle(art.title || "");
              setSummary(art.summary || "");
              setContent(art.content || "");
              setLanguage(art.language || "en");
              setCategory_id(art.category_id || "");
              setEvent_id(art.event_id || "");
              setVisibility(art.visibility || "public");
              if (art.metadata) {
                try {
                  const meta = typeof art.metadata === 'string' ? JSON.parse(art.metadata) : art.metadata;
                  if (meta.tags) setTags(meta.tags);
                  if (meta.issue_id) setIssue_id(meta.issue_id);
                } catch (e) { /* ignore */ }
              }
              // Removed redundant catch
              // Parse co_authors
              let ca = art.co_authors;
              if (ca && Array.isArray(ca)) {
                setCoAuthors(ca.join(", "));
              } else if (typeof ca === 'string') {
                setCoAuthors(ca); // fallback
              }
            } else if (art.tags) {
              // Fallback if tags stored in separate column and not metadata (depends on backend)
              // Controller stores tags in metadata AND separate column often.
              // Try parsing separate column if it's a string
              try {
                setTags(typeof art.tags === 'string' ? JSON.parse(art.tags) : art.tags);
              } catch { /* */ }
            }
            setStatusMsg("Loaded article for editing");
          }
        } catch (err) {
          console.error("Failed to fetch article details", err);
        }
      };
      fetchDetails();
    } else {
      // Only load draft if NOT editing (or if editing overrides draft?)
      // Let's say if queryArticleId is absent, we check local storage.
      const saved = localStorage.getItem("draft");
      if (saved) {
        try {
          const d = JSON.parse(saved);
          setTitle(d.title || "");
          setSummary(d.summary || "");
          setContent(d.content || "");
          setCategory_id(d.category_id || "");
          setEvent_id(d.event_id || "");
          setVisibility(d.visibility || "public");
          setTags(d.tags || []);
          setIssue_id(d.issue_id || "");
          setStatusMsg("✅ Draft Loaded");
        } catch {
          // ignore parse errors
        }
      }
    }
  }, [queryArticleId]);

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
            language,
            category_id,
            event_id,
            visibility,
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
  }, [title, summary, content, category_id, tags, issue_id, event_id, visibility]);

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

  // Update article content
  const updateArticleOnServer = async (id: string, payload: any) => {
    const token = getToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_ROOT}/article/author/articles/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || "Failed to update article");
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

      const data = body?.data || { docs: [], pairs: [], web_results: [] };
      setSimilarityDocs(data.docs || []);

      // Map backend {a, b, similarity} to frontend {aId, bId, score}
      const mappedPairs = (data.pairs || []).map((p: any) => ({
        aId: p.a,
        bId: p.b,
        score: p.similarity || 0
      }));
      setSimilarityPairs(mappedPairs);
      setWebResults(data.web_results || []);
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
        event_id: event_id || null,
        visibility: visibility || "public",
        tags: tags || [],
        issue_id: issue_id || null,
        // Don't force 'draft' status if updating existing article, unless we want to?
        // Usually draft save keeps it as draft.
        // If articleId exists, use update.
      };

      if (articleId) {
        await updateArticleOnServer(articleId, payload);
        setStatusMsg("✅ Draft updated on server");
      } else {
        // Create new
        (payload as any).status = "draft";
        const body = await createArticleOnServer(payload);
        const newArticleId = body?.data?.id || body?.id;
        if (!newArticleId) throw new Error("Article ID not returned by server");
        setArticleId(newArticleId);
        setStatusMsg("✅ Draft saved to server");
      }
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

    // Enforcement: Check for plagiarism report
    if (!plagiarismReportUrl && !plagiarismSummary) {
      setStatusMsg("⚠️ Plagiarism check required before submission");
      // Use a simple alert or toast if available, or just set status
      const el = document.getElementById("plagiarism-section");
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Enforcement: Check for Authorship Agreement
    if (!agreementFile) {
      setStatusMsg("⚠️ Authorship Liability Agreement is required");
      const el = document.getElementById("agreement-section");
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Enforcement: Check for University Agreement (Partner)
    if (isPartner && !universityAgreementFile) {
      setStatusMsg("⚠️ University Publication Authorization is required");
      const el = document.getElementById("university-agreement-section");
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg("Creating article...");

    try {
      // Step 1: create article if not exists, or update if exists
      let newArticleId = articleId;

      const payload: any = {
        title: title.trim(),
        summary: summary.trim() || "",
        content: content || "",
        language: language || "en",
        tags: tags || [],
        co_authors: co_authors ? co_authors.split(",").map(s => s.trim()).filter(Boolean) : []
      };
      if (category_id && category_id.trim()) payload.category_id = category_id.trim();
      if (event_id && event_id.trim()) payload.event_id = event_id.trim();
      if (visibility) payload.visibility = visibility;
      if (issue_id && issue_id.trim()) payload.issue_id = issue_id.trim();

      if (newArticleId) {
        // Update existing
        setStatusMsg("Updating article content...");
        await updateArticleOnServer(newArticleId, payload);
      } else {
        // Create new
        payload.status = "draft";
        const createBody = await createArticleOnServer(payload);
        newArticleId = createBody?.data?.id || createBody?.id;
        if (!newArticleId) throw new Error("Article ID not returned by server");
        setArticleId(newArticleId);
        setStatusMsg("Article created (draft)");
      }

      // Step 2: upload attachments if any
      const filesToUpload = [...attachments];
      if (agreementFile) {
        // We can treat it as an attachment, or specific type if backend supported.
        // For now, upload as regular attachment
        filesToUpload.push(agreementFile);
      }
      if (universityAgreementFile) {
        filesToUpload.push(universityAgreementFile);
      }

      if (filesToUpload.length > 0) {
        setStatusMsg("Uploading attachments...");
        const uploadResults: UploadResult[] = [];
        for (const file of filesToUpload) {
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
      if (isPartner) {
        router.push("/partner-dashboard/submissions");
      } else {
        router.push("/author-dashboard/articles"); // default
      }
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
      if (isPartner) {
        router.push("/partner-dashboard/submissions");
      } else {
        router.push("/author-dashboard/articles");
      }
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

            <label className="text-sm font-medium">Language</label>
            <div className="relative mb-4 mt-1">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full appearance-none border bg-slate-100 dark:bg-slate-900 text-sm p-3 rounded-xl pr-10"
                disabled={isSubmitting}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label} ({lang.name})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-slate-500">
                <ChevronDown size={16} />
              </div>
            </div>

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

          {/* AUTHORSHIP LIABILITY AGREEMENT CARD (Authors Only or Both? Usually Authors only require this specific one, Partners might need the Uni one. User said "make it similarly", implying Uni liability is for Partners. I will show Uni Liability for Partners INSTEAD of or WITH Authorship? I'll show BOTH if isPartner, or usually Partners act as authors too... let's assume Partners need the University one specifically. I'll add the University one below this card.) */}
          {/* ACTUALLY, usually if I am a Partner submitting, do I need the personal Authorship Liability? Maybe. But I DEFINITELY need the University one. I will show the University Card if isPartner. */}

          <Card id="agreement-section" className={`p-5 rounded-2xl border shadow-sm ${!agreementFile ? "border-amber-400 bg-amber-50/30" : "border-emerald-200 bg-emerald-50/30"}`}>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <ShieldAlert size={18} className={!agreementFile ? "text-amber-600" : "text-emerald-600"} />
              Authorship Liability Agreement
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              It is mandatory to download, sign, and upload the authorship liability agreement before submitting your article.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Download Button */}
              <a
                href="/authorship_liability_agreement.docx"
                download="Authorship_Liability_Agreement_Template.docx"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 whitespace-nowrap"
              >
                <Upload size={14} className="rotate-180" /> Download Template
              </a>

              <div className="text-xs text-slate-400 hidden sm:block">|</div>

              {/* Upload Section */}
              <div className="flex-1 w-full relative">
                {!agreementFile ? (
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".doc,.docx,.pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAgreementFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={isSubmitting}
                    />
                    <div className="border border-dashed border-slate-300 rounded-lg p-2 text-center text-xs text-slate-500 group-hover:bg-white group-hover:border-indigo-400 transition-colors">
                      Click to upload signed agreement
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white border border-emerald-200 p-2 rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="bg-emerald-100 p-1 rounded text-emerald-600">
                        <FileText size={14} />
                      </div>
                      <span className="text-xs truncate max-w-[150px] font-medium text-emerald-700">{agreementFile.name}</span>
                    </div>
                    <button
                      onClick={() => !isSubmitting && setAgreementFile(null)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      disabled={isSubmitting}
                      title="Remove agreement"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* UNIVERSITY LIABILITY AGREEMENT CARD (PARTNERS ONLY) */}
          {isPartner && (
            <Card id="university-agreement-section" className={`p-5 rounded-2xl border shadow-sm ${!universityAgreementFile ? "border-amber-400 bg-amber-50/30" : "border-emerald-200 bg-emerald-50/30"}`}>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <ShieldAlert size={18} className={!universityAgreementFile ? "text-amber-600" : "text-emerald-600"} />
                University Publication Authorization
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                As a partner, it is mandatory to download, sign, and upload the university publication authorization before submitting.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {/* Download Button */}
                <a
                  href="/University_Publication_Authorization_MindRadiX.pdf"
                  download="University_Publication_Authorization_MindRadiX.pdf"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 whitespace-nowrap"
                >
                  <Upload size={14} className="rotate-180" /> Download Authorization
                </a>

                <div className="text-xs text-slate-400 hidden sm:block">|</div>

                {/* Upload Section */}
                <div className="flex-1 w-full relative">
                  {!universityAgreementFile ? (
                    <div className="relative group">
                      <input
                        type="file"
                        accept=".doc,.docx,.pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUniversityAgreementFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isSubmitting}
                      />
                      <div className="border border-dashed border-slate-300 rounded-lg p-2 text-center text-xs text-slate-500 group-hover:bg-white group-hover:border-indigo-400 transition-colors">
                        Click to upload signed authorization
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-white border border-emerald-200 p-2 rounded-lg">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="bg-emerald-100 p-1 rounded text-emerald-600">
                          <FileText size={14} />
                        </div>
                        <span className="text-xs truncate max-w-[150px] font-medium text-emerald-700">{universityAgreementFile.name}</span>
                      </div>
                      <button
                        onClick={() => !isSubmitting && setUniversityAgreementFile(null)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        disabled={isSubmitting}
                        title="Remove authorization"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

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
              className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 mt-2 ${!isSubmitting ? "cursor-pointer" : "cursor-not-allowed opacity-50"
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
            <input value={issue_id} onChange={(e) => setIssue_id(e.target.value)} placeholder="Enter issue ID if applicable" className="w-full border bg-slate-100 dark:bg-slate-900 text-xs p-2 rounded-lg mb-3" disabled={isSubmitting} />

            <label className="text-xs font-medium block mb-1">Link to Event (Optional)</label>
            <div className="relative mb-3">
              <select
                value={event_id}
                onChange={(e) => setEvent_id(e.target.value)}
                className="w-full border bg-slate-100 dark:bg-slate-900 text-xs p-2 rounded-lg appearance-none pr-8"
                disabled={isSubmitting}
              >
                <option value="">No Event</option>
                {events.map((ev: any) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="public">Public (Community)</option>
                {isPartner && <option value="partner">Partner Only</option>}
                <option value="private">Private</option>
              </select>
            </div>

            {isPartner && (
              <div className="space-y-2">
                <Label>Co-Authors</Label>
                <Input
                  placeholder="Enter names separated by commas..."
                  value={co_authors}
                  onChange={(e) => setCoAuthors(e.target.value)}
                />
                <p className="text-[10px] text-slate-500">List other contributors (optional)</p>
              </div>
            )}
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





          {/* Plagiarism Card - Updated with AI & Enforcement */}
          <Card id="plagiarism-section" className={`p-5 rounded-2xl border ${!plagiarismReportUrl ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200'}`}>
            <h3 className="text-sm font-semibold mb-2 text-center flex items-center justify-center gap-2">
              <ShieldAlert size={16} className={!plagiarismReportUrl ? "text-amber-600" : "text-emerald-600"} />
              Plagiarism & AI Check
            </h3>
            <p className="text-xs mb-3 text-center text-slate-500">
              Mandatory check for plagiarism and AI-generated content.
            </p>



            <div className="flex flex-col gap-2">
              <Button onClick={() => {
                console.log("Clicked Run Mandatory Check");
                runPlagiarismCheck();
              }} disabled={plagiarismLoading || !articleId} className={`flex-1 ${plagiarismLoading ? "opacity-60 cursor-not-allowed" : ""} ${!plagiarismReportUrl ? "animate-pulse" : ""}`}>
                {plagiarismLoading ? "Analyzing..." : plagiarismReportUrl ? "Re-run Check" : "Run Mandatory Check"}
              </Button>
            </div>

            {plagiarismStatus && <p className="text-xs mt-3 text-center font-medium">{plagiarismStatus}</p>}

            {/* AI Detection Results */}
            {plagiarismSummary && typeof plagiarismSummary.ai_score === 'number' && (
              <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">

                {/* AI Score */}
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Content Score</span>
                  <span className={`text-sm font-bold ${plagiarismSummary.ai_score > 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {plagiarismSummary.ai_score}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                  <div className={`h-1.5 rounded-full ${plagiarismSummary.ai_score > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${plagiarismSummary.ai_score}%` }}></div>
                </div>

                {/* Web Plagiarism Score */}
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Web Plagiarism</span>
                  <span className={`text-sm font-bold ${plagiarismSummary.web_score && plagiarismSummary.web_score > 20 ? 'text-amber-600' : 'text-slate-600'}`}>
                    {plagiarismSummary.web_score || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                  <div className={`h-1.5 rounded-full ${plagiarismSummary.web_score && plagiarismSummary.web_score > 20 ? 'bg-amber-500' : 'bg-blue-400'}`} style={{ width: `${plagiarismSummary.web_score || 0}%` }}></div>
                </div>

                {plagiarismSummary.ai_details && plagiarismSummary.ai_details.length > 0 && (
                  <ul className="list-disc pl-3 text-[10px] text-slate-600 space-y-1 mt-2">
                    {plagiarismSummary.ai_details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                )}
              </div>
            )}

            {/* JPlag Results */}
            {plagiarismSummary && (
              <div className="mt-3 text-xs border-t pt-3">
                <div className="flex justify-between mb-1">
                  <span>Max Similarity:</span>
                  <span className="font-semibold">{String(plagiarismSummary.max_similarity ?? "N/A")}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Avg Similarity:</span>
                  <span className="font-semibold">{String(plagiarismSummary.avg_similarity ?? "N/A")}</span>
                </div>

                {plagiarismSummary.pairs && plagiarismSummary.pairs.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-[10px] text-slate-500 uppercase">Top Matches</p>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {plagiarismSummary.pairs.slice(0, 3).map((p, i) => (
                        <li key={i}>
                          {p.a} ↔ {p.b} ({p.similarity}%)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plagiarismReportUrl && (
                  <div className="mt-3">
                    <div className="p-2 border rounded bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="bg-indigo-100 p-1.5 rounded text-indigo-600">
                          <UploadCloud size={14} />
                        </div>
                        <div className="text-xs truncate">
                          <div className="font-medium text-slate-700 dark:text-slate-200">Plagiarism_Report.zip</div>
                          <div className="text-[10px] text-slate-500">Generated & Attached</div>
                        </div>
                      </div>
                      <a href={plagiarismReportUrl} target="_blank" rel="noreferrer" className="text-[10px] sm:text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2 py-1 rounded shadow-sm transition-colors">
                        Download
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!plagiarismReportUrl && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-100 text-amber-800 text-[10px]">
                <AlertCircle size={14} />
                <span>Report required to submit article.</span>
              </div>
            )}

          </Card>

          {/* Tips */}
          <Card className="p-5 rounded-2xl border">
            {/* ... (keep existing tips) ... */}
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
          {/* ... (keep stats) ... */}
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

      {/* ... Modals (Similarity, Confirm) ... */}
      {/* (Since using replace_file_content with range, I must be careful. 
           I'll assume I can't overwrite the whole file easily.
           I will try to replace specifically the section from line 1134 (Plagiarism Card start) 
           down to the end of the sidebar column or similar.
       */}

      {/* Similarity Modal */}
      {similarityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-3xl overflow-auto max-h-[90vh]">
            <h3 className="text-lg font-bold mb-4">Similarity Check Results</h3>

            {/* Summary */}
            <div className="mb-4 text-sm text-slate-700 dark:text-slate-300">
              <p>Found <strong>{similarityPairs.length}</strong> internal matches and <strong>{webResults.length}</strong> web sources.</p>
              <p className="text-xs text-slate-500">Threshold: {similarityThreshold} | Top: {similarityTopN}</p>
            </div>

            {/* Web Results */}
            {webResults.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-semibold mb-2 text-indigo-600 bg-indigo-50 p-1.5 rounded inline-block">Probably Matching Web Sources</h4>
                <ul className="text-xs space-y-1 pl-1">
                  {webResults.map((url, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-slate-400 font-mono">[{i + 1}]</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{url}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Internal Pairs */}
            {similarityPairs.length > 0 ? (
              <div className="mb-5">
                <h4 className="text-sm font-semibold mb-2">Internal Attachment Matches</h4>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-800">
                      <th className="p-2">Doc A</th>
                      <th className="p-2">Doc B</th>
                      <th className="p-2">Similarity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {similarityPairs.map((p, i) => (
                      <tr key={i} className="border-b hover:bg-slate-50">
                        <td className="p-2 max-w-[150px] truncate" title={p.aId}>{p.aId}</td>
                        <td className="p-2 max-w-[150px] truncate" title={p.bId}>{p.bId}</td>
                        <td className="p-2 font-bold font-mono">
                          <span className={p.score > 0.8 ? "text-red-600" : p.score > 0.5 ? "text-amber-600" : "text-slate-600"}>
                            {(p.score * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic mb-4">No internal attachment similarities found above the threshold.</p>
            )}

            {/* Document Excerpts */}
            {similarityDocs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Processed Documents</h4>
                <div className="flex flex-wrap gap-2">
                  {similarityDocs.map(d => (
                    <div key={d.id} className="text-[10px] p-2 bg-slate-100 dark:bg-slate-800 rounded border max-w-[200px]">
                      <strong>{d.filename}</strong>
                      <p className="text-slate-500 truncate mt-1">{d.textExcerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setSimilarityModalOpen(false)}>Close</Button>
              {/* Updated Submit Button in Modal */}
              <Button
                onClick={() => {
                  // Check enforcement here too just in case
                  if (!plagiarismReportUrl && !plagiarismSummary) {
                    // toast.error("Plagiarism check required!"); 
                    // replaced toast with alert to avoid lint error
                    alert("Plagiarism check required!");
                    setSimilarityModalOpen(false);
                    const el = document.getElementById("plagiarism-section");
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    return;
                  }

                  // If similarity top >= threshold, require confirmation modal
                  if ((lastTopSimilarity || 0) >= similarityThreshold) {
                    setConfirmModalOpen(true);
                  } else {
                    // ...
                    if (articleId) {
                      setIsSubmitting(true);
                      finalizeSubmission(articleId)
                        .then(() => {
                          // ...
                          localStorage.removeItem("draft");
                          if (isPartner) router.push("/partner-dashboard/submissions");
                          else router.push("/author-dashboard/articles");
                        })
                        .catch((err) => {
                          setStatusMsg("Submission failed: " + err.message);
                          setIsSubmitting(false);
                        });
                    }
                  }
                }}
                disabled={!plagiarismReportUrl} // Block if no report
                className="bg-indigo-600 text-white disabled:opacity-50"
                title={!plagiarismReportUrl ? "Run plagiarism check first" : ""}
              >
                {((lastTopSimilarity || 0) >= similarityThreshold) ? "Confirm & Submit" : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ... */}
    </div>
  );
}

export default function SubmitArticlePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>}>
      <SubmitArticleContent />
    </Suspense>
  );
}
