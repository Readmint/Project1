"use client";

import { MagEditor } from "@/components/mag-editor/MagEditor";
import { useParams } from "next/navigation";

export default function DesignPage() {
    const params = useParams();
    const articleId = params.articleId as string;

    return (
        <div className="h-screen w-full bg-slate-100 overflow-hidden">
            <MagEditor articleId={articleId} />
        </div>
    );
}
