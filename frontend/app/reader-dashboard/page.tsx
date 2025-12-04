"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Bookmark, Wallet, Library, Award, Eye } from "lucide-react";

interface Issue {
  id: string | number;
  title: string;
  author?: string;
  category?: string;
  image?: string;
  progress?: number;
  lastRead?: string;
  price?: number;
}

function getCurrentUserId() {
  return typeof window !== "undefined" ? localStorage.getItem("userId") : null;
}

function StatCard({ label, value, Icon, prefix }: { label: string; value: string | number; Icon: any; prefix?: string }) {
  return (
    <Card className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
      <CardContent className="p-0 flex justify-between items-center">
        <div className="h-11 w-11 bg-indigo-600/10 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
          <Icon className="text-indigo-600 dark:text-indigo-400" size={20}/>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {prefix ? `${prefix}${value}` : value}
          </h3>
        </div>
      </CardContent>
    </Card>
  );
}

function IssueCard({ issue, isContinue, onRead }: { issue: Issue; isContinue?: boolean; onRead?: (i: Issue) => void }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }}>
      <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden flex items-stretch">
        <div className="relative w-32 h-32 flex-shrink-0">
          <Image src={issue.image ?? "/images/issue1.jpg"} alt={issue.title} fill className="object-cover"/>
        </div>

        <CardContent className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{issue.title}</h3>

            {isContinue && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock size={12}/> Last read {issue.lastRead ?? "—"}
              </p>
            )}

            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">{issue.category ?? "General"}</p>

            {!isContinue && issue.price != null && (
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 mt-2">
                ₹{issue.price}
              </p>
            )}

            {isContinue && (
              <div className="mt-3">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between mb-1">
                  <span>Progress</span>
                  <span>{issue.progress ?? 0}%</span>
                </div>
                <div className="w-full bg-indigo-200 dark:bg-indigo-900/40 h-1.5 rounded-full">
                  <motion.div
                    animate={{ width: `${issue.progress ?? 0}%` }}
                    className="bg-indigo-600 h-full rounded-full"
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <div className="p-6 flex items-center">
          <Button onClick={() => onRead?.(issue)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-xs">
            {isContinue ? "Continue →" : <><Eye size={14} className="mr-1"/> View</>}
          </Button>
        </div>

      </Card>
    </motion.div>
  );
}

export default function DashboardHome() {
  const router = useRouter();
  const [stats, setStats] = useState({
    purchased: 24,
    readingTime: "48h",
    bookmarks: 156,
    totalSpent: 180
  });

  const [continueIssues, setContinueIssues] = useState<Issue[]>([]);
  const [recommendedIssues, setRecommendedIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getCurrentUserId();
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    (async () => {
      try {
        // Fetch home (recommended + trending + recent)
        const homeRes = await fetch(`/api/reader/home`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (homeRes.ok) {
          const json = await homeRes.json();
          const recs = (json.trending ?? []).concat(json.recent ?? []).slice(0, 6);
          const mappedRecs = recs.map((c: any) => ({
            id: c.id,
            title: c.title,
            category: (c.metadata && c.metadata.category) || c.category || "General",
            image: (c.metadata && c.metadata.coverUrl) || c.coverUrl || "/images/issue1.jpg",
            price: c.metadata?.price ?? c.price ?? 0
          }));
          setRecommendedIssues(mappedRecs);
        } else {
          setRecommendedIssues([]);
        }

        // Fetch reading progress to populate Continue Reading
        if (userId) {
          const progRes = await fetch(`/api/reader/users/${userId}/progress`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          });
          if (progRes.ok) {
            const json = await progRes.json();
            const progressRows = json.progress ?? [];
            // For each progress entry, try to fetch the content title from content endpoint
            const items = await Promise.all(progressRows.slice(0, 6).map(async (p: any) => {
              // try fetching content metadata
              try {
                const contentRes = await fetch(`/api/reader/content/${p.content_id ?? p.contentId ?? p.content_id ?? p.content_id}`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined
                });
                if (contentRes.ok) {
                  const contentJson = await contentRes.json();
                  const c = contentJson.content ?? contentJson;
                  return {
                    id: p.content_id ?? p.contentId ?? p.contentId,
                    title: c.title ?? "Untitled",
                    category: (c.metadata && c.metadata.category) || c.category || "General",
                    image: (c.metadata && c.metadata.coverUrl) || c.coverUrl || "/images/issue1.jpg",
                    progress: p.percent_read ?? p.percentRead ?? 0,
                    lastRead: p.last_opened_at ?? p.lastOpenedAt ?? ""
                  } as Issue;
                }
              } catch (e) {
                // ignore per-item fetch error
              }
              // fallback mapping from progress row
              return {
                id: p.content_id ?? p.contentId,
                title: `Issue ${p.content_id ?? p.contentId}`,
                category: "General",
                image: "/images/issue1.jpg",
                progress: p.percent_read ?? p.percentRead ?? 0,
                lastRead: p.last_opened_at ?? p.lastOpenedAt ?? ""
              } as Issue;
            }));

            setContinueIssues(items);
          } else {
            setContinueIssues([]);
          }
        } else {
          // Not logged in — empty continue list
          setContinueIssues([]);
        }
      } catch (err) {
        // fallback to local sample content if fetch fails
        setRecommendedIssues([]);
        setContinueIssues([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openAndSaveProgress = async (issue: Issue) => {
    const userId = getCurrentUserId();
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    if (!userId) {
      alert("Please login to open this content.");
      return;
    }

    try {
      // Save a lightweight progress record (start / open)
      await fetch(`/api/reader/users/${userId}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ contentId: String(issue.id), lastReadPosition: "0", percentRead: issue.progress ?? 0 })
      }).catch(() => {});

      // Then open content signed URL
      const streamRes = await fetch(`/api/reader/content/${issue.id}/stream`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (streamRes.ok) {
        const json = await streamRes.json();
        if (json.url) window.open(json.url, "_blank");
        else alert("No stream URL returned.");
      } else {
        alert("Unable to retrieve content URL.");
      }
    } catch (err) {
      alert("Network error while trying to open content.");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 px-6 py-16 space-y-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Welcome Back!</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">Here's your reading overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <StatCard label="Purchased Issues" value={stats.purchased} Icon={Library}/>
        <StatCard label="Reading Time" value={stats.readingTime} Icon={Clock}/>
        <StatCard label="Bookmarks" value={stats.bookmarks} Icon={Bookmark}/>
        <StatCard label="Total Spent" value={stats.totalSpent} Icon={Wallet} prefix="₹"/>
      </div>

      {/* Continue Reading */}
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Library size={18} className="text-indigo-600"/> Continue Reading
          </h2>
          <Link href="/issues">
            <Button variant="ghost" className="text-xs hover:text-indigo-600">View All</Button>
          </Link>
        </div>

        <div className="space-y-5">
          {loading ? <p>Loading…</p> : (continueIssues.length ? continueIssues.map(i => <IssueCard key={String(i.id)} issue={i} isContinue onRead={openAndSaveProgress}/>) : <p className="text-slate-500">No recent items. Start reading something!</p>)}
        </div>
      </div>

      {/* Recommended */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Bookmark size={18} className="text-purple-600"/> Recommended For You
        </h2>
        <div className="space-y-5">
          {loading ? <p>Loading recommendations…</p> : (recommendedIssues.length ? recommendedIssues.map(i => <IssueCard key={String(i.id)} issue={i} onRead={openAndSaveProgress}/>) : <p className="text-slate-500">No recommendations yet.</p>)}
        </div>
      </div>

      {/* Events (static fallback) */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Award size={18} className="text-purple-600"/> Our Events
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 1, title: "Author Connect Live 2025", image: "/images/event1.jpg", date: "Jan 22, 2025", description: "A global webinar featuring award-winning storytellers." },
            { id: 2, title: "Future of Digital Publishing Summit", image: "/images/event2.jpg", date: "Feb 14, 2025", description: "Panel discussions on AI, media, and evolving reader trends." },
            { id: 3, title: "Voices of Tomorrow — Writers Meet", image: "/images/event3.jpg", date: "Mar 03, 2025", description: "Celebrating and mentoring next-gen literary talent." }
          ].map(ev => (
            <motion.div key={ev.id} whileHover={{ scale:1.03 }}>
              <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="relative h-44 w-full">
                  <Image src={ev.image} alt={ev.title} fill className="object-cover"/>
                </div>
                <CardContent className="p-5 text-center">
                  <p className="text-[10px] text-slate-500">{ev.date}</p>
                  <h3 className="font-bold text-lg text-indigo-600">{ev.title}</h3>
                  <p className="text-xs text-slate-700 mt-2">{ev.description}</p>

                  <Button variant="outline" className="mt-4 text-xs border-indigo-600 text-indigo-600 rounded-full px-4 py-1">
                    Details
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="text-center pt-16">
        <Button className="text-white bg-indigo-600 hover:bg-indigo-700 rounded-full px-6 text-lg" onClick={()=>router.push('/issues')}>
          Browse More Issues
        </Button>
      </div>
    </div>
  );
}
