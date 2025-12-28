import { Button } from "@/components/ui/button";
import { BookOpen, ShoppingCart, CheckCircle, Lock, Bookmark } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { getJSON, postJSON } from "@/lib/api"; // Ensure these exist or use fetch

interface Article {
    id: string;
    title: string;
    synopsis: string;
    author_name: string;
    category_name: string;
    price: number;
    is_free: number; // 1 or 0
    is_purchased: boolean;
    published_at: string;
    is_bookmarked?: boolean;
}

interface ArticleCardProps {
    article: Article;
    isLibrary?: boolean;
    onAddToCart?: (article: Article) => void;
    onBookmarkChange?: (id: string, isBookmarked: boolean) => void;
}

export default function ArticleCard({ article, isLibrary = false, onAddToCart, onBookmarkChange }: ArticleCardProps) {
    // Use local state for immediate UI feedback, but sync with parent if provided
    const [isBookmarked, setIsBookmarked] = useState(article.is_bookmarked || false);
    const [loadingBookmark, setLoadingBookmark] = useState(false);

    // Derive access status
    const hasAccess = article.is_free === 1 || article.is_purchased || isLibrary;

    const handleToggleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (loadingBookmark) return;

        setLoadingBookmark(true);
        // Optimistic update
        const newValue = !isBookmarked;
        setIsBookmarked(newValue);

        try {
            const res = await postJSON(`/reader/bookmarks/${article.id}`, {});
            if (res.status === 'success') {
                toast.success(newValue ? "Bookmarked" : "Removed from bookmarks");
                if (onBookmarkChange) onBookmarkChange(article.id, newValue);
            } else {
                // Revert
                setIsBookmarked(!newValue);
                toast.error("Failed to update bookmark");
            }
        } catch (error) {
            setIsBookmarked(!newValue);
            toast.error("Error updating bookmark");
        } finally {
            setLoadingBookmark(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full relative group">

            {/* Bookmark Button (Absolute top-right) */}
            <button
                onClick={handleToggleBookmark}
                className="absolute top-3 right-3 z-10 p-1.5 bg-white/80 dark:bg-slate-900/80 rounded-full text-slate-500 hover:text-indigo-600 transition-colors shadow-sm"
                title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
            >
                <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} className={isBookmarked ? "text-indigo-600" : ""} />
            </button>

            <div className="p-5 flex-1 space-y-3">
                <div className="flex justify-between items-start pr-8">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {article.category_name || "General"}
                    </span>

                    {/* Price / Status Badge */}
                    {hasAccess ? (
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1 text-xs font-bold">
                            <CheckCircle size={12} /> Owned
                        </span>
                    ) : (
                        <span className="text-slate-500 font-medium text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded flex items-center gap-1">
                            {article.is_free === 0 && <Lock size={10} />}
                            ${Number(article.price).toFixed(2)}
                        </span>
                    )}
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2">
                    {article.title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                    {article.synopsis || "No synopsis available."}
                </p>

                <div className="text-xs text-slate-500 pt-2">
                    By {article.author_name} • {new Date(article.published_at).toLocaleDateString()}
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                {hasAccess ? (
                    <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        <Link href={`/reader/article/${article.id}`}>
                            <BookOpen size={16} /> Read Now
                        </Link>
                    </Button>
                ) : (
                    <Button
                        onClick={() => onAddToCart && onAddToCart(article)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    >
                        <ShoppingCart size={16} /> Add to Cart
                    </Button>
                )}
            </div>
        </div>
    );
}
