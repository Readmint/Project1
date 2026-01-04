"use client";

import { useState, useEffect } from "react";
import { getJSON, postJSON } from "@/lib/api";
import { toast } from "sonner";
import { Send, DollarSign, Loader2, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

interface PublishableArticle {
    id: string;
    title: string;
    author: string;
    category_name: string;
    created_at: string;
}

export default function PublishPage() {
    const [queue, setQueue] = useState<PublishableArticle[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection
    const [selectedArticle, setSelectedArticle] = useState<PublishableArticle | null>(null);
    const [isFree, setIsFree] = useState(true);
    const [price, setPrice] = useState("0.00");
    const [publishing, setPublishing] = useState(false);

    // New Fields
    const [volume, setVolume] = useState("");
    const [issue, setIssue] = useState("");
    const [publicationType, setPublicationType] = useState("Journal");

    useEffect(() => {
        loadQueue();
    }, []);

    const loadQueue = async () => {
        try {
            const res = await getJSON("/content-manager/publishing/queue");
            if (res.status === "success") {
                setQueue(res.data);
            }
        } catch (e) {
            toast.error("Failed to load publishing queue");
        } finally {
            setLoading(false);
        }
    };

    const handlePublishClick = (article: PublishableArticle) => {
        setSelectedArticle(article);
        setIsFree(true);
        setPrice("0.00");
        // Reset defaults
        setVolume("");
        setIssue("");
        setPublicationType("Journal");
    };

    const confirmPublish = async () => {
        if (!selectedArticle) return;
        setPublishing(true);

        try {
            const payload = {
                articleId: selectedArticle.id,
                isFree,
                price: isFree ? 0 : parseFloat(price),
                volume,
                issue,
                publicationType
            };

            const res = await postJSON("/content-manager/publishing/publish", payload);

            if (res.status === "success") {
                toast.success("Article published successfully!");
                setQueue((prev) => prev.filter((a) => a.id !== selectedArticle.id));
                setSelectedArticle(null);
            } else {
                toast.error(res.message || "Failed to publish");
            }
        } catch (e) {
            toast.error("An error occurred during publication");
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Send className="text-indigo-600" />
                    Final Publication Queue
                </h1>
                <p className="text-muted-foreground mt-1">
                    Review approved articles and release them to the public reader platform.
                </p>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                </div>
            ) : queue.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium">All Caught Up!</h3>
                    <p className="text-muted-foreground">No approved articles waiting for publication.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {queue.map((article) => (
                        <div
                            key={article.id}
                            className="bg-card border border-border p-5 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
                                        Approved
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(article.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-lg">{article.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <FileText size={14} /> {article.category_name || "General"}
                                    </span>
                                    <span>by <span className="text-foreground font-medium">{article.author}</span></span>
                                </div>
                            </div>

                            <Button
                                onClick={() => handlePublishClick(article)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
                            >
                                Publish Now
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* PUBLISH DIALOG */}
            <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Publish Article</DialogTitle>
                        <DialogDescription>
                            Configure details for <strong>{selectedArticle?.title}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Publication Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Publication Type</label>
                            <select
                                className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={publicationType}
                                onChange={(e) => setPublicationType(e.target.value)}
                            >
                                <option value="Journal">Journal</option>
                                <option value="Magazine">Magazine</option>
                                <option value="Book">Book</option>
                                <option value="Research Paper">Research Paper</option>
                            </select>
                        </div>

                        {/* Volume & Issue */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Volume</label>
                                <input
                                    type="text"
                                    value={volume}
                                    onChange={(e) => setVolume(e.target.value)}
                                    placeholder="e.g. 12"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Issue</label>
                                <input
                                    type="text"
                                    value={issue}
                                    onChange={(e) => setIssue(e.target.value)}
                                    placeholder="e.g. 4"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Access Type</label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setIsFree(true)}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${isFree ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    Free to Read
                                </button>
                                <button
                                    onClick={() => setIsFree(false)}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${!isFree ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    Paid Content
                                </button>
                            </div>
                        </div>

                        {!isFree && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-medium">Price (USD)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-input rounded-md bg-background"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Readers must purchase this article to view full content.</p>
                            </div>
                        )}

                        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900 p-3 rounded-md text-xs text-yellow-800 dark:text-yellow-200">
                            <strong>Note:</strong> Publishing will notify all subscribed readers immediately. This action cannot be undone easily.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedArticle(null)} disabled={publishing}>
                            Cancel
                        </Button>
                        <Button onClick={confirmPublish} disabled={publishing} className="bg-indigo-600 hover:bg-indigo-700">
                            {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Confirm & Publish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
