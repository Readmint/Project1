"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, FileDown, Upload, LayoutTemplate, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getJSON, postJSON } from "@/lib/api";
import A4Template from "@/components/editor-dashboard/A4Template";
import Link from "next/link";
import ImageInsertDialog from "@/components/editor-dashboard/ImageInsertDialog";
import SimpleImageUpload from "@/components/editor-dashboard/SimpleImageUpload";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

export default function EditorPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<any>(null);

  const [content, setContent] = useState("");
  const [metadata, setMetadata] = useState({
    issn: "",
    volume: "",
    issue: "",
    editorName: "",
    logo: "",
    publicationTitle: "THE MAGAZINE",
    footerText: "Readmint Platform",
    themeColor: "#166534",
    heroImage: "",
    tableOfContent: "",
    email: "",
    publicationDate: new Date().toISOString().split('T')[0]
  });

  const a4Ref = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  useEffect(() => {
    if (id) fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const res = await getJSON(`/editor/articles/${id}`);
      if (res.status === 'success') {
        const art = res.data.article;
        setArticle(art);
        setContent(art.content || "");

        const meta = art.metadata || {};
        setMetadata({
          issn: meta.issn || "",
          volume: meta.volume || "1",
          issue: meta.issue || "1",
          editorName: meta.editorName || "",
          logo: meta.logo || "",
          publicationTitle: meta.publicationTitle || "THE MAGAZINE",
          footerText: meta.footerText || "Readmint Platform",
          themeColor: meta.themeColor || "#166534",
          heroImage: meta.heroImage || "",
          tableOfContent: meta.tableOfContent || "",
          email: meta.email || "",
          publicationDate: meta.publicationDate || new Date().toISOString().split('T')[0]
        });
      }
    } catch (err) {
      console.error("Failed to fetch article", err);
      toast.error("Failed to load article");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await postJSON(`/editor/articles/${id}/save`, {
        content,
        notes: JSON.stringify(metadata)
      });
      toast.success("Draft saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save draft");
    }
  };

  const generatePDF = async () => {
    if (!a4Ref.current) return null;

    try {
      const canvas = await html2canvas(a4Ref.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        height: a4Ref.current.scrollHeight,
        windowHeight: a4Ref.current.scrollHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf;
    } catch (err) {
      console.error("PDF Generation failed", err);
      toast.error("Failed to generate PDF");
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    const pdf = await generatePDF();
    if (pdf) {
      pdf.save(`${article?.title || 'article'}.pdf`);
      toast.success("PDF Downloaded");
    }
  };

  const handleSubmit = async () => {
    const pdf = await generatePDF();
    if (!pdf) return;

    const blob = pdf.output('blob');
    const file = new File([blob], `${article?.title || 'final'}.pdf`, { type: 'application/pdf' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch(`/api/author/articles/${id}/attachments`, {
        method: 'POST',
        body: formData,
        // Assuming default auth headers are handled by browser/cookie or added by a wrapper you'd normally use. 
        // If not, we rely on session cookie.
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      await postJSON(`/editor/articles/${id}/finalize`, {
        finalContent: content,
        finalizeAs: 'publish'
      });

      toast.success("Submitted successfully!");
      router.push("/editor-dashboard/submitted");

    } catch (err) {
      console.error(err);
      toast.error("Failed to submit");
    }
  };

  const imageHandler = () => {
    setImageDialogOpen(true);
  };

  const handleImageInsert = (url: string, width: string = "100%") => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      if (editor) {
        const range = editor.getSelection();
        // Insert embed with attributes not always supported by default image blot without modules.
        // So we use HTML insertion for freedom or rely on css classes if possible.
        // Simple <img> insertion with style:
        editor.clipboard.dangerouslyPasteHTML(range?.index || 0, `<img src="${url}" style="width: ${width};" />`);
      }
    }
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  const miniModules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['clean']
    ]
  }), []);

  const tocModules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean']
    ]
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'list', 'link', 'image', 'align'
  ];

  const miniFormats = ['bold', 'italic', 'underline'];
  const tocFormats = ['bold', 'italic', 'underline', 'list', 'align'];

  if (loading) return <div className="p-12 text-center">Loading article...</div>;
  if (!article) return <div className="p-12 text-center">Article not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col h-screen overflow-hidden">
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="font-bold text-lg leading-tight truncate max-w-md">{article.title}</h1>
            <p className="text-xs text-slate-500">Author: {article.author_name || 'Unknown'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            <Save size={16} className="mr-2" />
            Save Draft
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <FileDown size={16} className="mr-2" />
            Preview PDF
          </Button>
          <Button size="sm" onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Upload size={16} className="mr-2" />
            Submit Final
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        <div className="w-1/2 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto">

          <Tabs defaultValue="metadata" className="w-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-800 z-10">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="metadata">Metadata & Settings</TabsTrigger>
                <TabsTrigger value="content">Content Editor</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="metadata" className="p-6 space-y-10">

              {/* 1. IDENTITY SECTION */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <LayoutTemplate className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Magazine Identity</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Define the core branding elements of your publication.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {/* Magazine Title */}
                  <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Publication Title</Label>
                    </div>
                    <div className="p-6">
                      <div className="h-32">
                        <ReactQuill
                          theme="snow"
                          value={metadata.publicationTitle}
                          onChange={(val) => setMetadata({ ...metadata, publicationTitle: val })}
                          className="h-full"
                          modules={miniModules}
                          formats={miniFormats}
                          placeholder="e.g. THE DAILY TIMES"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer & Contact Group */}
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Footer Text */}
                    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow md:col-span-2">
                      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Footer Text</Label>
                      </div>
                      <div className="p-6">
                        <div className="h-32 mb-4">
                          <ReactQuill
                            theme="snow"
                            value={metadata.footerText}
                            onChange={(val) => setMetadata({ ...metadata, footerText: val })}
                            className="h-full"
                            modules={miniModules}
                            formats={miniFormats}
                            placeholder="e.g. Readmint Media Group"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Email */}
                    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-shadow">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 block">Contact Email</Label>
                      <Input
                        value={metadata.email}
                        onChange={(e) => setMetadata({ ...metadata, email: e.target.value })}
                        placeholder="editor@publication.com"
                        className="h-10 border-slate-200"
                      />
                      <p className="text-[11px] text-slate-400 mt-2">Appears in the footer for reader inquiries.</p>
                    </div>

                    {/* Theme Color */}
                    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-shadow">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 block">Brand Theme Color</Label>
                      <div className="flex gap-4 items-center">
                        <div className="relative group cursor-pointer">
                          <div className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-transparent group-hover:ring-indigo-100 transition-all" />
                          <Input
                            type="color"
                            value={metadata.themeColor || "#166534"}
                            onChange={(e) => setMetadata({ ...metadata, themeColor: e.target.value })}
                            className="w-12 h-12 p-0.5 rounded-full border-2 border-white shadow-sm cursor-pointer overflow-hidden"
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            value={metadata.themeColor || "#166534"}
                            onChange={(e) => setMetadata({ ...metadata, themeColor: e.target.value })}
                            placeholder="#166534"
                            className="font-mono uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Publication Logo</Label>
                      {metadata.logo && <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Uploaded</span>}
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          value={metadata.logo}
                          onChange={(e) => setMetadata({ ...metadata, logo: e.target.value })}
                          placeholder="https://example.com/logo.png"
                          className="w-full text-sm"
                        />
                      </div>
                      <SimpleImageUpload
                        articleId={id as string}
                        onUploadComplete={(url) => setMetadata({ ...metadata, logo: url })}
                        label="Upload File"
                      />
                    </div>

                    {metadata.logo && (
                      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 flex justify-center items-center h-24">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={metadata.logo} className="h-full object-contain" alt="Logo Preview" />
                      </div>
                    )}
                  </div>
                </div>
              </section>


              {/* 2. ISSUE DETAILS SECTION */}
              <section className="space-y-6 pt-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <FileDown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Issue Details</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage volume, issue, and editorial metadata.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">ISSN Number</Label>
                    <Input
                      value={metadata.issn}
                      onChange={(e) => setMetadata({ ...metadata, issn: e.target.value })}
                      placeholder="e.g. 1234-5678"
                      className="border-0 bg-slate-50 focus-visible:ring-0 focus-visible:bg-indigo-50 font-medium"
                    />
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Volume</Label>
                    <Input
                      value={metadata.volume}
                      onChange={(e) => setMetadata({ ...metadata, volume: e.target.value })}
                      placeholder="1"
                      className="border-0 bg-slate-50 focus-visible:ring-0 focus-visible:bg-indigo-50 font-medium"
                    />
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Issue</Label>
                    <Input
                      value={metadata.issue}
                      onChange={(e) => setMetadata({ ...metadata, issue: e.target.value })}
                      placeholder="1"
                      className="border-0 bg-slate-50 focus-visible:ring-0 focus-visible:bg-indigo-50 font-medium"
                    />
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Editor Name</Label>
                    <Input
                      value={metadata.editorName}
                      onChange={(e) => setMetadata({ ...metadata, editorName: e.target.value })}
                      placeholder="Name"
                      className="border-0 bg-slate-50 focus-visible:ring-0 focus-visible:bg-indigo-50 font-medium"
                    />
                  </div>
                </div>
              </section>

              {/* 3. COVER & CONTENTS SECTION */}
              <section className="space-y-6 pt-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <RotateCcw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Cover & Contents</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Set the hero image and table of contents.</p>
                  </div>
                </div>

                <div className="grid gap-8">
                  {/* Hero Image */}
                  <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Hero / Cover Image</Label>
                      {metadata.heroImage && <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">Active</span>}
                    </div>
                    <div className="flex gap-3">
                      <Input
                        value={metadata.heroImage || ""}
                        onChange={(e) => setMetadata({ ...metadata, heroImage: e.target.value })}
                        placeholder="https://..."
                        className="flex-1"
                      />
                      <SimpleImageUpload
                        articleId={id as string}
                        onUploadComplete={(url) => setMetadata({ ...metadata, heroImage: url })}
                        label="Upload Image"
                      />
                    </div>

                    {metadata.heroImage && (
                      <div className="mt-4 rounded-lg overflow-hidden border border-slate-200 h-32 w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={metadata.heroImage} className="w-full h-full object-cover opacity-90" alt="Hero Preview" />
                      </div>
                    )}
                  </div>

                  {/* Table of Contents */}
                  <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Index / Table of Contents</Label>
                      <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 border rounded">Rich Text Supported</span>
                    </div>
                    <div className="p-6">
                      <div className="h-48 mb-4">
                        <ReactQuill
                          theme="snow"
                          value={metadata.tableOfContent}
                          onChange={(val) => setMetadata({ ...metadata, tableOfContent: val })}
                          className="h-full"
                          modules={tocModules}
                          formats={tocFormats}
                          placeholder="e.g. 1. Introduction... 5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="sticky bottom-4 z-20">
                <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xl flex items-center justify-between backdrop-blur-sm bg-opacity-95">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 rounded-full p-1">
                      <Save className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-sm">
                      <span className="font-bold block">Auto-Sync Active</span>
                      <span className="opacity-70 text-xs">Changes apply instantly to the preview.</span>
                    </div>
                  </div>
                </div>
              </div>

            </TabsContent>

            <TabsContent value="content" className="flex-1 flex flex-col min-h-0 h-full">
              <div className="p-4 h-full flex flex-col">
                <div className="mb-2 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setImageDialogOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Insert Image
                  </Button>
                </div>
                <ReactQuill
                  // @ts-ignore
                  ref={quillRef}
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  className="h-[500px] mb-12"
                  modules={modules}
                  formats={formats}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-1/2 bg-slate-100 dark:bg-slate-900 p-8 overflow-y-auto flex justify-center items-start">
          <div className="scale-[0.6] origin-top transform-gpu shadow-2xl">
            <A4Template
              ref={a4Ref}
              content={content}
              metadata={{
                ...metadata,
                title: article.title,
                authorName: article.author_name || article.author_email || article.author?.display_name || 'Unknown Author'
              }}
            />
          </div>
        </div>

        <ImageInsertDialog
          open={imageDialogOpen}
          onOpenChange={setImageDialogOpen}
          onInsert={handleImageInsert}
          articleId={Array.isArray(id) ? id[0] : id}
        />
      </div>
    </div>
  );
}
