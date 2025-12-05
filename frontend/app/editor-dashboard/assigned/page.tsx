"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  AlertTriangle,
  UserCircle,
  MessageSquare,
  PenTool,
  Tag,
  Clock,
  Layers,
} from "lucide-react";

type Priority = "High" | "Medium" | "Mid" | "Low";

type AssignedArticle = {
  id: number;
  title: string;
  category: string;
  assignedDate: string;
  dueDate: string;
  priority: Priority;
  adminComment: string;
  commentCount: number;
};

const assignedArticles: AssignedArticle[] = [
  {
    id: 1,
    title: "Blockchain Revolution in Finance",
    category: "Finance & Crypto",
    assignedDate: "Nov 14, 2025",
    dueDate: "Nov 20, 2025",
    priority: "High",
    adminComment: "Needs strong fact checking for financial claims.",
    commentCount: 4,
  },
  {
    id: 2,
    title: "Climate Change and Technology",
    category: "Environment",
    assignedDate: "Nov 15, 2025",
    dueDate: "Nov 21, 2025",
    priority: "Medium",
    adminComment: "Verify statistics. Avoid political bias.",
    commentCount: 2,
  },
  {
    id: 3,
    title: "Future of Remote Work",
    category: "Work & Lifestyle",
    assignedDate: "Nov 13, 2025",
    dueDate: "Nov 19, 2025",
    priority: "High",
    adminComment: "Prepare version for both mobile and web layouts.",
    commentCount: 5,
  },
  {
    id: 4,
    title: "AI Ethics and Governance",
    category: "Technology & Ethics",
    assignedDate: "Nov 16, 2025",
    dueDate: "Nov 22, 2025",
    priority: "Low",
    adminComment: "Align with magazine’s editorial values. Check citations.",
    commentCount: 1,
  },
  {
    id: 5,
    title: "Editorial Design Systems",
    category: "Design",
    assignedDate: "Nov 18, 2025",
    dueDate: "Dec 01, 2025",
    priority: "Mid",
    adminComment: "Ensure components follow internal design system.",
    commentCount: 3,
  },
];

const priorityBadge: Record<Priority, string> = {
  High: "bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-medium",
  Medium: "bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-medium",
  Mid: "bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-medium",
  Low: "bg-slate-200 text-black dark:bg-slate-700 dark:text-white px-3 py-1 rounded-full text-[10px] font-medium",
};

export default function AssignedPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-1"
        >
          Assigned Issues & Articles
        </motion.h1>

        <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">
          Overview, audit, and edit magazine content
        </p>

        {/* Search bar */}
        <div className="mb-7 flex justify-center">
          <div className="relative w-full max-w-md">
            <input
              placeholder="Search assigned content..."
              className="w-full bg-slate-100 dark:bg-slate-800 pl-8 border border-slate-300 dark:border-slate-700 text-[10px] py-2.5 rounded-xl outline-none focus:border-indigo-600 transition"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Tag className="absolute left-2.5 top-2 text-slate-500" size={12}/>
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedArticles
            .filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
            .map(article => (
            <motion.div
              key={article.id}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden h-full">

                <CardContent className="p-5 flex flex-col justify-between h-full">

                  {/* Top section */}
                  <div>
                    <h2 className="text-lg font-bold mb-2 leading-snug">
                      {article.title}
                    </h2>

                    {/* Category */}
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg text-[10px] font-medium mb-3">
                      <Layers size={10}/> {article.category}
                    </span>

                    {/* Dates */}
                    <div className="space-y-1 text-slate-600 dark:text-slate-400 text-[10px] mb-3">
                      <p className="flex items-center gap-1">
                        <CalendarClock size={11}/> Assigned: {article.assignedDate}
                      </p>
                      <p className="flex items-center gap-1">
                        <AlertTriangle size={11}/> Due: {article.dueDate}
                      </p>
                    </div>

                    {/* Priority */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={priorityBadge[article.priority]}>
                        {article.priority}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] text-slate-500">
                        <Clock size={9}/> {article.dueDate}
                      </span>
                    </div>

                    {/* Admin comment */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-[10px] leading-relaxed text-slate-700 dark:text-slate-300 mb-4">
                      <p className="flex items-center gap-1 font-semibold mb-1 text-indigo-600">
                        <MessageSquare size={12}/> Admin Comment
                      </p>
                      {article.adminComment}
                    </div>
                  </div>

                  {/* Bottom section */}
                  <div className="flex items-center justify-between mt-2">

                    {/* Comment count */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <MessageSquare size={11}/> {article.commentCount} comments
                    </div>

                    {/* Edit button → different page */}
                    <Button
                      onClick={() => router.push(`/editor-dashboard/assigned/${article.id}/edit`)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] rounded-full px-4 py-1.5 flex items-center gap-1 shadow-sm"
                    >
                      <PenTool size={11}/> Edit
                    </Button>

                  </div>

                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
