"use client";

import { Type, Image as ImageIcon, Square, Upload, LayoutTemplate, Palette, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";

type ToolbarProps = {
    onAdd: (type: "text" | "image" | "shape", content?: string, style?: any) => void;
    contentSuggestions: { label: string, content: string }[];
    attachments?: { id: string, filename: string, public_url: string, mime_type: string }[];
};

export function Toolbar({ onAdd, contentSuggestions, attachments }: ToolbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<string | null>(null);

    const toggleTab = (tab: string) => {
        setActiveTab(activeTab === tab ? null : tab);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onAdd("image", url);
        }
    };

    return (
        <div className="flex h-full relative z-40">
            {/* Main Icons Rail */}
            <div className="w-20 border-r bg-white flex flex-col items-center py-4 gap-4 shrink-0 shadow-sm z-50">
                <ToolButton icon={Type} label="Text" active={activeTab === "text"} onClick={() => toggleTab("text")} />
                <ToolButton icon={FileText} label="Content" active={activeTab === "content"} onClick={() => toggleTab("content")} />
                <ToolButton icon={ImageIcon} label="Image" active={activeTab === "image"} onClick={() => toggleTab("image")} />
                <ToolButton icon={Square} label="Elements" onClick={() => onAdd("shape")} />
                <ToolButton icon={Palette} label="Bkground" active={activeTab === "bg"} onClick={() => toggleTab("bg")} />
            </div>

            {/* Side Drawer */}
            {activeTab && (
                <div className="w-72 bg-slate-50 border-r flex flex-col h-full animate-in slide-in-from-left-10 duration-200 absolute left-20 top-0 bottom-0 shadow-xl z-40">
                    <div className="flex items-center justify-between p-4 border-b bg-white">
                        <h3 className="font-bold text-sm capitalize">{activeTab}</h3>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveTab(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">

                        {/* TEXT DRAWER */}
                        {activeTab === "text" && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500 font-medium">Click to add text</p>
                                <div
                                    className="p-4 bg-white border rounded hover:border-indigo-500 cursor-pointer transition-all"
                                    onClick={() => onAdd("text", "Add a heading", { fontSize: "42px", fontWeight: "bold" })}
                                >
                                    <h1 className="text-2xl font-bold">Add a heading</h1>
                                </div>
                                <div
                                    className="p-4 bg-white border rounded hover:border-indigo-500 cursor-pointer transition-all"
                                    onClick={() => onAdd("text", "Add a subheading", { fontSize: "28px", fontWeight: "medium" })}
                                >
                                    <h2 className="text-lg font-medium">Add a subheading</h2>
                                </div>
                                <div
                                    className="p-3 bg-white border rounded hover:border-indigo-500 cursor-pointer transition-all"
                                    onClick={() => onAdd("text", "Add a little bit of body text", { fontSize: "16px", fontWeight: "normal" })}
                                >
                                    <p className="text-sm">Add a little bit of body text</p>
                                </div>
                            </div>
                        )}

                        {/* CONTENT DRAWER */}
                        {activeTab === "content" && (
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium mb-2">Article Metadata</p>
                                    <div className="space-y-2">
                                        {contentSuggestions.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 bg-white border rounded-lg shadow-sm hover:border-indigo-500 hover:shadow-md cursor-grab active:cursor-grabbing transition-all active:scale-95 group"
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData("application/json", JSON.stringify({ type: "text", content: item.content }));
                                                    e.dataTransfer.effectAllowed = "copy";
                                                }}
                                                onClick={() => onAdd("text", item.content)}
                                            >
                                                <span className="text-[10px] uppercase font-bold text-indigo-500 mb-1 block group-hover:text-indigo-600">{item.label}</span>
                                                <p className="text-xs text-slate-700 line-clamp-3 font-medium">{item.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* LIST DOCUMENTS/ATTACHMENTS */}
                                {attachments && attachments.length > 0 && (
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium mb-2">Attached Documents</p>
                                        <div className="space-y-2">
                                            {attachments.map((att) => (
                                                <div
                                                    key={att.id}
                                                    className="p-3 bg-slate-100 rounded border flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-indigo-50 hover:border-indigo-300"
                                                    draggable
                                                    onDragStart={(e) => {
                                                        const isImage = att.mime_type?.startsWith('image/') || att.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                                        const type = isImage ? "image" : "text";
                                                        const content = isImage ? att.public_url : `[Document: ${att.filename}]`;
                                                        e.dataTransfer.setData("application/json", JSON.stringify({ type, content }));
                                                        e.dataTransfer.effectAllowed = "copy";
                                                    }}
                                                    onClick={() => {
                                                        // If image, add as image
                                                        if (att.mime_type?.startsWith('image/') || att.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                                                            onAdd("image", att.public_url);
                                                        } else {
                                                            // If doc, maybe just add a text citation or link? 
                                                            // For now, let's treat it as adding a text block with filename
                                                            onAdd("text", `[Document: ${att.filename}]`);
                                                        }
                                                    }}
                                                >
                                                    {att.mime_type?.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-indigo-500" /> : <FileText className="h-4 w-4 text-slate-500" />}
                                                    <span className="text-xs truncate">{att.filename}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* IMAGE DRAWER */}
                        {activeTab === "image" && (
                            <div className="space-y-4">
                                <Button className="w-full gap-2" onClick={handleUploadClick}>
                                    <Upload className="h-4 w-4" /> Upload Image
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />

                                <div className="border-t pt-4">
                                    <p className="text-xs text-slate-500 font-medium mb-3">Stock Images (Demo)</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className="aspect-square bg-slate-200 rounded overflow-hidden cursor-grab active:cursor-grabbing hover:opacity-90"
                                                draggable
                                                onDragStart={(e) => {
                                                    const url = `https://picsum.photos/300/300?random=${i}`;
                                                    e.dataTransfer.setData("application/json", JSON.stringify({ type: "image", content: url }));
                                                    e.dataTransfer.effectAllowed = "copy";
                                                }}
                                                onClick={() => onAdd("image", `https://picsum.photos/300/300?random=${i}`)}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={`https://picsum.photos/300/300?random=${i}`} alt="Stock" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BACKGROUND DRAWER */}
                        {activeTab === "bg" && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500 font-medium">Solid Colors</p>
                                <div className="flex flex-wrap gap-2">
                                    {["#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#000000", "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#f43f5e"].map(color => (
                                        <div
                                            key={color}
                                            className="w-10 h-10 rounded-full border cursor-pointer hover:scale-110 transition-transform shadow-sm"
                                            style={{ backgroundColor: color }}
                                            onClick={() => onAdd("shape", color, { zIndex: -1, width: 794, height: 1123, x: 0, y: 0 })}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}

function ToolButton({ icon: Icon, label, onClick, active }: { icon: any, label: string, onClick: () => void, active?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}
        >
            <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-transparent' : 'bg-slate-100 group-hover:bg-indigo-50'}`}>
                <Icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    )
}
