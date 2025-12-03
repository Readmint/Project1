"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Bookmark, Clock, Eye, X } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Issue {
  id: number;
  title: string;
  category: string;
  image: string;
  bookmarkedAt: string;
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

export default function BookmarkPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Issue[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Issue | null>(null);

  useEffect(() => {
    // Simulate DB fetch — your actual DB already holds 11 authors, this is sample for UI only
    setBookmarks(sampleBookmarks.filter(i => i.id !== 11)); // 3 shown initially
  }, []);

  const filteredResults = search
    ? sampleBookmarks.filter(i => 
        i.title.toLowerCase().includes(search.toLowerCase())
      )
    : bookmarks;

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
        {filteredResults.map(issue => (
          <motion.div key={issue.id} initial={{opacity:0, y:15}} animate={{opacity:1, y:0}}>
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
                    <Clock size={11}/> {issue.bookmarkedAt}
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
                    onClick={() => setSelected(issue)}
                    variant="outline"
                    className="flex-1 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-full text-xs flex items-center justify-center gap-1"
                  >
                    <Eye size={12}/> View
                  </Button>

                  <Button
                    onClick={() => setBookmarks(prev => prev.filter(b => b.id !== issue.id))}
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

      {/* Issue modal placeholder preserved for later connection */}
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
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 text-xs">
                Read Now →
              </Button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
