"use client";

import { MagEditor } from "@/components/mag-editor/MagEditor";
import { useParams } from "next/navigation";

export default function ReviewDesignPage() {
    const params = useParams();
    const articleId = params.articleId as string;

    return (
        <div className="h-screen w-full bg-slate-100 overflow-hidden">
            {/* 
                Reusing MagEditor. 
                Ideally, we might want a 'readOnly' prop or 'reviewMode' prop 
                to disable editing or show review tools. 
                For now, full access allows CM to make final tweaks if needed. 
            */}
            <MagEditor articleId={articleId} readOnly={true} />
        </div>
    );
}
