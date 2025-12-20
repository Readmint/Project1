"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageInsertDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInsert: (url: string, width?: string) => void;
    articleId: string;
}

export default function ImageInsertDialog({ open, onOpenChange, onInsert, articleId }: ImageInsertDialogProps) {
    const [activeTab, setActiveTab] = useState("upload");
    const [url, setUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [width, setWidth] = useState("100%");

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("ACCESS_TOKEN");
        if (!token) {
            toast.error("You are not logged in");
            setUploading(false);
            return;
        }

        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

        try {
            // Reuse existing attachment endpoint which returns public/signed URL
            const res = await fetch(`${apiBase}/author/articles/${articleId}/attachments`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.status === 'success') {
                // The endpoint returns { status: 'success', data: { attachment: { ..., public_url: ... } } }
                // Or check the root data object depending on controller structure
                let uploadedUrl = data.data?.attachment?.public_url || data.data?.public_url;

                // Fallback construction if public_url is missing
                if (!uploadedUrl && data.data?.attachmentId) {
                    uploadedUrl = `${apiBase}/author/articles/${articleId}/attachments/${data.data.attachmentId}`;
                }

                if (uploadedUrl) {
                    onInsert(uploadedUrl, width);
                    onOpenChange(false);
                    setFile(null);
                } else {
                    toast.error("Upload successful but URL missing.");
                }
            } else {
                throw new Error(data.message || "Upload failed");
            }
        } catch (err: any) {
            console.error(err);
            toast.error("Upload failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleUrlInsert = () => {
        if (!url) return;
        onInsert(url);
        onOpenChange(false);
        setUrl("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Insert Image</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                        <TabsTrigger value="url">From URL</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-4 py-4">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg h-32 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <Upload className="h-8 w-8 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500">
                                {file ? file.name : "Click to upload or drag and drop"}
                            </p>
                        </div>

                        <div className="space-y-2 mt-4">
                            <Label>Image Size</Label>
                            <div className="flex gap-2">
                                {["25%", "50%", "75%", "100%"].map((w) => (
                                    <Button
                                        key={w}
                                        variant={width === w ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setWidth(w)}
                                    >
                                        {w}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button onClick={handleUpload} disabled={!file || uploading}>
                                {uploading ? "Uploading..." : "Insert Image"}
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="url" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">Image URL</Label>
                            <Input
                                id="url"
                                placeholder="https://example.com/image.jpg"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Image Size</Label>
                            <div className="flex gap-2">
                                {["25%", "50%", "75%", "100%"].map((w) => (
                                    <Button
                                        key={w}
                                        variant={width === w ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setWidth(w)}
                                    >
                                        {w}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={() => {
                                if (url) {
                                    onInsert(url, width);
                                    onOpenChange(false);
                                    setUrl("");
                                }
                            }} disabled={!url}>
                                Insert Image
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
