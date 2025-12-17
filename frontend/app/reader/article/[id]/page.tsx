"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJSON } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Lock, FileText, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";

interface Comment {
    id: string;
    user_name: string;
    content: string;
    created_at: string;
}

interface ArticleDetails {
    id: string;
    title: string;
    synopsis: string;
    author_name: string;
    price: number;
    is_free: number;
    has_access: boolean;
    category: string;
    language?: string;
    published_at: string;
    content: string | null;
    attachments: {
        id: string;
        filename: string;
        public_url?: string;
        storage_path?: string;
    }[];
    social: {
        likes: number;
        is_liked: boolean;
        comments: Comment[];
    };
}

import { Heart, MessageCircle, Send, User, Languages } from "lucide-react";
import { postJSON } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export default function ArticlePage() {
    const params = useParams();
    const router = useRouter();
    const { addToCart } = useCart();
    const { language: currentLang, t } = useLanguage();
    const [article, setArticle] = useState<ArticleDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // Social State
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        if (params.id) {
            loadArticle(params.id as string);
        }
    }, [params.id]);

    const loadArticle = async (id: string) => {
        try {
            setLoading(true);
            const res = await getJSON(`/reader/article/${id}`);
            if (res.status === "success") {
                setArticle(res.data);
                // Init social state
                if (res.data.social) {
                    setLikes(res.data.social.likes);
                    setIsLiked(res.data.social.is_liked);
                    setComments(res.data.social.comments || []);
                }
            } else {
                toast.error(res.message || "Failed to load article");
                router.push("/reader-dashboard");
            }
        } catch (e) {
            toast.error("Error loading article");
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!article) return;
        addToCart({
            id: article.id,
            title: article.title,
            price: typeof article.price === 'string' ? parseFloat(article.price) : article.price,
            author: article.author_name
        });
    };

    const handleLike = async () => {
        if (!article) return;
        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikes(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            await postJSON(`/reader/article/${article.id}/like`, {});
        } catch (error) {
            // Revert on error
            setIsLiked(!newIsLiked);
            setLikes(prev => !newIsLiked ? prev + 1 : prev - 1);
            toast.error("Failed to update like");
        }
    };

    const handlePostComment = async () => {
        if (!article || !commentText.trim()) return;
        setSubmittingComment(true);
        try {
            const res = await postJSON(`/reader/article/${article.id}/comment`, { content: commentText });
            if (res.status === 'success') {
                toast.success("Comment posted!");
                setCommentText("");
                // Reload article to fetch new comment - simple way
                loadArticle(article.id);
            } else {
                toast.error("Failed to post comment");
            }
        } catch (error) {
            toast.error("Error posting comment");
        } finally {
            setSubmittingComment(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!article) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link href="/reader-dashboard" className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-6">
                <ArrowLeft size={16} className="mr-2" /> {t('article.back_library')}
            </Link>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* HEADER */}
                <div className="p-8 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                                {article.category || "Article"}
                            </span>
                            <h1 className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{article.title}</h1>
                            <p className="text-slate-500 mt-2">{t('article.by')} {article.author_name} • {new Date(article.published_at).toLocaleDateString()} • {article.language || 'English'}</p>

                            <p className="text-slate-500 mt-2">{t('article.by')} {article.author_name} • {new Date(article.published_at).toLocaleDateString()} • {article.language || 'English'}</p>

                            {/* SOCIAL BAR */}
                            <div className="flex items-center gap-6 mt-6">
                                <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                                {likes} {t('article.likes')}
                            </button>
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <MessageCircle size={20} />
                                {comments.length} {t('article.comments')}
                            </div>
                        </div>
                    </div>

                    {!article.has_access && (
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg flex flex-col items-center min-w-[200px]">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white block mb-2">
                                ${Number(article.price).toFixed(2)}
                            </span>
                            <Button onClick={handleAddToCart} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                <ShoppingCart size={16} className="mr-2" /> {t('article.add_to_cart')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* CONTENT */}
            <div className="p-8">
                {article.has_access ? (
                    <div className="prose dark:prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content || "") }} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Lock className="h-16 w-16 text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Premium Content</h3>
                        <p className="text-slate-500 max-w-md mt-2 mb-6">
                            {article.synopsis}
                            <br /><br />
                            Purchase this article to unlock full access and attachments.
                        </p>
                        <Button onClick={handleAddToCart} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <ShoppingCart size={20} className="mr-2" /> Buy Now for ${Number(article.price).toFixed(2)}
                        </Button>
                    </div>
                )}
            </div>

            {/* ATTACHMENTS */}
            {article.has_access && article.attachments.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <FileText size={20} /> Attachments & Resources
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {article.attachments.map(att => (
                            <div key={att.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                <span className="text-sm font-medium truncate flex-1 mr-2">{att.filename}</span>
                                <Button size="sm" variant="outline" asChild>
                                    <a href={att.public_url || att.storage_path} target="_blank" rel="noopener noreferrer">
                                        <Download size={14} className="mr-1" /> Download
                                    </a>
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* COMMENTS SECTION */}
            <div className="p-8 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Comments ({comments.length})</h3>

                {/* Input */}
                <div className="flex gap-4 mb-8">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-slate-500" />
                    </div>
                    <div className="flex-1">
                        <textarea
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                            placeholder="Share your thoughts..."
                            rows={3}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                            <Button
                                onClick={handlePostComment}
                                disabled={!commentText.trim() || submittingComment}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {submittingComment ? <Loader2 className="animate-spin h-4 w-4" /> : <Send size={16} className="mr-2" />}
                                Post Comment
                            </Button>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-6">
                    {comments.length === 0 ? (
                        <p className="text-slate-500 text-center italic py-4">No comments yet. Be the first to share!</p>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 font-bold">
                                    {comment.user_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-baseline justify-between mb-1">
                                        <span className="font-semibold text-slate-900 dark:text-white">{comment.user_name}</span>
                                        <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{comment.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
}
