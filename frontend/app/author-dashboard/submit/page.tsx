"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";
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

// Fix the API_BASE - remove trailing slash if present
const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "";

export default function SubmitArticlePage() {
  const router = useRouter();

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

  const strip = (t: string) => t.replace(/<[^>]+>/g, "");
  const words = strip(content).split(/\s+/).filter(Boolean).length;
  const chars = strip(content).length;
  const mins = Math.ceil(words / 200);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const token = localStorage.getItem("token") || "";
      
      const res = await fetch(`${API_BASE}/article/categories`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCategories(data.data?.categories || data.categories || []);
        setStatusMsg("Categories loaded");
      } else {
        console.warn("Failed to fetch categories");
        setStatusMsg("⚠️ Could not load categories");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setStatusMsg("⚠️ Error loading categories");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Auto restore draft (local)
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
            issue_id
          })
        );
        setStatusMsg("Draft autosaved...");
      } catch {
        // ignore storage errors
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [title, summary, content, category_id, tags, issue_id]);

  const getToken = () => {
    return localStorage.getItem("token") || "";
  };

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

      console.log("Saving draft payload:", payload);

      const res = await fetch(`${API_BASE}/article/author/articles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
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
          : body?.message || `Failed to save draft (${res.status})`;
        throw new Error(errorMsg);
      }

      setStatusMsg("✅ Draft saved to server");
      localStorage.removeItem("draft");
    } catch (err: any) {
      console.error("Save draft error:", err);
      setStatusMsg("❌ Failed to save draft: " + (err.message || ""));
    }
  };

  const preview = () => {
    const w = window.open();
    w?.document.write(
      `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(summary)}</p><div>${content}</div>`
    );
  };

  const submit = async () => {
    if (!title.trim()) {
      setStatusMsg("Title is required");
      return;
    }

    setIsSubmitting(true);
    setStatusMsg("Creating article...");

    try {
      // Prepare payload with proper type handling
      const payload: any = {
        title: title.trim(),
        summary: summary.trim() || "",
        content: content || "",
        tags: tags || [],
        status: "submitted",
      };

      // Only add category_id if it's a non-empty string
      if (category_id && category_id.trim()) {
        payload.category_id = category_id.trim();
      } else {
        payload.category_id = null;
      }

      // Only add issue_id if it's a non-empty string
      if (issue_id && issue_id.trim()) {
        payload.issue_id = issue_id.trim();
      }
      // If issue_id is empty, don't include it in the payload

      console.log("Submit payload:", payload);

      // 1) create article with status 'submitted'
      const createRes = await fetch(`${API_BASE}/article/author/articles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const createBody = await (async () => {
        try {
          return await createRes.json();
        } catch {
          return null;
        }
      })();

      if (!createRes.ok) {
        // Handle category validation error specifically
        if (createBody?.message?.includes('category_id') || createBody?.details?.includes('category')) {
          throw new Error(`Invalid category ID. Please select a valid category from the dropdown.`);
        }
        
        const errorMsg = createBody?.errors 
          ? `Validation failed: ${JSON.stringify(createBody.errors)}`
          : createBody?.message || `Failed to create article (${createRes.status})`;
        throw new Error(errorMsg);
      }

      // normalize articleId extraction
      const articleId =
        createBody?.data?.id || createBody?.id || createBody?.data?.articleId;
      if (!articleId) {
        throw new Error("Article ID not returned by server");
      }

      // Only proceed with attachments if there are any
      if (attachments.length > 0) {
        setStatusMsg("Article created, uploading attachments...");

        const uploadResults: UploadResult[] = [];

        // helper to upload a single file to the backend using multipart/form-data
        const uploadFileToServer = async (file: File, articleId: string) => {
          setStatusMsg(`Uploading ${file.name} to server...`);

          const form = new FormData();
          form.append("file", file);

          const res = await fetch(
            `${API_BASE}/article/author/articles/${articleId}/attachments`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${getToken()}`,
                // NOTE: do NOT set Content-Type; browser will set it (multipart boundary)
              },
              body: form,
            }
          );

          let body: any = null;
          try {
            body = await res.json();
          } catch {
            // non-json or empty
          }

          if (!res.ok) {
            const msg = body?.message || `Upload failed for ${file.name} (status ${res.status})`;
            throw new Error(msg);
          }

          // expected: { status: 'success', data: { attachmentId, filename, size, mime_type, ... } }
          return body?.data || body;
        };

        try {
          for (const file of attachments) {
            setStatusMsg(`Uploading ${file.name}...`);

            const result = await uploadFileToServer(file, articleId);

            uploadResults.push({
              attachmentId: result?.attachmentId || result?._id || null,
              publicUrl: result?.publicUrl ?? null,
              sizeBytes: result?.size ?? result?.size_bytes ?? null,
              mimeType: result?.mime_type ?? result?.mimeType ?? null,
            });

            setStatusMsg(`${file.name} uploaded`);
          }

          setStatusMsg("All attachments uploaded — article submitted!");
        } catch (err: any) {
          // stop on first file error and surface to user
          throw new Error(err?.message || "Attachment upload failed");
        }
      } else {
        setStatusMsg("Article submitted without attachments!");
      }

      localStorage.removeItem("draft");
      setIsSubmitting(false);

      // Redirect to My Articles page
      router.push("/author-dashboard/articles");
    } catch (err: any) {
      console.error("Submit error:", err);
      setStatusMsg("❌ Submission failed: " + (err.message || ""));
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const attachUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (name: string) => {
    setAttachments((files) => files.filter((f) => f.name !== name));
  };

  // Drag & Drop handlers
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

  // Toolbar formatting (execCommand fallback)
  const format = (cmd: string) => {
    document.execCommand(cmd, false);
  };

  const insertLink = () => {
    const url = prompt("Enter URL");
    if (url) document.execCommand("createLink", false, url);
  };

  const insertImage = () => {
    const url = prompt("Paste Image URL");
    if (url) document.execCommand("insertImage", false, url);
  };

  const openFileDialog = () => {
    const input = document.getElementById("fileInput") as HTMLInputElement;
    input?.click();
  };

  return (
    <div className="p-4">
      {/* HEADER ROW */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Write Article</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create and submit your article for publication
          </p>
          {statusMsg && <p className="text-xs mt-1 text-indigo-600">{statusMsg}</p>}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={saveDraft}
            className="flex items-center gap-1"
            disabled={isSubmitting}
          >
            <Save size={14} /> Save Draft
          </Button>
          <Button
            variant="outline"
            onClick={preview}
            className="flex items-center gap-1"
            disabled={isSubmitting}
          >
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

            <p className="text-[10px] text-slate-500 text-right mt-1 mb-4">
              {summary.length}/300 characters
            </p>

            {/* TOOLBAR */}
            <div className="flex items-center justify-between border rounded-xl bg-white dark:bg-slate-900 p-2 mt-2 mb-3">
              <div className="flex items-center gap-3 pl-2 text-sm">
                <button onClick={() => format("bold")} disabled={isSubmitting}>
                  <b>B</b>
                </button>
                <button onClick={() => format("italic")} disabled={isSubmitting}>
                  <i>I</i>
                </button>
                <button onClick={() => format("underline")} disabled={isSubmitting}>
                  <u>U</u>
                </button>
                <button onClick={() => format("insertUnorderedList")} disabled={isSubmitting}>•</button>
                <button onClick={() => format("insertOrderedList")} disabled={isSubmitting}>≡</button>
                <button onClick={insertLink} disabled={isSubmitting}>🔗</button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={insertImage}
                  className="h-7 text-xs px-3 flex items-center gap-1"
                  disabled={isSubmitting}
                >
                  🖼 Image
                </Button>

                <Button
                  variant="outline"
                  onClick={openFileDialog}
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

            <input 
              id="fileInput" 
              type="file" 
              multiple 
              onChange={attachUpload} 
              className="hidden" 
              disabled={isSubmitting}
            />

            <div
              onClick={!isSubmitting ? openFileDialog : undefined}
              onDrop={!isSubmitting ? handleDrop : undefined}
              onDragOver={!isSubmitting ? handleDragOver : undefined}
              onDragLeave={handleDragLeave}
              onDragEnter={!isSubmitting ? handleDragOver : undefined}
              className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 mt-2 ${!isSubmitting ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              <UploadCloud size={28} />
              <p className="text-xs text-slate-500 mt-2 text-center">
                {isDragging ? "Drop files to upload" : "Drag and drop files here or click"}
              </p>
            </div>

            <div className="mt-3 space-y-2 max-h-40 overflow-auto">
              {attachments.map((file) => (
                <div key={file.name} className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 text-xs p-2 rounded-xl">
                  <span className="truncate max-w-[85%]">{file.name}</span>
                  <button 
                    onClick={() => !isSubmitting && removeAttachment(file.name)} 
                    className={`${isSubmitting ? 'text-gray-400 cursor-not-allowed' : 'text-red-600'}`}
                    disabled={isSubmitting}
                  >
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
              <ChevronDown 
                size={14} 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" 
              />
              {isLoadingCategories && (
                <p className="text-[10px] text-slate-500 mt-1">Loading categories...</p>
              )}
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
              <button 
                onClick={addTag} 
                className={`bg-indigo-600 text-white text-xs px-3 rounded-r-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSubmitting}
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mt-2 mb-3">
              {tags.map((tag) => (
                <span key={tag} className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                  {tag}
                  {!isSubmitting && (
                    <XCircle 
                      size={10} 
                      className="cursor-pointer" 
                      onClick={() => removeTag(tag)} 
                    />
                  )}
                </span>
              ))}
            </div>

            <label className="text-xs font-medium">Assign to Issue ID (Optional)</label>
            <input
              value={issue_id}
              onChange={(e) => setIssue_id(e.target.value)}
              placeholder="Enter issue ID if applicable"
              className="w-full border bg-slate-100 dark:bg-slate-900 text-xs p-2 rounded-lg"
              disabled={isSubmitting}
            />
          </Card>

          {/* TIPS */}
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

          {/* STATS */}
          <Card className="p-5 rounded-2xl border text-center">
            <h3 className="text-sm font-semibold mb-2 flex items-center justify-center gap-1">
              <Clock size={14} /> Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <b>{words}</b> Words
              </div>
              <div>
                <b>{chars}</b> Characters
              </div>
              <div>
                <b>{mins}</b> Min Read
              </div>
              <div>
                <b>{tags.length}</b> Tags
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* Helper: escape HTML for preview */
function escapeHtml(unsafe: string) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
