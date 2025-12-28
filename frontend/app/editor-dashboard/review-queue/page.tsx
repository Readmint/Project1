// app/editor/review-queue/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  PenTool,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  CheckSquare,
  BarChart2,
  Layers,
  X,
  Users,
  Clock,
  CheckCircle2,
  Search,
  Sparkles,
  CheckSquare as CheckSquareIcon,
} from "lucide-react";

/* --------------------------------------------------------------
   TYPES
-------------------------------------------------------------- */

type Priority = "High" | "Medium" | "Mid" | "Low";
type ReviewStatus =
  | "In Progress"
  | "Pending Review"
  | "Completed Review"
  | "Needs Revision";

type ReviewerFeedback = {
  reviewer: string;
  comments: string[];
  highlighted: string[];
  notes: string;
  errors: string[];
};

type ArticleQC = {
  wordCount: number;
  readabilityScore: number;
  formattingValid: boolean;
  plagiarismResult: string;
  categoryAligned: boolean;
  visualStandardCheck: boolean;
  adsFreeMedia: boolean;
  copyrightSafeMedia: boolean;
};

type ReviewQueueArticle = {
  id: number;
  title: string;
  category: string;
  assignedDate: string;
  dueDate: string;
  priority: Priority;
  status: ReviewStatus;
  progress: number;
  feedback: ReviewerFeedback;
  qc: ArticleQC;
};

/* --------------------------------------------------------------
   SAMPLE DATA
-------------------------------------------------------------- */

const reviewQueue: ReviewQueueArticle[] = [
  {
    id: 101,
    title: "Cybersecurity Trends for 2026",
    category: "Technology",
    assignedDate: "Nov 18, 2025",
    dueDate: "Nov 25, 2025",
    priority: "High",
    status: "In Progress",
    progress: 78,
    feedback: {
      reviewer: "Alex Morgan",
      comments: [
        "Add citation for data breach stats.",
        "Shorten paragraphs under section 3.",
        "Great tone consistency.",
      ],
      highlighted: [
        "Section 3 is too long for mobile view.",
        "Missing reference in paragraph 7.",
      ],
      notes: "Requires proofing for sensitive data handling.",
      errors: [
        "Missing citation",
        "Overly complex section",
        "Check image copyrights",
      ],
    },
    qc: {
      wordCount: 1250,
      readabilityScore: 72,
      formattingValid: true,
      plagiarismResult: "15% similarity detected — acceptable",
      categoryAligned: true,
      visualStandardCheck: false,
      adsFreeMedia: true,
      copyrightSafeMedia: false,
    },
  },
  {
    id: 102,
    title: "Sustainable Tech in Daily Life",
    category: "Environment",
    assignedDate: "Nov 17, 2025",
    dueDate: "Nov 26, 2025",
    priority: "Medium",
    status: "Pending Review",
    progress: 24,
    feedback: {
      reviewer: "Jamie Lee",
      comments: ["Formatting looks good", "More UI examples needed"],
      highlighted: ["Intro paragraph could be stronger"],
      notes: "Nice direction, needs more references.",
      errors: [],
    },
    qc: {
      wordCount: 900,
      readabilityScore: 81,
      formattingValid: true,
      plagiarismResult: "No plagiarism detected",
      categoryAligned: true,
      visualStandardCheck: true,
      adsFreeMedia: true,
      copyrightSafeMedia: true,
    },
  },
];

/* --------------------------------------------------------------
   BADGES
-------------------------------------------------------------- */


const priorityBadge: Record<Priority, string> = {
  High: "bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px]",
  Medium: "bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px]",
  Mid: "bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px]",
  Low: "bg-slate-200 text-black dark:bg-slate-700 dark:text-white px-3 py-1 rounded-full text-[10px]",
};

const statusBadge: Record<string, string> = {
  "In Progress": "bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px]",
  "Pending Review": "bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px]",
  "Completed Review": "bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px]",
  "Needs Revision": "bg-red-200 text-red-700 px-3 py-1 rounded-full text-[10px]",
  "under_review": "bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px]",
  "approved": "bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px]",
  "changes_requested": "bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px]",
  "completed": "bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px]",
};


/* --------------------------------------------------------------
   PAGE START
-------------------------------------------------------------- */

import { getJSON } from "@/lib/api";

export default function ReviewQueuePage() {
  const router = useRouter();

  const [reviewQueue, setReviewQueue] = useState<ReviewQueueArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<ReviewQueueArticle | null>(null);
  const [editorNote, setEditorNote] = useState("");
  const [qcPanel, setQcPanel] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // CONFIRM MODALS
  const [confirmReReview, setConfirmReReview] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmSendToCM, setConfirmSendToCM] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await getJSON("/editor/submitted");
      if (res.status === 'success') {
        // Map backend to frontend model
        const mapped = res.data.map((item: any) => ({
          id: item.article_id, // utilize article_id for navigation/actions
          title: item.title,
          category: item.category || 'Uncategorized',
          assignedDate: new Date(item.assigned_date).toLocaleDateString(),
          dueDate: item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No Deadline',
          priority: item.priority || 'Medium',
          status: item.article_status || 'under_review',
          progress: 100, // completed
          feedback: { // Mock empty feedback as backend doesn't serve it yet here
            reviewer: "Pending",
            comments: [],
            highlighted: [],
            notes: "Pending review feedback",
            errors: []
          },
          qc: { // Mock QC
            wordCount: 0,
            readabilityScore: 0,
            formattingValid: true,
            plagiarismResult: "Pending scan",
            categoryAligned: true,
            visualStandardCheck: true,
            adsFreeMedia: true,
            copyrightSafeMedia: true,
          }
        }));
        setReviewQueue(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch review queue", err);
    } finally {
      setLoading(false);
    }
  };

  const qcArticle =
    qcPanel !== null ? reviewQueue.find((a) => a.id === qcPanel) : null;


  const closeModal = () => {
    setSelected(null);
    setEditorNote("");
  };

  const approve = (id: number) => {
    router.push(`/editor-dashboard/approved/${id}`);
  };

  const requestAuthorChanges = (id: number) => {
    router.push(`/editor-dashboard/author-changes/${id}`);
  };

  const approveForPublishing = (id: number) => {
    router.push(`/editor-dashboard/publish/${id}`);
  };

  const sendToContentManagerQC = (id: number) => {
    router.push(`/content-manager/qc-review/${id}`);
  };

  /* --------------------------------------------------------------
     RETURN
  -------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* TITLE */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold mb-1"
        >
          Review Queue
        </motion.h1>
        <p className="text-slate-500 dark:text-slate-400 text-[10px] mb-6">
          Integrate reviewer feedback and run quality audits
        </p>

        {/* SEARCH */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-full max-w-md">
            <input
              placeholder="Search review queue..."
              className="w-full bg-slate-100 dark:bg-slate-800 pl-8 border border-slate-300 dark:border-slate-700 text-[10px] py-2.5 rounded-xl outline-none focus:border-indigo-600 transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-2.5 top-2.5 text-slate-500" size={12} />
          </div>
        </div>

        {/* ARTICLE CARDS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviewQueue
            .filter((a) =>
              a.title.toLowerCase().includes(search.toLowerCase())
            )
            .map((article) => (
              <motion.div
                key={article.id}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="rounded-2xl border bg-white dark:bg-slate-800 shadow-sm p-4 flex flex-col h-full justify-between">
                  <CardContent className="p-0">
                    <h2 className="text-md font-bold mb-3">{article.title}</h2>

                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg text-[9px] mb-3">
                      <Layers size={9} /> {article.category}
                    </span>

                    <div className="space-y-1 text-slate-600 dark:text-slate-400 text-[10px] mb-3">
                      <p className="flex items-center gap-1">
                        <Clock size={10} /> Assigned: {article.assignedDate}
                      </p>
                      <p className="flex items-center gap-1">
                        <AlertCircle size={10} /> Due: {article.dueDate}
                      </p>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <span className={priorityBadge[article.priority]}>
                        {article.priority}
                      </span>
                      <span className={statusBadge[article.status]}>
                        {article.status}
                      </span>
                    </div>
                  </CardContent>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      onClick={() => setSelected(article)}
                      variant="outline"
                      className="text-[10px] px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border"
                    >
                      <MessageSquare size={11} /> Feedback
                    </Button>

                    <Button
                      onClick={() => setQcPanel(article.id)}
                      variant="outline"
                      className="text-[10px] px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border"
                    >
                      <CheckSquareIcon size={11} /> QC Check
                    </Button>

                    <Button
                      onClick={() =>
                        router.push(
                          `/editor-dashboard/design/${article.id}`
                        )
                      }
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] rounded-full px-3 py-1.5"
                    >
                      <PenTool size={11} /> Edit
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
        </div>

        {/* ----------------------------------------------------------
           FEEDBACK MODAL
        ---------------------------------------------------------- */}
        <AnimatePresence>
          {selected && (
            <motion.div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold">{selected.title}</h3>
                  <Button variant="ghost" onClick={closeModal}>
                    <X size={15} />
                  </Button>
                </div>

                {/* Highlights */}
                {selected.feedback.highlighted.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl text-[10px] mb-4">
                    <p className="font-semibold text-yellow-700 mb-1 flex items-center gap-1">
                      <Layers size={11} /> Highlights
                    </p>
                    <ul className="list-disc pl-3 space-y-1">
                      {selected.feedback.highlighted.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Comments */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-[10px] mb-4">
                  <p className="font-semibold text-indigo-600 mb-1 flex items-center gap-1">
                    <MessageSquare size={11} /> Reviewer Comments
                  </p>

                  <ul className="space-y-2">
                    {selected.feedback.comments.map((c, i) => (
                      <li
                        key={i}
                        className="flex justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-1"
                      >
                        <span>{c}</span>
                        <Button
                          onClick={() =>
                            setSelected({
                              ...selected,
                              feedback: {
                                ...selected.feedback,
                                comments:
                                  selected.feedback.comments.filter(
                                    (_, idx) => idx !== i
                                  ),
                              },
                            })
                          }
                          className="px-2 py-0.5 rounded-full bg-green-600 hover:bg-green-700 text-white text-[9px]"
                        >
                          Accept
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Errors */}
                {selected.feedback.errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-[10px] mb-4">
                    <p className="font-semibold text-red-600 mb-1 flex items-center gap-1">
                      <ShieldCheck size={11} /> Errors
                    </p>
                    <ul className="list-disc pl-3 space-y-1">
                      {selected.feedback.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reviewer Notes */}
                {selected.feedback.notes && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-[10px] mb-4">
                    <p className="font-semibold text-blue-600 flex items-center gap-1 mb-1">
                      <Users size={11} /> Reviewer Notes
                    </p>
                    {selected.feedback.notes}
                  </div>
                )}

                <textarea
                  placeholder="Add editor note..."
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-[10px] outline-none focus:border-indigo-600 mb-4"
                  rows={3}
                  value={editorNote}
                  onChange={(e) => setEditorNote(e.target.value)}
                />

                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => setConfirmReReview(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1.5 rounded-full"
                  >
                    <RefreshCw size={11} /> Request Re-Review
                  </Button>

                  <Button
                    onClick={() => setConfirmApprove(true)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-full"
                  >
                    <CheckSquare size={11} /> Approve
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------------------------------------------------
           QC PANEL
        ---------------------------------------------------------- */}
        <AnimatePresence>
          {qcArticle && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-xl z-50 p-5"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm flex items-center gap-1">
                  <CheckSquare size={14} /> QC Checklist
                </h3>
                <Button variant="ghost" onClick={() => setQcPanel(null)}>
                  <X size={15} />
                </Button>
              </div>

              <div className="space-y-2 text-[10px] mb-4">
                <QCItem ok={qcArticle.qc.formattingValid} text="Formatting validation" />
                <QCItem ok={qcArticle.qc.categoryAligned} text="Category alignment" />
                <QCItem ok={qcArticle.qc.visualStandardCheck} text="Visual/content standards" />
                <QCItem ok={qcArticle.qc.adsFreeMedia} text="Ads-free media" />
                <QCItem ok={qcArticle.qc.copyrightSafeMedia} text="Copyright-safe" />
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl mb-4 text-[10px]">
                <p className="font-semibold text-indigo-600 flex items-center gap-1 mb-1">
                  <ShieldCheck size={12} /> Plagiarism Result
                </p>
                {qcArticle.qc.plagiarismResult}
              </div>

              <div className="text-[10px] text-slate-600 dark:text-slate-400 mb-4 space-y-1">
                <p className="flex items-center gap-1">
                  <Clock size={11} /> Word Count: {qcArticle.qc.wordCount}
                </p>
                <p className="flex items-center gap-1">
                  <BarChart2 size={11} /> Readability Score: {qcArticle.qc.readabilityScore}
                </p>
              </div>

              <div className="grid gap-2">
                <Button
                  onClick={() => approveForPublishing(qcArticle.id)}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full px-3 py-2 text-xs"
                >
                  Approve for Publishing
                </Button>

                <Button
                  onClick={() => requestAuthorChanges(qcArticle.id)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full px-3 py-2 text-xs"
                >
                  Request Author Changes
                </Button>

                <Button
                  onClick={() => setConfirmSendToCM(true)}
                  className="bg-indigo-700 hover:bg-indigo-800 text-white rounded-full px-3 py-2 text-xs flex items-center gap-1"
                >
                  <Sparkles size={11} /> Send to Content Manager QC
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------------------------------------------------
           CONFIRM MODALS
        ---------------------------------------------------------- */}

        <ConfirmModal
          open={confirmReReview}
          onClose={() => setConfirmReReview(false)}
          onConfirm={() => {
            setConfirmReReview(false);
            router.push(`/editor-dashboard/review-request/${selected?.id}`);
          }}
          title="Request Re-Review?"
          message="This will send the article back to the reviewer for re-evaluation."
        />

        <ConfirmModal
          open={confirmApprove}
          onClose={() => setConfirmApprove(false)}
          onConfirm={() => {
            setConfirmApprove(false);
            approve(selected?.id!);
          }}
          title="Approve Article?"
          message="This marks the review as approved and prepares it for QC."
        />

        <ConfirmModal
          open={confirmSendToCM}
          onClose={() => setConfirmSendToCM(false)}
          onConfirm={() => {
            setConfirmSendToCM(false);
            sendToContentManagerQC(qcArticle?.id!);
          }}
          title="Send to Content Manager QC?"
          message="This forwards the article to the Content Manager for final review."
        />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------
   COMPONENTS
-------------------------------------------------------------- */

function QCItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      {ok ? (
        <CheckCircle2 size={12} className="text-green-500" />
      ) : (
        <AlertCircle size={12} className="text-red-500" />
      )}
      <span>{text}</span>
    </div>
  );
}

function ConfirmModal({ open, onClose, onConfirm, title, message }: any) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl max-w-sm w-full shadow-xl">
        <h3 className="font-semibold text-sm mb-2">{title}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">{message}</p>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-indigo-600 text-white text-xs rounded-full">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
