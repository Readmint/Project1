"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  CheckCircle,
  Clock,
  Eye,
  TrendingUp,
  PlusCircle,
  CreditCard,
  User,
  ArrowRight,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// API Helpers
const rawApi = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");
const API_BASE = rawApi.endsWith("/api") ? rawApi.replace(/\/api$/, "") : rawApi;
const API_ROOT = `${API_BASE}/api`.replace(/\/+$/, "");

type Article = {
  id: number;
  title: string;
  category_name?: string;
  created_at: string;
  views: number;
  status: string;
};

type AuthorStats = {
  articles: number;
  views: number;
  published: number;
  pending: number;
};

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<AuthorStats>({
    articles: 0,
    views: 0,
    published: 0,
    pending: 0
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("ACCESS_TOKEN");
        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };

        // 1. Fetch Profile for generic stats (views, total counts)
        const profileRes = await fetch(`${API_ROOT}/authors/profile`, { headers });
        const profileData = await profileRes.json();

        // 2. Fetch Articles for content lists & precise status counts
        const articlesRes = await fetch(`${API_ROOT}/article/author/my-articles?limit=10`, { headers });
        const articlesData = await articlesRes.json();

        console.log("Articles Data Response:", articlesData);

        // Process Data
        let fetchedArticles: Article[] = [];
        if (articlesData.status === "success") {
          // Check for nested articles array (standard response) or direct array (fallback)
          if (articlesData.data && Array.isArray(articlesData.data.articles)) {
            fetchedArticles = articlesData.data.articles;
          } else if (Array.isArray(articlesData.data)) {
            fetchedArticles = articlesData.data;
          }
          setArticles(fetchedArticles);
        }

        // Calculate Stats from real articles to be most accurate for "This Dashboard"
        // (Backend profile stats might be lagging or different aggregation)
        const publishedCount = fetchedArticles.filter(a => a.status === 'published').length;
        const pendingCount = fetchedArticles.filter(a => ['submitted', 'under_review'].includes(a.status)).length;

        // Use profile stats for views if available, else sum local
        let totalViews = 0;
        if (profileData.success && profileData.profile?.stats) {
          totalViews = profileData.profile.stats.views;
        } else {
          totalViews = fetchedArticles.reduce((acc, curr) => acc + (curr.views || 0), 0);
        }

        setStats({
          articles: fetchedArticles.length,
          views: totalViews,
          published: publishedCount,
          pending: pendingCount
        });

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 space-y-8">

      {/* 1. HERO WELCOME SECTION */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome back, {user?.name?.split(' ')[0] || "Author"}! 👋
          </h1>
          <p className="text-indigo-100 max-w-2xl text-lg">
            You've been doing great! Check your latest stats and submit a new masterpiece today.
          </p>
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => router.push("/author-dashboard/submit")}
              className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold rounded-full px-6"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Article
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/author-dashboard/analytics")}
              className="bg-transparent border-white text-white hover:bg-white/10 rounded-full px-6"
            >
              View Analytics
            </Button>
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 -mb-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
      </motion.div>


      {/* 2. KEY METRICS GRID */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Total Articles"
          value={stats.articles}
          icon={FileText}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          title="Total Views"
          value={stats.views.toLocaleString()}
          icon={Eye}
          color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          trendPositive
        />
        <StatCard
          title="Published"
          value={stats.published}
          icon={CheckCircle}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <StatCard
          title="pending Review"
          value={stats.pending}
          icon={Clock}
          color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* 3. RECENT ARTICLES TABLE */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" /> Recent Activity
            </h2>
            <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700" onClick={() => router.push("/author-dashboard/articles")}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <Card className="border-none shadow-lg bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Article Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {articles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No articles found. Create your first one!
                      </td>
                    </tr>
                  ) : (
                    articles.slice(0, 5).map((article) => (
                      <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                          {article.title}
                          <div className="text-xs text-slate-400 font-normal mt-0.5">
                            {new Date(article.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                            {article.category_name || "General"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={article.status} />
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-300">
                          {article.views > 0 ? article.views.toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* 4. QUICK ACTIONS & SUBSCRIPTION */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Quick Actions</h2>

          <div className="grid grid-cols-1 gap-4">
            <QuickActionCard
              title="My Profile"
              desc="Update bio & details"
              icon={User}
              onClick={() => router.push("/author-dashboard/profile")}
            />
            <QuickActionCard
              title="Subscription"
              desc="Manage your plan"
              icon={CreditCard}
              onClick={() => router.push("/author-dashboard/subscription")}
            />
          </div>

          {/* PROMO CARD */}
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1">Go Premium 🚀</h3>
              <p className="text-indigo-200 text-sm mb-4">Get unlimited plagiarism checks and priority review.</p>
              <Button
                size="sm"
                className="bg-white text-indigo-900 hover:bg-indigo-50 w-full font-semibold"
                onClick={() => router.push("/author-dashboard/subscription")}
              >
                Upgrade Now
              </Button>
            </div>
            {/* Decoration */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          </div>

        </motion.div>

      </div>
    </div>
  );
}

/* ----------------- HELPER COMPONENTS ----------------- */

function StatCard({ title, value, icon: Icon, color, trend, trendPositive }: any) {
  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon size={22} />
          </div>
          {trend && (
            <span className={`text-xs font-medium ${trendPositive ? 'text-green-600' : 'text-slate-500'}`}>
              {trend}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const rawStatus = (status || "").toLowerCase();

  // Normalize status strings
  const styles: any = {
    published: "bg-green-100 text-green-700 border-green-200",
    submitted: "bg-blue-100 text-blue-700 border-blue-200",
    under_review: "bg-blue-100 text-blue-700 border-blue-200",
    changes_requested: "bg-orange-100 text-orange-700 border-orange-200",
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    rejected: "bg-red-100 text-red-700 border-red-200"
  };

  // Formatted label
  const label = rawStatus.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[rawStatus] || styles.draft}`}>
      {label}
    </span>
  );
}

function QuickActionCard({ title, desc, icon: Icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-indigo-500 hover:shadow-md transition-all group text-left"
    >
      <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
        <Icon size={20} />
      </div>
      <div className="ml-4">
        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
      <ArrowRight className="ml-auto text-slate-300 group-hover:text-indigo-500 transition-colors" size={16} />
    </button>
  );
}
