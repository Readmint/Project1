"use client";

import { useState, useRef } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CoverPageData = {
    edition: string;
    website: string;
    price: string;
    volIssue: string;
    reviewTitle: string; // NEW field
    mainTitle: string;
    subTitle: string;
    heroImage: string;
    articles: {
        category: string;
        title: string;
        description?: string;
        image?: string;
    }[];
};

interface CoverPageEditorProps {
    data: CoverPageData;
    onChange: (data: CoverPageData) => void;
    scale: number;
    readOnly?: boolean;
}

export function CoverPageEditor({ data, onChange, scale, readOnly }: CoverPageEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeUploadIndex, setActiveUploadIndex] = useState<number | null>(null); // -1 for Hero, 0-2 for articles

    const updateField = (field: keyof CoverPageData, value: any) => {
        if (readOnly) return;
        onChange({ ...data, [field]: value });
    };

    const updateArticle = (index: number, field: string, value: string) => {
        if (readOnly) return;
        const newArticles = [...data.articles];
        newArticles[index] = { ...newArticles[index], [field]: value };
        onChange({ ...data, articles: newArticles });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeUploadIndex !== null) {
            const url = URL.createObjectURL(file); // In real app, upload to server
            if (activeUploadIndex === -1) {
                updateField("heroImage", url);
            } else {
                updateArticle(activeUploadIndex, "image", url);
            }
            setActiveUploadIndex(null);
        }
    };

    const triggerUpload = (index: number) => {
        if (readOnly) return;
        setActiveUploadIndex(index);
        fileInputRef.current?.click();
    };

    // A4 Dimensions: 210mm x 297mm. Approx 794px x 1123px at 96 DPI
    const width = 794;
    const height = 1123;

    return (
        <div
            id="mag-canvas-0"
            className="bg-white shadow-lg relative shrink-0 overflow-hidden select-none"
            style={{
                width: width * scale,
                height: height * scale,
                transformOrigin: "top left",
            }}
        >
            <div
                className="w-full h-full flex flex-col relative"
                style={{
                    width: width,
                    height: height,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                }}
            >
                {/* 1. TOP BAR */}
                <div className="h-10 bg-[#4e7ba8] text-white flex items-center justify-between px-8 text-xs font-bold uppercase tracking-wider z-20">
                    <input
                        value={data.edition}
                        onChange={(e) => updateField("edition", e.target.value)}
                        className="bg-transparent border-none text-white placeholder-white/70 focus:outline-none w-48 uppercase"
                        readOnly={readOnly}
                    />
                    <span className="opacity-80 select-none">WWW.MINDRADIX.COM</span>
                    <input
                        value={data.price}
                        onChange={(e) => updateField("price", e.target.value)}
                        className="bg-transparent border-none text-white text-right w-24 focus:outline-none"
                        readOnly={readOnly}
                    />
                </div>

                {/* 2. HEADER LOGO SECTION */}
                <div className="h-24 bg-[#fdfbf7] flex items-center justify-between px-8 z-20 border-b-4 border-red-500">
                    <div className="flex items-center gap-3 select-none">
                        {/* Mock Logo Icon */}
                        <div className="relative w-12 h-12">
                            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-[#4e7ba8]" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div className="flex flex-col transform -translate-y-1">
                            <h1 className="text-5xl font-extrabold tracking-tighter text-[#c93a3a]">
                                Mind<span className="text-[#4e7ba8]">Radix</span>
                            </h1>
                        </div>
                    </div>
                    <div className="text-right text-[#4e7ba8]">
                        <input
                            value={data.reviewTitle || "ECONOMICS REVIEW"}
                            onChange={(e) => updateField("reviewTitle", e.target.value)}
                            className="bg-transparent border-none text-[#4e7ba8] text-right w-full text-sm font-bold uppercase tracking-widest focus:outline-none"
                            readOnly={readOnly}
                        />
                        <input
                            value={data.volIssue}
                            onChange={(e) => updateField("volIssue", e.target.value)}
                            className="bg-transparent border-none text-[#4e7ba8] text-right w-full text-xs mt-1 focus:outline-none"
                            readOnly={readOnly}
                        />
                    </div>
                </div>

                {/* 3. HERO SECTION */}
                <div className="relative flex-1 bg-slate-200 overflow-hidden group">
                    {data.heroImage ? (
                        <img src={data.heroImage} className="absolute inset-0 w-full h-full object-cover" alt="Cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                            <ImageIcon size={64} />
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* Editor Upload Button */}
                    {!readOnly && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                            onClick={() => triggerUpload(-1)}
                        >
                            <Upload className="h-4 w-4 mr-2" /> Change Cover
                        </Button>
                    )}

                    {/* Main Title Text */}
                    <div className="absolute bottom-12 left-8 right-8 text-white z-10">
                        <div className="mb-4">
                            <span className="bg-[#ef4444] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">
                                Cover Story
                            </span>
                        </div>
                        <textarea
                            value={data.mainTitle}
                            onChange={(e) => updateField("mainTitle", e.target.value)}
                            className="w-full bg-transparent border-none text-white text-7xl font-bold font-serif leading-tight focus:outline-none resize-none overflow-hidden placeholder-white/50"
                            rows={2}
                            readOnly={readOnly}
                        />
                        <textarea
                            value={data.subTitle}
                            onChange={(e) => updateField("subTitle", e.target.value)}
                            className="w-full bg-transparent border-none text-white/90 text-xl mt-4 font-light focus:outline-none resize-none placeholder-white/50"
                            rows={2}
                            readOnly={readOnly}
                        />
                    </div>
                </div>

                {/* 4. FOOTER / INSIDE ISSUE */}
                <div className="h-64 bg-white px-8 py-6 flex flex-col justify-between border-t border-slate-200">
                    <div>
                        <h3 className="text-[#4e7ba8] font-bold uppercase tracking-widest text-sm mb-4 border-b border-slate-200 pb-2">Inside This Issue</h3>
                        <div className="grid grid-cols-3 gap-6">
                            {data.articles.map((article, idx) => (
                                <div key={idx} className="flex gap-3 group relative">
                                    {/* Image Thumbnail */}
                                    <div
                                        className="w-20 h-16 bg-slate-100 shrink-0 overflow-hidden relative cursor-pointer"
                                        onClick={() => triggerUpload(idx)}
                                    >
                                        {article.image ? (
                                            <img src={article.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <ImageIcon size={16} />
                                            </div>
                                        )}
                                        {!readOnly && <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs">Edit</div>}
                                    </div>

                                    <div className="flex flex-col">
                                        <input
                                            value={article.category}
                                            onChange={(e) => updateArticle(idx, "category", e.target.value)}
                                            className="uppercase text-[#ef4444] text-[10px] font-bold bg-transparent border-none p-0 focus:outline-none w-full"
                                            readOnly={readOnly}
                                        />
                                        <textarea
                                            value={article.title}
                                            onChange={(e) => updateArticle(idx, "title", e.target.value)}
                                            className="font-serif font-bold text-slate-900 text-sm leading-tight bg-transparent border-none p-0 focus:outline-none resize-none w-full mt-1"
                                            rows={2}
                                            readOnly={readOnly}
                                        />
                                        {/* Optional Desc */}
                                        {/* <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">description...</p> */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Footer Details */}
                    <div className="flex items-end justify-between mt-4 pt-4 border-t border-slate-100">
                        {/* Fake Barcode */}
                        <div className="flex flex-col gap-1">
                            <div className="h-8 w-32 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/UPC-A-036000291452.svg/1200px-UPC-A-036000291452.svg.png')] bg-cover opacity-80 mix-blend-multiply grayscale"></div>
                            <span className="text-[10px] text-slate-400 font-mono tracking-widest pl-1">9 772025 987001</span>
                        </div>

                        <div className="text-right">
                            <h4 className="text-[#4e7ba8] font-bold text-sm">MindRadix Publications</h4>
                            <p className="text-[10px] text-slate-500">Inspiring Minds, Rooting Knowledge.</p>
                        </div>
                    </div>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>
        </div>
    );
}
