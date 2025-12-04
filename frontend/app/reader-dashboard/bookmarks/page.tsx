"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Bookmark, Clock, Eye, X } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Issue {
  id: string | number;
  title: string;
  category: string;
  image: string;
  bookmarkedAt?: string;
  excerpt: string;
  price: number;
}

const sampleBookmarks: Issue[] = [
  {
    id: 1,
    title: "AI Innovators Weekly",
    category: "Artificial Intelligence",
    image: "/images/book1.jpg",
    bookmarkedAt: "3 hours ago",
    excerpt: "Insights into AI governance, breakthroughs, and emerging regulation in 2025.",
    price: 199,
  },
  {
    id: 2,
    title: "Design Paradigms",
    category: "Design & UI",
    image: "/images/book2.jpg",
    bookmarkedAt: "2 days ago",
    excerpt: "Minimalism, brutalism, and motion design trends taking over digital platforms.",
    price: 149,
  },
  {
    id: 3,
    title: "Global Markets Digest",
    category: "Finance",
    image: "/images/book3.jpg",
    bookmarkedAt: "1 week ago",
    excerpt: "Crypto, stock intelligence, and macroeconomic movement explained.",
    price: 299,
  },
  {
    id: 11,
    title: "Hidden Bookmark (Search Test)",
    category: "Test",
    image: "/images/book4.jpg",
    bookmarkedAt: "N/A",
    excerpt: "This bookmark is hidden from list and used only for testing search.",
    price: 99,
  },
];

function getCurrentUserId() {
  // Change this if your app stores user id elsewhere
  return typeof window !== "undefined" ? localStorage.getItem("userId") : null;
}

export default function BookmarkPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Issue[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try fetching from backend; fallback to sampleBookmarks filtered (hide id=11)
    const userId = getCurrentUserId();
    if (!userId) {
      setBookmarks(sampleBookmarks.filter(i => i.id !== 11));
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // There is no GET /bookmarks in the initial controller code,
        // so we conservatively try /recommendations as fallback source for list or use local sample
        const token = localStorage.getItem("authToken");
        const res = await fetch(`/api/reader/recommendations/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (res.ok) {
          const json = await res.json();
          // recommendations may return content objects or just ids; normalize to Issue shape
          const recs = Array.isArray(json.recommendations) ? json.recommendations : [];
          const mapped: Issue[] = recs.map((r: any, idx: number) => ({
            id: r.id ?? `rec-${idx}`,
            title: r.title ?? r.name ?? `Recommendation ${idx + 1}`,
            category: (r.metadata && r.metadata.category) || r.category || "General",
            image: (r.metadata && r.metadata.coverUrl) || r.coverUrl || "/images/book1.jpg",
            bookmarkedAt: "Saved",
            excerpt: (r.metadata && r.metadata.excerpt) || r.excerpt || "",
            price: r.price ?? 0
          }));
          // If empty, fallback to sample
          setBookmarks(mapped.length ? mapped.filter(i => i.id !== 11) : sampleBookmarks.filter(i => i.id !== 11));
        } else {
          setBookmarks(sampleBookmarks.filter(i => i.id !== 11));
        }
      } catch (err) {
        setBookmarks(sampleBookmarks.filter(i => i.id !== 11));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredResults = search
    ? // search across both sample & fetched lists
      (sampleBookmarks.concat(bookmarks))
        .filter((i, idx, arr) => arr.findIndex(a => a.id === i.id) === idx) // dedupe
        .filter(i => i.title.toLowerCase().includes(search.toLowerCase()))
    : bookmarks;

  const toggleBookmark = async (issue: Issue) => {
    const userId = getCurrentUserId();
    if (!userId) {
      // Simple UX: remove client-side and inform user to login
      setBookmarks(prev => prev.filter(b => b.id !== issue.id));
      alert("Bookmark removed locally. Log in to persist changes to your account.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/reader/users/${userId}/bookmark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ contentId: String(issue.id) })
      });

      if (res.ok) {
        const json = await res.json();
        // removed or added - reflect in UI
        if (json.removed) {
          setBookmarks(prev => prev.filter(b => b.id !== issue.id));
        } else if (json.added) {
          // ensure not duplicated
          setBookmarks(prev => [issue, ...prev.filter(b => b.id !== issue.id)]);
        } else {
          // fallback: toggle locally
          setBookmarks(prev => prev.filter(b => b.id !== issue.id));
        }
      } else {
        // fallback local removal
        setBookmarks(prev => prev.filter(b => b.id !== issue.id));
      }
    } catch (err) {
      setBookmarks(prev => prev.filter(b => b.id !== issue.id));
    }
  };

  const openContentStream = async (issue: Issue) => {
    const userId = getCurrentUserId();
    if (!userId) {
      alert("Please login to open content.");
      return;
    }
    const token = localStorage.getItem("authToken");
    try {
      // Try to open signed URL from the API. We need content id mapping; if issue.id is not the content id,
      // backend may reject — this is a best-effort integration (adjust as your content IDs become real).
      const res = await fetch(`/api/reader/content/${issue.id}/stream`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (res.ok) {
        const json = await res.json();
        if (json.url) {
          window.open(json.url, "_blank");
        } else {
          alert("Could not get content URL.");
        }
      } else {
        alert("Unable to open content. Server error.");
      }
    } catch (err) {
      alert("Unable to open content. Network error.");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 px-6 py-16 space-y-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 mb-2">
          <Bookmark size={24}/> Your Bookmarks
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400">
          Quick access to your saved magazine issues
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 text-slate-400" size={16}/>
          <input
            placeholder="Search bookmarks..."
            className="w-full bg-slate-100 dark:bg-slate-800 pl-9 border border-slate-300 dark:border-slate-700 text-sm py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Results Grid */}
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {loading ? (
          <p className="text-center col-span-full">Loading bookmarks…</p>
        ) : filteredResults.length === 0 ? (
          <p className="text-center col-span-full text-slate-500">No bookmarks found.</p>
        ) : filteredResults.map(issue => (
          <motion.div key={String(issue.id)} initial={{opacity:0, y:15}} animate={{opacity:1, y:0}}>
            <Card className="bg-white dark:bg-slate-900 shadow-md rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
              
              {/* Cover */}
              <div className="relative w-full h-44">
                <Image src={issue.image} alt={issue.title} fill className="object-cover"/>
              </div>

              <CardContent className="p-5 flex flex-col flex-grow">
                
                {/* Meta */}
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full font-semibold">
                    {issue.category}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock size={11}/> {issue.bookmarkedAt ?? "Saved"}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  {issue.title}
                </h3>

                {/* Excerpt */}
                <p className="text-xs text-slate-700 dark:text-slate-300 mb-5 flex-grow">
                  {issue.excerpt}
                </p>

                {/* Footer */}
                <div className="flex justify-between items-center mt-auto gap-3">
                  <Button
                    onClick={() => openContentStream(issue)}
                    variant="outline"
                    className="flex-1 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-full text-xs flex items-center justify-center gap-1"
                  >
                    <Eye size={12}/> View
                  </Button>

                  <Button
                    onClick={() => toggleBookmark(issue)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full text-xs px-3"
                  >
                    <X size={13}/>
                  </Button>

                </div>

              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Issue modal preserved */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 flex justify-center items-center p-4 z-50">
          <motion.div
            initial={{opacity:0, scale:0.96}}
            animate={{opacity:1, scale:1}}
            transition={{duration:0.3}}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6"
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{selected.title}</h2>
              <Button onClick={() => setSelected(null)} variant="ghost" className="text-slate-700 dark:text-white hover:text-indigo-500">
                <X size={15}/>
              </Button>
            </div>

            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 border border-slate-200 dark:border-slate-700">
              <Image src={selected.image} alt={selected.title} fill className="object-cover"/>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {selected.excerpt}
            </p>

            <div className="mt-6 text-center">
              <Button onClick={() => openContentStream(selected)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 text-xs">
                Read Now →
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
