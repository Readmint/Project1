"use client";

import { useState, useRef, useEffect } from "react";
// import { DndContext, DragEndEvent } from "@dnd-kit/core"; // Removed in favor of framer-motion
// Actually, sticking to framer-motion for canvas Drag & Drop as it provides smoother "design tool" feel than dnd-kit which is often grid-based.
import { motion } from "framer-motion";
import { Toolbar } from "./Toolbar";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { CoverPageEditor, CoverPageData } from "./CoverPageEditor";
import { ArrowLeft, Download, Eye, RotateCcw, RotateCw, Save, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";
import { getJSON, putJSON, postJSON } from "@/lib/api";
import { toast } from "sonner"; // Assuming sonner is used, or a generic alert

// API_BASE removed (handled by library)

export type EditorElement = {
    id: string;
    type: "text" | "image" | "shape";
    content: string; // Text content or Image URL
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    pageIndex: number; // Added for multi-page
    style: React.CSSProperties;
    locked?: boolean; // NEW: Lock elements from editing
};

// Generic Undo/Redo Hook
function useHistory<T>(initialState: T) {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const setState = (newState: T) => {
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const redo = () => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    return { state: history[currentIndex], setState, undo, redo, canUndo: currentIndex > 0, canRedo: currentIndex < history.length - 1 };
}

export function MagEditor({ articleId, readOnly = false, className = "" }: { articleId: string, readOnly?: boolean, className?: string }) {
    const router = useRouter();
    const [scale, setScale] = useState(readOnly ? 0.8 : 0.6);
    const [pageCount, setPageCount] = useState(1); // Track number of pages

    // Default Cover Data
    const [coverData, setCoverData] = useState<CoverPageData>({
        edition: "JANUARY 2025 EDITION",
        website: "WWW.MINDRADIX.COM",
        price: "₹150",
        reviewTitle: "ECONOMICS REVIEW",
        volIssue: "Vol: 01 | Issue: 01",
        mainTitle: "The Future of Digital Rupee",
        subTitle: "How India's CBDC is reshaping the global financial landscape and what it means for the common investor.",
        heroImage: "", // Empty to show placeholder
        articles: [
            { category: "Startups", title: "Unicorns of 2025: Who is Next?", image: "" },
            { category: "Fintech", title: "AI Trading: Risk or Reward?", image: "" },
            { category: "Analysis", title: "Inflation Trends: A Deep Dive.", image: "" }
        ]
    });

    const { state: elements, setState: setElements, undo, redo, canUndo, canRedo } = useHistory<EditorElement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Real Article Data State
    const [articleData, setArticleData] = useState<any>({
        title: "Loading...",
        author: "",
        issn: "ISSN 2025-001", // Placeholder or fetch if available
        volume: "Vol. 12, Issue 4", // Placeholder
        abstract: "",
        body: ""
    });
    const [attachments, setAttachments] = useState<any[]>([]);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await getJSON(`/author/articles/${articleId}`);

                if (res.status === 'success') {
                    const art = res.data.article;
                    const atts = res.data.attachments || [];

                    console.log("MagEditor fetched:", art);
                    setArticleData({
                        title: art.title,
                        author: art.author_name || (Array.isArray(art.co_authors) ? art.co_authors.join(", ") : "Unknown Author"),
                        issn: "ISSN 2025-001",
                        volume: "Vol. 1, Issue 1",
                        abstract: art.summary || "No abstract provided.",
                        body: art.content || ""
                    });
                    setAttachments(atts);

                    // Load saved design if exists
                    if (art.design_data) {
                        try {
                            const design = typeof art.design_data === 'string' ? JSON.parse(art.design_data) : art.design_data;
                            if (design) {
                                if (design.elements) setElements(design.elements);
                                if (design.coverData) setCoverData(design.coverData);
                                if (design.pages || design.pageCount) setPageCount(design.pages || design.pageCount);
                            }
                        } catch (e) {
                            console.error("Failed to parse design data", e);
                        }
                    }
                } else {
                    console.error("MagEditor fetch status not success:", res);
                }
            } catch (err) {
                console.error("Failed to fetch article details", err);
            }
        };

        if (articleId) {
            fetchArticle();
        }
    }, [articleId]);

    const handleUpdateElement = (id: string, updates: Partial<EditorElement>) => {
        // Prevent updates if locked (unless we implement unlock feature later, but 'locked' usually means read-only)
        const el = elements.find(e => e.id === id);
        if (el?.locked) return;

        const newElements = elements.map((el) => (el.id === id ? { ...el, ...updates } : el));
        setElements(newElements);
    };

    const handleSetBackground = (id: string) => {
        // ... (existing logic needs update to preserve pageIndex)
        const elIndex = elements.findIndex(e => e.id === id);
        if (elIndex === -1) return;

        const el = elements[elIndex];
        const others = elements.filter(e => e.id !== id);

        const bgElement: EditorElement = {
            ...el,
            x: 0,
            y: 0,
            width: 794,
            height: 1123,
            style: { ...el.style, zIndex: -1 }
        };
        // Preserves existing pageIndex automatically since we spread ...el (actually above spread overrides, so it's fine)
        setElements([bgElement, ...others]);
    };

    const handleDelete = (id: string) => {
        const el = elements.find(e => e.id === id);
        if (el?.locked) return; // Cannot delete locked elements
        setElements(elements.filter(e => e.id !== id));
        setSelectedId(null);
    };

    const handleLayerChange = (id: string, direction: 'up' | 'down') => {
        const index = elements.findIndex(e => e.id === id);
        if (index === -1) return;

        const newElements = [...elements];
        if (direction === 'up' && index < elements.length - 1) {
            [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
        } else if (direction === 'down' && index > 0) {
            [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
        }
        setElements(newElements);
    };

    const handleExport = async () => {
        // Dynamic import to avoid SSR issues if any
        const html2canvas = (await import("html2canvas")).default;
        const jsPDF = (await import("jspdf")).default;

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < pageCount; i++) {
            const element = document.getElementById(`mag-canvas-${i}`);
            if (!element) continue;

            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/png");

            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        }

        pdf.save(`design-${articleId}.pdf`);
    };

    const handleAddElement = (type: "text" | "image" | "shape", contentOverride?: string, styleOverride?: React.CSSProperties, targetPageIndex: number = 0) => {
        const newEl: EditorElement = {
            id: Date.now().toString(),
            type,
            content: contentOverride || (type === "text" ? "Type here..." : "/images/placeholder.jpg"),
            x: styleOverride?.x !== undefined ? Number(styleOverride.x) : 200,
            y: styleOverride?.y !== undefined ? Number(styleOverride.y) : 200,
            width: styleOverride?.width !== undefined ? Number(styleOverride.width) : (type === "text" ? 300 : 200),
            height: styleOverride?.height !== undefined ? Number(styleOverride.height) : (type === "text" ? 50 : 200),
            rotation: 0,
            pageIndex: targetPageIndex,
            style: {
                ...(type === "text"
                    ? { fontSize: "24px", color: "#000", fontFamily: "Inter" }
                    : { backgroundColor: type === "shape" ? (contentOverride && contentOverride.startsWith("#") ? contentOverride : "#6366f1") : "transparent" }
                ),
                ...styleOverride
            },
        };

        if (styleOverride?.zIndex === -1) {
            setElements([newEl, ...elements]);
        } else {
            setElements([...elements, newEl]);
        }
        setSelectedId(newEl.id);
    };

    const handleAddPage = () => {
        const newPageIndex = pageCount; // current count is the new index (0-indexed)
        setPageCount(prev => prev + 1);

        // --- ADD LOCKED FOOTER ELEMENTS ---
        const footerY = 1080; // Near bottom of 1123px height

        // 1. MindRadix Branding
        const brandEl: EditorElement = {
            id: `footer-brand-${newPageIndex}`,
            type: "text",
            content: "MindRadix",
            x: 40,
            y: footerY,
            width: 150,
            height: 30,
            rotation: 0,
            pageIndex: newPageIndex,
            locked: true,
            style: {
                fontSize: "14px",
                fontFamily: "Inter",
                fontWeight: "bold",
                color: "#4e7ba8" // Brand Blue
            }
        };

        // 2. Edition Name
        const editionEl: EditorElement = {
            id: `footer-edition-${newPageIndex}`,
            type: "text",
            content: coverData.edition || "EDITION 2025",
            x: 350,
            y: footerY,
            width: 200,
            height: 30,
            rotation: 0,
            pageIndex: newPageIndex,
            locked: true, // User said "edition name", assuming they want it standardized from cover
            style: {
                fontSize: "12px",
                fontFamily: "Inter",
                color: "#64748b",
                textAlign: "center"
            }
        };

        // 3. Page Number
        const pageNumEl: EditorElement = {
            id: `footer-page-${newPageIndex}`,
            type: "text",
            content: `Page ${newPageIndex + 1}`, // +1 because Cover is Page 1? Or Cover is 0? Let's say Cover is Page 1 visually, but usually unsynced. Let's stick to true count.
            x: 700,
            y: footerY,
            width: 80,
            height: 30,
            rotation: 0,
            pageIndex: newPageIndex,
            locked: true,
            style: {
                fontSize: "12px",
                fontFamily: "Inter",
                color: "#64748b",
                textAlign: "right"
            }
        };

        setElements([...elements, brandEl, editionEl, pageNumEl]);

        // Scroll to new page?
        setTimeout(() => {
            document.getElementById(`mag-canvas-${newPageIndex}`)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSave = async (showToast = true) => {
        try {
            const designData = {
                elements,
                coverData,
                pageCount,
                scale // Optional to save view state
            };

            const res = await putJSON(`/content/${articleId}/design`, {
                designData,
                pages: pageCount
            });

            if (showToast) {
                if (res.status === 'success') {
                    // alert("Saved successfully!");
                    // Better to use a toast if available
                    console.log("Saved successfully");
                    toast.success("Design saved successfully");
                } else {
                    console.error("Save failed", res);
                    toast.error("Failed to save design");
                }
            }
            return true;
        } catch (err) {
            console.error("Save error", err);
            toast.error("Error saving design");
            return false;
        }
    };

    const handleSubmit = async () => {
        if (!confirm("Are you sure you want to submit this design for review? You may not be able to edit it afterwards.")) {
            return;
        }

        const saved = await handleSave(false);
        if (!saved) return;

        try {
            const designData = {
                elements,
                coverData,
                pageCount
            };

            const res = await postJSON(`/content/${articleId}/submit-design`, {
                designData
            });

            if (res.status === 'success') {
                toast.success("Design submitted successfully! Redirecting...");
                setTimeout(() => router.push('/editor-dashboard'), 1500);
            } else {
                toast.error("Submission failed: " + (res.message || "Unknown error"));
            }
        } catch (err) {
            console.error("Submit error", err);
            toast.error("Failed to submit design");
        }
    };

    const getContentChunks = () => {
        if (typeof window === 'undefined' || !articleData.body) return [];
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(articleData.body, 'text/html');
            const chunks: { label: string, content: string }[] = [];

            Array.from(doc.body.childNodes).forEach((node) => {
                const text = node.textContent?.trim();
                if (text) {
                    let label = 'Paragraph';
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const tagName = (node as HTMLElement).tagName.toLowerCase();
                        if (tagName.startsWith('h')) label = `Heading ${tagName.replace('h', '')}`;
                        else if (tagName === 'blockquote') label = 'Quote';
                        else if (tagName === 'ul' || tagName === 'ol') label = 'List';
                    }
                    chunks.push({ label, content: text });
                }
            });

            // If parsing failed to produce chunks (e.g. plain text), fallback
            if (chunks.length === 0 && articleData.body.trim()) {
                return [{ label: "Article Body", content: articleData.body }];
            }
            return chunks;
        } catch (e) {
            return [{ label: "Article Body", content: articleData.body }];
        }
    };

    return (
        <div className={`flex flex-col bg-slate-50 text-slate-900 ${className || 'h-screen'}`}>
            {/* Header ... */}
            <header className="h-16 border-b bg-white flex items-center justify-between px-4 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    {!readOnly && (
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div>
                        <h1 className="font-bold text-sm">{readOnly ? "Review Design" : "Untitled Design"}</h1>
                        <p className="text-xs text-slate-500">A4 • {pageCount} Pages {readOnly ? "(Read Only)" : ""}</p>
                    </div>
                </div>

                {!readOnly && (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}><RotateCcw className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}><RotateCw className="h-4 w-4" /></Button>
                        <div className="w-px h-6 bg-slate-200 mx-2" />
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">{Math.round(scale * 100)}%</span>
                    <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.2, s - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(3, s + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
                </div>

                <div className="flex items-center gap-3">
                    {!readOnly ? (
                        <>
                            <Button variant="outline" size="sm" onClick={handleAddPage}>
                                + Add Page
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleSave()}>
                                <Save className="h-4 w-4 mr-2" /> Save
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/editor-dashboard/preview/${articleId}`)}>
                                <Eye className="h-4 w-4" /> Preview
                            </Button>
                            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white gap-2" size="sm">
                                Submit for Review
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleExport} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2" size="sm">
                            <Download className="h-4 w-4" /> Export PDF
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left Toolbar - Hide if ReadOnly */}
                {!readOnly && (
                    <Toolbar
                        onAdd={(t, c, s) => handleAddElement(t as any, c, s, 1)}
                        contentSuggestions={[
                            { label: "Article Title", content: articleData.title },
                            { label: "Author(s)", content: articleData.author },
                            { label: "Abstract", content: articleData.abstract },
                            { label: "ISSN", content: articleData.issn },
                            { label: "Volume Info", content: articleData.volume },
                            ...getContentChunks()
                        ]}
                        attachments={attachments}
                    />
                )}

                {/* Center Canvas Area - Render Multiple Pages */}
                <div className={`flex-1 bg-slate-200 overflow-auto relative flex flex-col items-center pt-8 pb-32 gap-0 ${readOnly ? '' : 'cursor-grab active:cursor-grabbing'}`}>
                    {Array.from({ length: pageCount }).map((_, pageIndex) => (
                        <div key={pageIndex} className="relative group mb-8">
                            {/* Page Label */}
                            <div className="absolute -left-32 top-0 text-xs text-slate-400 font-medium pt-2 w-24 text-right">
                                {pageIndex === 0 ? "Cover" : `Page ${pageIndex}`}
                            </div>

                            {/* RENDER COVER PAGE EDITOR FOR PAGE 0 */}
                            {pageIndex === 0 ? (
                                <CoverPageEditor
                                    data={coverData}
                                    onChange={readOnly ? () => { } : setCoverData} // Disable edits
                                    scale={scale}
                                />
                            ) : (
                                <Canvas
                                    id={`mag-canvas-${pageIndex}`}
                                    elements={elements.filter(el => (el.pageIndex ?? 0) === pageIndex)}
                                    // Pass readOnly to Canvas to disable drag/resize
                                    // We'll assume Canvas handles 'selectedId=null' gracefully if we don't allow selection
                                    selectedId={readOnly ? null : selectedId}
                                    onSelect={readOnly ? () => { } : setSelectedId}
                                    onUpdate={readOnly ? () => { } : handleUpdateElement}
                                    onDelete={readOnly ? () => { } : handleDelete}
                                    onLayerChange={handleLayerChange}
                                    onSetBackground={handleSetBackground}
                                    onDoubleClick={(x: number, y: number) => !readOnly && handleAddElement("text", "Text", { x, y, width: 150, height: 30, fontSize: "16px" }, pageIndex)}
                                    onDropItem={(type, content, x, y) => !readOnly && handleAddElement(type as any, content, { x, y }, pageIndex)}
                                    scale={scale}
                                />
                            )}
                        </div>
                    ))}

                    {/* Add Page Button at bottom - Hide in ReadOnly */}
                    {!readOnly && (
                        <div className="pb-20">
                            <Button variant="outline" className="w-[794px] h-32 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:text-slate-600 hover:border-slate-400" style={{ width: 794 * scale }} onClick={handleAddPage}>
                                + Add Page
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Properties Panel - Hide in ReadOnly */}
                {!readOnly && (
                    <PropertiesPanel
                        element={elements.find(e => e.id === selectedId) || null}
                        onUpdate={(updates: Partial<EditorElement>) => selectedId && handleUpdateElement(selectedId, updates)}
                        onSetBackground={() => selectedId && handleSetBackground(selectedId)}
                    />
                )}

            </div>
        </div>
    );
}
