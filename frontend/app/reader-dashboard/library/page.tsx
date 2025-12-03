"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Bookmark, Wallet, BookOpen, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Issue {
  id: number;
  title: string;
  category: string;
  image: string;
  price: number;
  description: string;
}

const issues: Issue[] = [
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

/* Modal placeholder preserved for when you add real content later */
function IssueModal({ issue, onClose }: { issue: Issue; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 flex justify-center items-center z-50 p-4">
      <motion.div
        initial={{opacity:0, scale:0.97}}
        animate={{opacity:1, scale:1}}
        transition={{duration:0.3}}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg p-6"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {issue.title}
          </h2>
          <Button onClick={onClose} variant="ghost" className="text-slate-700 dark:text-white hover:text-indigo-500">Close</Button>
        </div>

        {/* Body */}
        <div className="relative w-full h-56 mb-4 rounded-xl overflow-hidden">
          <Image src={issue.image} alt={issue.title} fill className="object-cover"/>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {issue.description}
        </p>

        <div className="mt-6 text-center">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-full">Read Now →</Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const visibleIssues = issues.filter(i => i.id !== 11); // 10 issues shown in UI
  const filtered = issues.filter(i => i.title.toLowerCase().includes(search.toLowerCase())); // 11 issues searched

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors px-4 sm:px-6 lg:px-8 py-16">

      {/* Welcome Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-1">
          <BookOpen size={22}/> My Library
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Access your saved and purchased magazine issues
        </p>
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
      {search ? (
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
            <Search size={15}/> Search Results
          </h2>
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No issues found matching your search.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {filtered.map(issue => (
                <IssueCard key={issue.id} issue={issue} onSelect={setSelectedIssue} />
              ))}
            </div>
          )}
        </div>
      ) : (

        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 max-w-6xl mx-auto">
          {visibleIssues.map(issue => (
            <motion.div key={issue.id} whileHover={{ scale:1.02 }}>
              <Card className="overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-2xl cursor-pointer">
                
                {/* Cover */}
                <div className="relative w-full h-48">
                  <Image src={issue.image} alt={issue.title} fill className="object-cover"/>
                </div>

                {/* Details */}
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full font-semibold">
                      {issue.category}
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      {issue.price > 0 && <Wallet size={11}/>} {issue.price === 0 ? "Free" : `₹${issue.price}`}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                    {issue.title}
                  </h3>

                  <Button
                    onClick={() => setSelectedIssue(issue)}
                    variant="outline"
                    className="w-full border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all rounded-full text-xs"
                  >
                    <Eye size={11} className="mr-2"/> View Issue
                  </Button>

                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Issue Modal */}
      {selectedIssue && <IssueModal issue={selectedIssue} onClose={() => setSelectedIssue(null)}/>}

    </div>
  );
}

/* Small helper component for Continuing + Recommended cards */
function IssueCard({ issue, onSelect }: { issue: Issue; onSelect: (iss: Issue) => void }) {
  return (
    <motion.div whileHover={{scale:1.03}}>
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-md overflow-hidden">
        <div className="relative w-full h-48">
          <Image src={issue.image} alt={issue.title} fill className="object-cover"/>
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full font-semibold">
              {issue.category}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
              {issue.price > 0 && <Wallet size={11}/>} {issue.price === 0 ? "Free" : `₹${issue.price}`}
            </span>
          </div>

          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
            {issue.title}
          </h3>

          <Button onClick={() => onSelect(issue)} variant="outline" className="w-full border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 hover:bg-indigo-50 rounded-full text-xs flex items-center justify-center gap-1">
            <Eye size={11}/> View
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
