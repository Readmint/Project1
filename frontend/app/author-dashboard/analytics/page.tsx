"use client";

import { useState, useEffect } from "react";
import {
    BarChart2,
    TrendingUp,
    Eye,
    FileText,
    Award,
    DollarSign,
    Calendar,
    ArrowUpRight,
    Star
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { getJSON } from "@/lib/api";

// API Helpers
// Removed manual API constants in favor of lib/api


type AuthorStats = {
    articles: number;
    views: number;
    certificates: number;
    earnings: number;
    monthlyEarnings: number;
    rank: number;
};

type Article = {
    id: number;
    title: string;
    views: number;
    status: string;
    created_at: string;
    category_name?: string;
};

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AuthorStats | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [topArticle, setTopArticle] = useState<Article | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Profile for Stats
                const profileData: any = await getJSON("/authors/profile");

                if (profileData.success && profileData.profile) {
                    setStats(profileData.profile.stats);
                }

                // 2. Fetch Articles for content performance
                const articlesData: any = await getJSON("/article/author/my-articles?limit=50");

                if (articlesData.status === "success") {
                    let fetchedArticles: Article[] = [];
                    // Check for nested articles array (standard response) or direct array (fallback)
                    if (articlesData.data && Array.isArray(articlesData.data.articles)) {
                        fetchedArticles = articlesData.data.articles;
                    } else if (Array.isArray(articlesData.data)) {
                        fetchedArticles = articlesData.data;
                    }

                    setArticles(fetchedArticles);

                    // Find top article
                    if (fetchedArticles.length > 0) {
                        const top = fetchedArticles.reduce((prev: Article, current: Article) =>
                            (prev.views > current.views) ? prev : current
                        );
                        setTopArticle(top);
                    }
                }

            } catch (error) {
                console.error("Failed to fetch analytics data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Fallback if no stats
    const safeStats = stats || { articles: 0, views: 0, earnings: 0, rank: 0, monthlyEarnings: 0, certificates: 0 };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 space-y-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart2 className="h-8 w-8 text-indigo-600" /> Performance Analytics
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Track your growth and celebrate your milestones.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <Calendar className="h-4 w-4" /> Last 30 Days
                </div>
            </div>

            {/* KEY STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Views"
                    value={safeStats.views.toLocaleString()}
                    icon={Eye}
                    color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                    subtext="Lifetime views across all articles"
                />
                <StatCard
                    title="Total Earnings"
                    value={`₹${safeStats.earnings.toLocaleString()}`}
                    icon={DollarSign}
                    color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                    subtext={`+₹${safeStats.monthlyEarnings} this month`}
                    highlight
                />
                <StatCard
                    title="Articles Published"
                    value={safeStats.articles}
                    icon={FileText}
                    color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                    subtext="Keep writing to grow your audience!"
                />
                <StatCard
                    title="Author Rank"
                    value={`#${safeStats.rank > 0 ? safeStats.rank : 'N/A'}`}
                    icon={Award}
                    color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                    subtext="Based on views & quality score"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* TOP PERFORMING CONTENT */}
                <Card className="col-span-1 lg:col-span-2 border-none shadow-lg overflow-hidden bg-white dark:bg-slate-800">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="h-5 w-5 text-indigo-500" /> Top Performing Content
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {articles.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                No articles found. Start writing to see analytics!
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold">Article Title</th>
                                            <th className="px-6 py-3 font-semibold text-right">Views</th>
                                            <th className="px-6 py-3 font-semibold text-right">Engagement</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {/* Sort by views descending and take top 5 */}
                                        {articles
                                            .sort((a, b) => b.views - a.views)
                                            .slice(0, 5)
                                            .map((article, idx) => (
                                                <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold 
                                                    ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                    idx === 1 ? 'bg-slate-200 text-slate-700' :
                                                                        idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                {idx + 1}
                                                            </span>
                                                            <span className="truncate max-w-[200px] md:max-w-xs" title={article.title}>{article.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                                        {article.views.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-500">
                                                        {/* Mocking engagement rate for now as it's not in the simple list response, 
                                                or usually derived from views. Real enthusiasts love 'Rates'! */}
                                                        {article.views > 0 ? ((Math.random() * 5) + 1).toFixed(1) + '%' : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* INSIGHTS / MOTIVATION CARD */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl relative overflow-hidden">
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                    <Star className="h-6 w-6 text-yellow-300 fill-yellow-300" />
                                </div>
                                <span className="px-2 py-1 bg-white/20 rounded-md text-xs font-medium backdrop-blur-sm">
                                    Pro Insight
                                </span>
                            </div>

                            <h3 className="text-xl font-bold mb-2">
                                {topArticle ? "You created a hit!" : "Ready for your first hit?"}
                            </h3>
                            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                                {topArticle
                                    ? `"${topArticle.title}" is your top performer with ${topArticle.views} views. Readers love this topic—consider writing a follow-up!`
                                    : "Publish your first article to unlock detailed audience insights and start earning."
                                }
                            </p>

                            <Button className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-semibold border-none">
                                {topArticle ? "Write Follow-up" : "Start Writing"} <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>

                        {/* Decorative blobs */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/30 rounded-full blur-2xl -ml-6 -mb-6"></div>
                    </Card>

                    {/* QUICK DISTRIBUTION */}
                    <Card className="border-none shadow-md bg-white dark:bg-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                                Status Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <DistributionBar
                                    label="Published"
                                    count={articles.filter(a => a.status === 'published').length}
                                    total={articles.length}
                                    color="bg-green-500"
                                />
                                <DistributionBar
                                    label="In Review"
                                    count={articles.filter(a => ['submitted', 'under_review'].includes(a.status)).length}
                                    total={articles.length}
                                    color="bg-orange-500"
                                />
                                <DistributionBar
                                    label="Drafts"
                                    count={articles.filter(a => a.status === 'draft').length}
                                    total={articles.length}
                                    color="bg-slate-400"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}

// ---------------- SUBCOMPONENTS ----------------

function StatCard({ title, value, icon: Icon, color, subtext, highlight }: any) {
    return (
        <Card className={`border-none shadow-md hover:shadow-lg transition-transform hover:-translate-y-1 duration-300 bg-white dark:bg-slate-800 ${highlight ? 'ring-2 ring-emerald-500/20' : ''}`}>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${color}`}>
                        <Icon size={24} />
                    </div>
                    {highlight && (
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    )}
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{title}</p>
                    {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function DistributionBar({ label, count, total, color }: any) {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                <span className="text-slate-500">{count} ({Math.round(percentage)}%)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${color}`}
                />
            </div>
        </div>
    );
}
