"use client";

import React, { useEffect, useState } from "react";
import { JSX } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

type Attachment = {
  id: string;
  filename?: string;
  public_url?: string | null;
  storage_path?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  uploaded_at?: string | null;
};

type WorkflowEvent = {
  id: string;
  actor_id?: string;
  from_status?: string;
  to_status?: string;
  note?: string;
  created_at?: string;
};

type Review = {
  id: string;
  reviewer_id?: string;
  summary?: string;
  details?: string;
  decision?: string;
  similarity_score?: number;
  created_at?: string;
};

import { API_BASE, getJSON } from "@/lib/api";
// API_ROOT usage replaced by getJSON


export default function ArticlePreviewPage(): JSX.Element {
  const params = useParams() as { id?: string };
  const id = params?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [article, setArticle] = useState<any | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowEvent[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!id) {
      setErrorMsg("Missing article id in URL.");
      return;
    }
    fetchArticle(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Robust getToken: checks several keys your app may use
  const getToken = (): string | null => {
    try {
      if (typeof window === "undefined") return null;
      const keys = ["ACCESS_TOKEN", "token", "idToken"];
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v && v.trim()) return v.trim();
      }
      return null;
    } catch (err) {
      console.warn("getToken error", err);
      return null;
    }
  };

  const fetchArticle = async (articleId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = getToken();
      if (!token) {
        setErrorMsg("Not authenticated. Please log in.");
        setLoading(false);
        return;
      }

      console.log("Fetching article preview for", articleId);
      // getJSON handles 401/403 internally by throwing, but we can catch
      const res: any = await getJSON(`/article/author/articles/${encodeURIComponent(articleId)}`);

      // If we got here, it's success (or 200 OK range)
      const data = res?.data;
      setArticle(data?.article || null);
      setAttachments(data?.attachments || []);
      setWorkflow(data?.workflow || []);
      setReviews(data?.reviews || []);
    } catch (err: any) {
      console.error("Error fetching preview:", err);
      // getJSON throws object with status/message usually
      setErrorMsg("Failed to load article preview: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => router.back();

  /**
   * Open attachment:
   *  - If attachment already has public_url, open it
   *  - Else request a signed URL from backend (authenticated request)
   *  - Backend should return { status:'success', data: { url: 'https://...signed...' } }
   *  - Then open the signed url in a new tab
   */
  const handleOpenAttachment = async (att: Attachment) => {
    if (!id) {
      alert("Missing article id");
      return;
    }

    // If it's already public, open directly
    if (att.public_url) {
      window.open(att.public_url, "_blank");
      return;
    }

    try {
      // endpoint uses API_ROOT + "/article" because routes are mounted at /api/article
      const signedUrlEndpoint = `/article/author/articles/${encodeURIComponent(
        id
      )}/attachments/${encodeURIComponent(att.id)}/signed-url`;

      const res: any = await getJSON(signedUrlEndpoint);

      const signed = res?.data?.url;
      if (!signed) {
        alert("Signed URL not returned by server.");
        return;
      }

      // open signed URL in new tab (no Authorization header needed)
      window.open(signed, "_blank");
    } catch (err: any) {
      console.error("Failed to get signed URL:", err);
      alert("Failed to open attachment: " + (err?.message || String(err)));
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-xl font-semibold">Article Preview</h1>
      </div>

      <Card className="p-4 mb-4">
        {loading && <div className="text-sm text-slate-500">Loading...</div>}
        {errorMsg && <div className="text-sm text-rose-600">{errorMsg}</div>}

        {!loading && !errorMsg && article && (
          <div>
            <h2 className="text-2xl font-bold mb-2">{article.title || "Untitled"}</h2>
            {article.summary && <p className="text-sm text-slate-600 mb-3">{article.summary}</p>}

            <div
              className="prose max-w-none mb-4"
              dangerouslySetInnerHTML={{ __html: article.content || article.body || "" }}
            />

            <div className="mt-4 text-sm">
              <div>
                <b>Status:</b> {article.status || "-"}
              </div>
              <div>
                <b>Category:</b> {article.category_id || article.category || "-"}
              </div>
              <div>
                <b>Author ID:</b> {String(article.author_id || article.author || "-")}
              </div>
              <div>
                <b>Created:</b> {article.created_at || article.publishedAt || "-"}
              </div>
            </div>
          </div>
        )}

        {!loading && !errorMsg && !article && (
          <div className="text-sm text-slate-500">No article data to display.</div>
        )}
      </Card>

      <Card className="p-4 mb-4">
        <h3 className="font-semibold mb-2">Attachments</h3>
        {attachments.length === 0 && <div className="text-sm text-slate-500">No attachments</div>}
        <ul className="space-y-2">
          {attachments.map((att) => (
            <li key={att.id} className="flex items-center justify-between">
              <div className="text-sm">{att.filename || att.id}</div>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs px-2 py-1 rounded bg-indigo-600 text-white"
                  onClick={() => handleOpenAttachment(att)}
                >
                  Open
                </button>
                <div className="text-[11px] text-slate-400">{att.size_bytes ? `${(att.size_bytes / 1024).toFixed(1)} KB` : ""}</div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="font-medium mb-2">Workflow events</h4>
          {workflow.length === 0 && <div className="text-sm text-slate-500">No workflow events</div>}
          <ul className="text-sm space-y-2">
            {workflow.map((ev) => (
              <li key={ev.id}>
                <div>
                  <b>{ev.to_status}</b> — {ev.note || ""}
                </div>
                <div className="text-xs text-slate-400">
                  {ev.created_at} by {ev.actor_id}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-2">Reviews</h4>
          {reviews.length === 0 && <div className="text-sm text-slate-500">No reviews</div>}
          <ul className="text-sm space-y-2">
            {reviews.map((r) => (
              <li key={r.id}>
                <div>
                  <b>{r.decision || "Review"}</b> — {r.summary}
                </div>
                <div className="text-xs text-slate-400">
                  {r.created_at} by {r.reviewer_id}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
