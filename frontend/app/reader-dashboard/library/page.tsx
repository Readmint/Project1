"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Wallet, BookOpen, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Issue {
  id: string | number;
  title: string;
  category: string;
  image: string;
  price: number;
  description: string;
}

const fallbackIssues: Issue[] = [
  { id: 1, title: "Global Tech 2025", category: "Technology", image: "/images/issue1.jpg", price: 299, description: "A deep dive into the next wave of innovations in tech, AI, and computing." },
  { id: 2, title: "Design Forward", category: "Design", image: "/images/issue2.jpg", price: 199, description: "A curated collection on modern layouts, UI trends, and digital aesthetics." },
  { id: 3, title: "Health Digest", category: "Health", image: "/images/issue3.jpg", price: 149, description: "Well-researched articles on mental health, wellness, and lifestyle improvements." },
  { id: 4, title: "Earth & Climate", category: "Environment", image: "/images/issue4.jpg", price: 249, description: "Scientific studies, climate analysis, and sustainability discussions." },
  { id: 5, title: "Culture Chronicles", category: "Culture", image: "/images/issue5.jpg", price: 29, description: "Human stories, art, and modern cultural transformation." },
  { id: 6, title: "Finance Redefined", category: "Finance", image: "/images/issue6.jpg", price: 299, description: "Understanding markets, crypto, fintech, and digital economies." },
  { id: 7, title: "Debut Voices", category: "Literary", image: "/images/issue7.jpg", price: 0, description: "A special issue highlighting emerging writers and first-time contributors." },
  { id: 8, title: "Science Frontier", category: "Science", image: "/images/issue8.jpg", price: 349, description: "From quantum research to biology — explored by expert minds." },
  { id: 9, title: "Journalism Ethics", category: "Media", image: "/images/issue9.jpg", price: 99, description: "Analysing integrity, media innovation, and ethical reporting." },
  { id: 10, title: "Collaborator Special", category: "Editorial", image: "/images/issue10.jpg", price: 249, description: "A partnered publication featuring collaborative research and insights." },
  { id: 11, title: "Extra Issue (Search Test)", category: "Test", image: "/images/issue11.jpg", price: 249, description: "This issue is kept hidden from sections for testing search." },
];

function getCurrentUserId() {
  return typeof window !== "undefined" ? localStorage.getItem("userId") : null;
}

export default function LibraryPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getCurrentUserId();
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    (async () => {
      try {
        const res = await fetch(`/api/reader/home`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const json = await res.json();
          const combined = [
            ...(json.featured ?? []),
            ...(json.recent ?? []),
            ...(json.trending ?? [])
          ];
          const mapped: Issue[] = combined.map((c: any) => ({
            id: c.id ?? c.contentId ?? `${c.title}-${Math.random()}`,
            title: c.title ?? c.name ?? "Untitled",
            category: (c.metadata && c.metadata.category) || c.category || "General",
            image: (c.metadata && c.metadata.coverUrl) || c.coverUrl || "/images/issue1.jpg",
            price: c.metadata?.price ?? c.price ?? 0,
            description: (c.metadata && c.metadata.excerpt) || c.excerpt || ""
          }));
          setIssues(mapped.length ? mapped.filter(i => String(i.id) !== "11") : fallbackIssues.filter(i => i.id !== 11));
        } else {
          setIssues(fallbackIssues.filter(i => i.id !== 11));
        }
      } catch (err) {
        setIssues(fallbackIssues.filter(i => i.id !== 11));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visibleIssues = issues.filter(i => String(i.id) !== "11");
  const filtered = issues.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));

  const openContentStream = async (issue: Issue) => {
    const userId = getCurrentUserId();
    if (!userId) {
      alert("Please log in to read the issue.");
      return;
    }

    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`/api/reader/content/${issue.id}/stream`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!res.ok) {
        alert("Unable to fetch content URL.");
        return;
      }
      const json = await res.json();
      if (json.url) {
        await fetch(`/api/reader/users/${userId}/progress`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ contentId: String(issue.id), lastReadPosition: "0", percentRead: 0 })
        }).catch(() => {});
        window.open(json.url, "_blank");
      } else {
        alert("No URL returned from server.");
      }
    } catch (err) {
      alert("Network error when trying to open issue.");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors px-4 sm:px-6 lg:px-8 py-16">

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-1">
          <BookOpen size={22}/> My Library
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Access your saved and purchased magazine issues</p>
      </div>

      {/* Search */}
      <div className="flex justify-center mb-10">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 text-slate-400" size={16}/>
          <input
            placeholder="Search issues..."
            className="w-full bg-slate-100 dark:bg-slate-800 pl-9 border border-slate-300 dark:border-slate-700 text-sm py-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Search Results */}
      {loading ? (
        <p className="text-center">Loading library…</p>
      ) : search ? (
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search size={15}/> Search Results
          </h2>

          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500">No issues found matching your search.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {filtered.map(issue => (
                <IssueCard key={String(issue.id)} issue={issue} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 max-w-6xl mx-auto">
          {visibleIssues.map(issue => (
            <motion.div key={String(issue.id)} whileHover={{ scale:1.02 }}>
              <Card className="overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-2xl cursor-pointer">

                <div className="relative w-full h-48">
                  <Image src={issue.image} alt={issue.title} fill className="object-cover"/>
                </div>

                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full font-semibold">{issue.category}</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      {issue.price > 0 && <Wallet size={11}/>} {issue.price === 0 ? "Free" : `₹${issue.price}`}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold mb-4">{issue.title}</h3>

                  <Button
                    onClick={() => router.push(`/reader/issues/${issue.id}`)}
                    variant="outline"
                    className="w-full border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 hover:bg-indigo-50 rounded-full text-xs"
                  >
                    <Eye size={11} className="mr-2"/> View Issue
                  </Button>

                  <Button
                    onClick={() => openContentStream(issue)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-3 mt-2"
                  >
                    Read
                  </Button>
                </CardContent>

              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal (kept unchanged, only used in search view if you want) */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
          <motion.div
            initial={{opacity:0, scale:0.97}}
            animate={{opacity:1, scale:1}}
            transition={{duration:0.3}}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-indigo-600">{selectedIssue.title}</h2>
              <Button onClick={() => setSelectedIssue(null)} variant="ghost">Close</Button>
            </div>

            <div className="relative w-full h-56 mb-4 rounded-xl overflow-hidden">
              <Image src={selectedIssue.image} alt={selectedIssue.title} fill className="object-cover"/>
            </div>

            <p className="text-sm leading-relaxed">{selectedIssue.description}</p>

            <div className="mt-6 flex gap-3 justify-center">
              <Button
                onClick={() => router.push(`/reader/issues/${selectedIssue.id}`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-full text-xs"
              >
                View Overview →
              </Button>

              <Button variant="outline" onClick={() => setSelectedIssue(null)} className="text-xs">Close</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* UPDATED IssueCard — redirects instead of opening modal */
function IssueCard({ issue }: { issue: Issue }) {
  const router = useRouter();

  return (
    <motion.div whileHover={{scale:1.03}}>
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-md overflow-hidden">
        <div className="relative w-full h-48">
          <Image src={issue.image} alt={issue.title} fill className="object-cover"/>
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] bg-indigo-600/10 px-3 py-1 rounded-full font-semibold">{issue.category}</span>
            <span className="text-[10px] text-slate-600 flex items-center gap-1">
              {issue.price > 0 && <Wallet size={11}/>} {issue.price === 0 ? "Free" : `₹${issue.price}`}
            </span>
          </div>

          <h3 className="text-xs font-bold mb-3">{issue.title}</h3>

          <Button
            onClick={() => router.push(`/reader/issues/${issue.id}`)}
            variant="outline"
            className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-full text-xs flex items-center justify-center gap-1"
          >
            <Eye size={11}/> View
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
