"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image"; // ✅ FIXED: proper next/image import
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card"; // ✅ FIXED import
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Bookmark, Wallet, LibraryBig, Award, Eye } from "lucide-react";

/* Types */
interface Issue {
  id: number;
  title: string;
  author: string;
  category: string;
  image: string;
  progress: number;
  lastRead: string;
  price: number;
}

/* Use 10 authors in sections later (AuthorSection already handles display, unchanged) */

/* Demo Issue Data */
const continueIssues: Issue[] = [
  {
    id: 1,
    title: "Future of Technology",
    author: "Sarah Chen",
    category: "Technology",
    image: "/images/tech1.jpg",
    progress: 65,
    lastRead: "2 hours ago",
    price: 299
  },
  {
    id: 2,
    title: "Creative Minds",
    author: "Emma Rodriguez",
    category: "Art & Culture",
    image: "/images/art1.jpg",
    progress: 30,
    lastRead: "Yesterday",
    price: 249
  },
  {
    id: 3,
    title: "Science Today",
    author: "James Wilson",
    category: "Science",
    image: "/images/science1.jpg",
    progress: 100,
    lastRead: "3 days ago",
    price: 349
  }
];

const recommendedIssues: Issue[] = [
  {
    id: 4,
    title: "Design Revolution 2025",
    author: "Lina Kostova",
    category: "Design",
    image: "/images/design1.jpg",
    progress: 0,
    lastRead: "",
    price: 199
  },
  {
    id: 5,
    title: "AI Ethics & Society",
    author: "Kabir Mehta",
    category: "AI & Ethics",
    image: "/images/ai1.jpg",
    progress: 0,
    lastRead: "",
    price: 299
  },
  {
    id: 6,
    title: "Health & Wellness Guide",
    author: "Aditi Rao",
    category: "Health",
    image: "/images/health1.jpg",
    progress: 0,
    lastRead: "",
    price: 149
  }
];

/* New Events Section Data */
const events = [ // ✅ FIXED: was missing this
  {
    id: 1,
    title: "Author Connect Live 2025",
    image: "/images/event1.jpg",
    date: "Jan 22, 2025",
    description: "A global webinar featuring award-winning storytellers."
  },
  {
    id: 2,
    title: "Future of Digital Publishing Summit",
    image: "/images/event2.jpg",
    date: "Feb 14, 2025",
    description: "Panel discussions on AI, media, and evolving reader trends."
  },
  {
    id: 3,
    title: "Voices of Tomorrow — Writers Meet",
    image: "/images/event3.jpg",
    date: "Mar 03, 2025",
    description: "Celebrating and mentoring next-gen literary talent."
  }
];

/* Stat Card Component */
function StatCard({ label, value, Icon, prefix }: { label: string; value: string | number; Icon: any; prefix?: string }) {
  return (
    <Card className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
      <CardContent className="p-0 flex justify-between items-center">
        <div className="h-11 w-11 bg-indigo-600/10 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
          <Icon className="text-indigo-600 dark:text-indigo-400" size={20}/>
        </div>
        <div className="text-right">
          <p className="text-xs text-sleet-500 dark:text-sleet-400">{label}</p>
          <h3 className="text-xl font-bold text-sleet-900 dark:text-white">
            {prefix ? `${prefix}${value}` : value}
          </h3>
        </div>
      </CardContent>
    </Card>
  );
}

/* Continue/Recommended Issue Card Component */
function IssueCard({ issue, isContinue }: { issue: Issue; isContinue?: boolean }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }}>
      <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-sleet-200 dark:border-sleet-700 overflow-hidden flex items-stretch">
        <div className="relative w-32 h-32 flex-shrink-0">
          <Image src={issue.image} alt={issue.title} fill className="object-cover"/>
        </div>

        <CardContent className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-sleet-900 dark:text-white">{issue.title}</h3>

            {isContinue && (
              <p className="text-[10px] text-sleet-500 dark:text-sleet-400 flex items-center gap-1">
                <Clock size={12}/> Last read {issue.lastRead}
              </p>
            )}

            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">{issue.category}</p>

            {!isContinue && issue.price && (
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 mt-2">
                ₹{issue.price}
              </p>
            )}

            {/* Progress Bar (only for Continue Reading cards) */}
            {isContinue && (
              <div className="mt-3">
                <div className="text-[10px] text-sleet-500 dark:text-sleet-400 flex justify-between mb-1">
                  <span>Progress</span>
                  <span>{issue.progress}%</span>
                </div>
                <div className="w-full bg-indigo-200 dark:bg-indigo-900/40 h-1.5 rounded-full">
                  <motion.div
                    animate={{ width: `${issue.progress}%` }}
                    className="bg-indigo-600 h-full rounded-full"
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <div className="p-6 flex items-center">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-xs">
            {isContinue ? "Continue →" : <><Eye size={14} className="mr-1"/> View</>}
          </Button>
        </div>

      </Card>
    </motion.div>
  );
}

export default function DashboardHome() {
  const router = useRouter();
  const [stats] = useState({
    purchased: 24,
    readingTime: "48h",
    bookmarks: 156,
    totalSpent: 180
  });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 px-6 py-16 space-y-12">

      {/* Welcome */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-sleet-900 dark:text-white">Welcome Back!</h1>
        <p className="text-lg text-sleet-600 dark:text-sleet-400">Here&apos;s your reading overview</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <StatCard label="Purchased Issues" value={stats.purchased} Icon={LibraryBig}/>
        <StatCard label="Reading Time" value={continueIssues.find(i=>i.progress>0)?.lastRead||stats.readingTime} Icon={Clock}/>
        <StatCard label="Bookmarks" value={stats.bookmarks} Icon={Bookmark}/>
        <StatCard label="Total Spent" value={stats.totalSpent} Icon={Wallet} prefix="$"/>
      </div>

      {/* Continue Reading */}
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-sleet-900 dark:text-white flex items-center gap-2">
            <LibraryBig size={18} className="text-indigo-600"/> Continue Reading
          </h2>
          <Link href="/issues">
            <Button variant="ghost" className="text-xs hover:text-indigo-600">View All</Button>
          </Link>
        </div>
        <div className="space-y-5">{continueIssues.map(i => <IssueCard key={i.id} issue={i} isContinue/>)}</div>
      </div>

      {/* Recommended */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-sleet-900 dark:text-white mb-6 flex items-center gap-2">
          <Bookmark size={18} className="text-purple-600"/> Recommended For You
        </h2>
        <div className="space-y-5">{recommendedIssues.map(i=> <IssueCard key={i.id} issue={i}/>)}</div>
      </div>

      {/* Our Events */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-sleet-900 dark:text-white mb-6 flex items-center gap-2">
          <Award size={18} className="text-purple-600"/> Our Events
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(ev => (
            <motion.div key={ev.id} whileHover={{ scale:1.03 }}>
              <Card className="bg-white dark:bg-sleet-900 rounded-2xl shadow-md overflow-hidden border border-sleet-200 dark:border-sleet-700">
                <div className="relative h-44 w-full">
                  <Image src={ev.image} alt={ev.title} fill className="object-cover"/>
                </div>
                <CardContent className="p-5 text-center">
                  <p className="text-[10px] text-sleet-500">{ev.date}</p>
                  <h3 className="font-bold text-lg text-indigo-600">{ev.title}</h3>
                  <p className="text-xs text-sleet-700 mt-2">{ev.description}</p>

                  <Button variant="outline" className="mt-4 text-xs border-indigo-600 text-indigo-600 rounded-full px-4 py-1">
                    Details
                  </Button>

                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA or more sections unchanged */}
      <div className="text-center pt-16">
        <Button className="text-white bg-indigo-600 hover:bg-indigo-700 rounded-full px-6 text-lg" onClick={()=>router.push('/issues')}>
          Browse More Issues
        </Button>
      </div>

    </div>
  );
}
