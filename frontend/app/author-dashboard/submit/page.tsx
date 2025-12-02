"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Send, Save, XCircle, Clock, UploadCloud, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function SubmitArticlePage() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [issue, setIssue] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const strip = (t: string) => t.replace(/<[^>]+>/g, "");
  const words = strip(content).split(/\s+/).filter(Boolean).length;
  const chars = strip(content).length;
  const mins = Math.ceil(words / 200);

  // Auto restore draft
  useEffect(() => {
    const saved = localStorage.getItem("draft");
    if (saved) {
      const d = JSON.parse(saved);
      setTitle(d.title || "");
      setSummary(d.summary || "");
      setContent(d.content || "");
      setCategory(d.category || "");
      setTags(d.tags || []);
      setIssue(d.issue || "");
      setStatusMsg("✅ Draft Loaded");
    }
  }, []);

  // Auto Save
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem("draft", JSON.stringify({ title, summary, content, category, tags, issue }));
      setStatusMsg("Draft autosaved...");
    }, 3000);

    return () => clearInterval(timer);
  }, [title, summary, content, category, tags, issue]);

  const saveDraft = () => {
    localStorage.setItem("draft", JSON.stringify({ title, summary, content, category, tags, issue }));
    setStatusMsg("✅ Draft Saved!");
  };

  const preview = () => {
    const w = window.open();
    w?.document.write(`<h1>${title}</h1><p>${summary}</p><div>${content}</div>`);
  };

  const submit = () => {
    setStatusMsg("🚀 Submitted for review!");
    localStorage.removeItem("draft");
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const attachUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (name: string) => {
    setAttachments(files => files.filter(f => f.name !== name));
  };

  // Drag & Drop Fix
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setAttachments(prev => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // Toolbar format fix
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
          <Button variant="outline" onClick={saveDraft} className="flex items-center gap-1">
            <Save size={14}/> Save Draft
          </Button>
          <Button variant="outline" onClick={preview} className="flex items-center gap-1">
            <Eye size={14}/> Preview
          </Button>
          <Button onClick={submit} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1">
            <Send size={14}/> Submit for Review
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
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter article title"
              className="w-full mt-1 mb-4 border bg-slate-100 dark:bg-slate-900 text-sm p-3 rounded-xl"
            />

            <label className="text-sm font-medium">Summary *</label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              maxLength={300}
              placeholder="Write short summary..."
              className="w-full mt-1 border bg-slate-100 dark:bg-slate-900 text-sm p-3 rounded-xl h-28"
            />

            <p className="text-[10px] text-slate-500 text-right mt-1 mb-4">
              {summary.length}/300 characters
            </p>

            {/* TOOLBAR */}
            <div className="flex items-center justify-between border rounded-xl bg-white dark:bg-slate-900 p-2 mt-2 mb-3">
              <div className="flex items-center gap-3 pl-2 text-sm">
                <button onClick={() => format("bold")}><b>B</b></button>
                <button onClick={() => format("italic")}><i>I</i></button>
                <button onClick={() => format("underline")}><u>U</u></button>
                <button onClick={() => format("insertUnorderedList")}>•</button>
                <button onClick={() => format("insertOrderedList")}>≡</button>
                <button onClick={insertLink}>🔗</button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={insertImage} className="h-7 text-xs px-3 flex items-center gap-1">
                  🖼 Image
                </Button>

                <Button variant="outline" onClick={openFileDialog} className="h-7 text-xs px-3 flex items-center gap-1">
                  <Upload size={12}/> Upload
                </Button>
              </div>
            </div>

            {/* EDITOR */}
            <div
              contentEditable
              onInput={e => setContent(e.currentTarget.innerHTML)}
              className="w-full min-h-[250px] border bg-white dark:bg-slate-900 text-sm p-3 rounded-xl"
            />
          </Card>

          {/* ATTACHMENTS CARD */}
          <Card className="p-5 rounded-2xl border shadow-sm">
            <h3 className="text-base font-semibold mb-2 flex items-center gap-2 justify-center">
              <UploadCloud size={18}/> Upload Attachments
            </h3>

            <input
              id="fileInput"
              type="file"
              multiple
              onChange={attachUpload}
              className="hidden"
            />

            <div
              onClick={openFileDialog}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDragEnter={handleDragOver}
              className="w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 mt-2 cursor-pointer"
            >
              <UploadCloud size={28} />
              <p className="text-xs text-slate-500 mt-2 text-center">
                {isDragging ? "Drop files to upload" : "Drag and drop files here or click"}
              </p>
            </div>

            <div className="mt-3 space-y-2 max-h-40 overflow-auto">
              {attachments.map(file => (
                <div key={file.name} className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 text-xs p-2 rounded-xl">
                  <span className="truncate max-w-[85%]">{file.name}</span>
                  <button onClick={() => removeAttachment(file.name)} className="text-red-600">
                    <XCircle size={14}/>
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

            <label className="text-xs font-medium">Category *</label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Enter category"
              className="w-full border bg-slate-100 dark:bg-slate-900 text-xs p-2 rounded-lg mb-3"
            />

            <label className="text-xs font-medium">Tags</label>
            <div className="flex">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Add tag..."
                className="flex-1 border bg-slate-100 dark:bg-slate-900 text-xs p-2 rounded-l-lg"
              />
              <button onClick={addTag} className="bg-indigo-600 text-white text-xs px-3 rounded-r-lg">Add</button>
            </div>

            <div className="flex flex-wrap gap-1 mt-2 mb-3">
              {tags.map(tag => (
                <span key={tag} className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                  {tag}
                  <XCircle size={10} className="cursor-pointer" onClick={() => removeTag(tag)}/>
                </span>
              ))}
            </div>

            <label className="text-xs font-medium">Assign to Issue (Optional)</label>
            <input
              value={issue}
              onChange={e => setIssue(e.target.value)}
              placeholder="e.g. January 2026"
              className="w-full border bg-slate-100 dark:bg-slate-900 text-xs p-2 rounded-lg"
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
            <h3 className="text-sm font-semibold mb-2 flex items-center justify-center gap-1"><Clock size={14}/> Quick Stats</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><b>{words}</b> Words</div>
              <div><b>{chars}</b> Characters</div>
              <div><b>{mins}</b> Min Read</div>
              <div><b>{tags.length}</b> Tags</div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
