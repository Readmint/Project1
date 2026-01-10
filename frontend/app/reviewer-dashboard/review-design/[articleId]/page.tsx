"use client";

import { MagEditor } from "@/components/mag-editor/MagEditor";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ReviewerDesignPage() {
    const params = useParams();
    const router = useRouter();
    const articleId = params.articleId as string;

    return (
        <div className="h-screen w-full bg-slate-100 flex flex-col overflow-hidden">
            <div className="bg-white border-b px-4 py-2 flex items-center gap-4 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft size={16} /> Back to Feedback
                </Button>
                <div>
                    <h1 className="font-semibold text-sm">Design Review Mode</h1>
                    <p className="text-xs text-muted-foreground">View-only access to the designed article.</p>
                </div>
            </div>
            <div className="flex-1 relative">
                <MagEditor articleId={articleId} readOnly={true} />
            </div>
        </div>
    );
}
