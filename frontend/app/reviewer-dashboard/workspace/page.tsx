"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getJSON, postJSON } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, AlertOctagon, FileText, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ReviewContent {
  id: string;
  title: string;
  body: string;
  // file_url: string; // Deprecated in favor of attachments array, but kept for fallback
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    mime_type: string;
  }>;
  category_name: string;
  assignment_id?: string;
}

export default function ReviewWorkspacePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const articleId = searchParams.get("id");

  const [content, setContent] = useState<ReviewContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignmentId, setAssignmentId] = useState<string>("");

  // Review tool scores / notes
  const [tools, setTools] = useState({
    grammar: 0,
    structure: "",
    readability: 0,
    factCheck: "",
    categoryFit: "",
  });

  const [comments, setComments] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [sending, setSending] = useState(false);
  const [plagarismReport, setPlagarismReport] = useState<any>(null);

  useEffect(() => {
    if (articleId) {
      loadContent(articleId);
      loadPlagiarismStatus(articleId);
      findAssignmentId(articleId);
    }
  }, [articleId]);

  const loadPlagiarismStatus = async (id: string) => {
    try {
      const res = await getJSON(`/reviewer/plagiarism/status/${id}`);
      if (res.status === 'success' && res.data) {
        setPlagarismReport(res.data.similarity_summary);
      }
    } catch (e) {
      console.error("Failed to load plagiarism status", e);
    }
  };

  const runPlagiarismCheck = async () => {
    if (!content?.id) return;
    toast.info("Starting plagiarism scan...");
    try {
      const res = await postJSON(`/reviewer/plagiarism/check/${content.id}`, {});
      if (res.status === 'success') {
        setPlagarismReport(res.data);
        toast.success("Scan completed!");
      } else {
        toast.error("Scan failed to initiate.");
      }
    } catch (e) {
      toast.error("Error running plagiarism check.");
    }
  }

  const loadContent = async (id: string) => {
    try {
      const res = await getJSON(`/reviewer/content/${id}`);
      if (res.status === 'success') {
        setContent(res.data);
      } else {
        toast.error("Failed to load content.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading content details.");
    } finally {
      setLoading(false);
    }
  };

  const findAssignmentId = async (artId: string) => {
    // Helper to find the specific assignment ID for this article
    try {
      const res = await getJSON('/reviewer/assignments');
      if (res.data) {
        const match = res.data.find((a: any) => a.articleId === artId);
        if (match) setAssignmentId(match.id);
      }
    } catch (e) {
      console.error("Failed to resolve assignment ID", e);
    }
  };

  const handleStatusUpdate = async (status: 'accepted' | 'rejected' | 'completed') => {
    if (!assignmentId) {
      toast.error("Assignment context missing. Please return to dashboard and try again.");
      return;
    }
    setSending(true);
    try {
      const payload = {
        assignmentId,
        status,
        feedback: `Comments: ${comments}\nSuggestions: ${suggestions}\nScores: Grammar=${tools.grammar}, Readability=${tools.readability}`
      };
      const res = await postJSON('/reviewer/status', payload);
      if (res.status === 'success') {
        toast.success(`Review ${status} successfully!`);
        router.push('/reviewer-dashboard');
      } else {
        toast.error(res.message || "Update failed");
      }
    } catch (e) {
      toast.error("System error submitting review.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Content not found or access denied.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/reviewer-dashboard/assigned">Back to Assignments</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* HEADER */}
      <section className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Link href="/reviewer-dashboard/assigned" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={14} /> Back
            </Link>
            <span>/</span>
            <span>Review Workspace</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {content.title}
          </h1>
          <p className="text-sm text-indigo-600 font-medium bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md inline-block">
            {content.category_name}
          </p>
        </div>
      </section>

      <section className="grid lg:grid-cols-4 gap-6">
        {/* CONTENT PREVIEW */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg shadow-sm p-8 space-y-6">
          <h3 className="font-medium text-foreground border-b border-border pb-2">Content to Review</h3>
          <div
            className="prose dark:prose-invert max-w-none text-sm leading-relaxed font-serif"
            dangerouslySetInnerHTML={{ __html: content.body || "No textual content available (check file download)." }}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">

          {/* ATTACHMENTS */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              Attachments
            </h3>
            {content.attachments && content.attachments.length > 0 ? (
              <ul className="space-y-2">
                {content.attachments.map((file) => (
                  <li key={file.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-border text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="truncate max-w-[180px] font-medium text-foreground">{file.filename}</span>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline text-xs flex-shrink-0"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-border">
                <p>No attachments found.</p>
              </div>
            )}
          </div>

          {/* PLAGIARISM CHECK */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <AlertOctagon size={16} className="text-orange-500" />
                Plagiarism Check
              </h3>
              <Button size="sm" variant={plagarismReport ? "outline" : "secondary"} onClick={runPlagiarismCheck} disabled={!!plagarismReport}>
                {plagarismReport ? "Scan Completed" : "Run Check"}
              </Button>
            </div>

            {!plagarismReport ? (
              <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-border">
                <p>Run a scan to view similarity reports.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded p-2 text-center">
                    <div className="text-xs text-muted-foreground">Similarity</div>
                    <div className={`font-bold ${plagarismReport.similarity_score > 20 ? 'text-red-500' : 'text-green-600'}`}>
                      {plagarismReport.similarity_score}%
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded p-2 text-center">
                    <div className="text-xs text-muted-foreground">Unique</div>
                    <div className="font-bold text-indigo-600">{plagarismReport.unique_score}%</div>
                  </div>
                </div>

                {plagarismReport.matches && plagarismReport.matches.length > 0 && (
                  <div className="text-xs space-y-2">
                    <p className="font-medium text-muted-foreground">Detected Sources:</p>
                    <ul className="space-y-1">
                      {plagarismReport.matches.map((m: any, idx: number) => (
                        <li key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-1.5 rounded border border-border">
                          <a href={m.url} target="_blank" className="text-blue-600 hover:underline truncate max-w-[180px]">{m.source}</a>
                          <span className="text-muted-foreground">{m.similarity}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* REVIEW TOOLS */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <FileText size={16} className="text-indigo-500" />
              Evaluation Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Grammar Score (0-100)</label>
                <input type="number" className="w-full p-2 border rounded-md text-sm bg-background"
                  value={tools.grammar} onChange={e => setTools({ ...tools, grammar: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Readability (0-100)</label>
                <input type="number" className="w-full p-2 border rounded-md text-sm bg-background"
                  value={tools.readability} onChange={e => setTools({ ...tools, readability: Number(e.target.value) })} />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Structure Integrity</label>
                <select className="w-full p-2 border rounded-md text-sm bg-background"
                  value={tools.structure} onChange={e => setTools({ ...tools, structure: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>
          </div>

          {/* GUIDELINES */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-medium text-foreground text-sm">Reviewer Guidelines</h3>
            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1.5">
              <li>Verify originality and check for plagiarism flags.</li>
              <li>Evaluate logical flow and argument structure.</li>
              <li>Assess compliance with category standards.</li>
              <li>Provide constructive feedback for rejection/updates.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* COMMENTS & SUGGESTIONS */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-foreground">Detailed Comments</h3>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Write your general feedback here..."
            className="w-full min-h-[120px] border border-border rounded-md p-3 text-sm bg-background focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-foreground">Improvement Suggestions</h3>
          <textarea
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            placeholder="Specific actionable points for the author..."
            className="w-full min-h-[120px] border border-border rounded-md p-3 text-sm bg-background focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
      </section>

      {/* ACTION BUTTONS */}
      <section className="flex justify-end gap-4 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => handleStatusUpdate('rejected')}
          disabled={sending}
          className="items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
        >
          <AlertOctagon size={16} />
          Reject Submission
        </Button>
        {/* 'Request Changes' logically maps to 'rejected' with feedback for now, or custom status if needed. 
            Standardizing on 'rejected' (send back to author) vs 'completed' (passed to editor) */}

        <Button
          onClick={() => handleStatusUpdate('completed')}
          disabled={sending}
          className="items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckCircle size={16} />
          Approve & Complete Review
        </Button>
      </section>
    </div>
  );
}
