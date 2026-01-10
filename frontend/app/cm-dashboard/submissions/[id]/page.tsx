"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Calendar, Tag, CheckCircle2, Clock } from "lucide-react";
import { getJSON, postJSON } from "@/lib/api";

export default function SubmissionDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            const res = await getJSON(`/content-manager/submissions/${id}`);
            setData(res.data);
        } catch (error) {
            console.error("Failed to fetch details", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (!data) return <div className="p-6">Submission not found</div>;

    const { article, timeline } = data;

    return (
        <main className="px-6 py-8 max-w-5xl mx-auto space-y-8">
            {/* HEADER */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-4"
                >
                    <ArrowLeft size={16} className="mr-1" /> Back
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{article.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                                <User size={14} /> {article.author}
                            </span>
                            <span className="flex items-center gap-1">
                                <Tag size={14} /> {article.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(article.status)}`}>
                                {article.status.toUpperCase().replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push(`/cm-dashboard/review-design/${article.id}`)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Tag size={16} /> Review Design
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* TIMELINE */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-6">Workflow Timeline</h2>
                    <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-8 pb-4">
                        {timeline.map((event: any, index: number) => (
                            <div key={index} className="relative pl-8">
                                {/* Dot */}
                                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${event.step === 'PUBLISHED' ? 'bg-purple-600' :
                                    event.step.includes('APPROVED') ? 'bg-green-600' :
                                        'bg-indigo-600'
                                    }`}></div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                    <span className={`font-bold text-sm ${event.step === 'PUBLISHED' ? 'text-purple-700' : 'text-indigo-700'
                                        }`}>
                                        {event.step}
                                    </span>
                                    <span className="flex items-center text-xs text-slate-400">
                                        <Clock size={12} className="mr-1" />
                                        {(() => {
                                            if (!event.date) return 'N/A';
                                            const d = new Date(event.date);
                                            return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleString();
                                        })()}
                                    </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-sm">
                                    {event.description}
                                </p>
                            </div>
                        ))}

                        {timeline.length === 0 && (
                            <div className="pl-8 text-slate-400 text-sm">No history available.</div>
                        )}
                    </div>
                </div>

                {/* DETAILS SIDEBAR */}
                <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl h-fit border">
                        <h3 className="font-semibold mb-4">Submission Details</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <span className="block text-slate-500 text-xs uppercase mb-1">Author</span>
                                <span>{article.author}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500 text-xs uppercase mb-1">Category</span>
                                <span>{article.category}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500 text-xs uppercase mb-1">Article ID</span>
                                <span className="font-mono text-xs">{article.id}</span>
                            </div>
                        </div>
                    </div>

                    {/* ATTACHMENTS */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl h-fit border shadow-sm">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Tag size={16} className="text-indigo-600" /> Attachments
                        </h3>
                        {data.attachments && data.attachments.length > 0 ? (
                            <ul className="space-y-3">
                                {data.attachments.map((file: any) => (
                                    <li key={file.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-900 rounded border">
                                        <div className="truncate max-w-[140px]" title={file.filename}>
                                            {file.filename}
                                        </div>
                                        <a
                                            href={file.public_url || '#'}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-indigo-600 font-medium hover:underline"
                                        >
                                            View
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 italic">No files attached.</p>
                        )}
                    </div>
                </div>

            </div>
        </main>
    );
}

function getStatusStyle(status: string) {
    const styles: any = {
        submitted: "bg-yellow-100 text-yellow-700 border-yellow-200",
        under_review: "bg-blue-100 text-blue-700 border-blue-200",
        changes_requested: "bg-orange-100 text-orange-700 border-orange-200",
        approved: "bg-green-100 text-green-700 border-green-200",
        published: "bg-purple-100 text-purple-700 border-purple-200",
        rejected: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[status] || "bg-slate-100 text-slate-700";
}
