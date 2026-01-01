"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, UploadCloud, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api";

interface SimpleImageUploadProps {
    articleId: string;
    onUploadComplete: (url: string) => void;
    label?: string;
    className?: string;
}

export default function SimpleImageUpload({ articleId, onUploadComplete, label = "Upload", className }: SimpleImageUploadProps) {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("ACCESS_TOKEN");
        // Remove trailing slash if present

        const apiBase = API_BASE;

        try {
            const res = await fetch(`${apiBase}/author/articles/${articleId}/attachments`, {
                method: "POST",
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.status === 'success') {
                let uploadedUrl = data.data?.attachment?.public_url || data.data?.public_url;

                // If no direct public_url, construct the API download URL (using apiBase to ensure port 5000)
                if (!uploadedUrl && data.data?.attachmentId) {
                    uploadedUrl = `${apiBase}/author/articles/${articleId}/attachments/${data.data.attachmentId}`;
                }

                if (uploadedUrl) {
                    onUploadComplete(uploadedUrl);
                    toast.success("Image uploaded!");
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
            // Reset input
            e.target.value = "";
        }
    };

    return (
        <div className={className}>
            <input
                type="file"
                accept="image/*"
                className="hidden"
                id={`upload-${label}`}
                onChange={handleFileChange}
                disabled={uploading}
            />
            <label htmlFor={`upload-${label}`}>
                <Button variant="outline" size="sm" className="cursor-pointer" asChild disabled={uploading}>
                    <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? "Uploading..." : label}
                    </span>
                </Button>
            </label>
        </div>
    );
}
