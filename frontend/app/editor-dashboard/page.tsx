"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  CalendarClock,
  FileCheck2,
  AlertTriangle,
  UserCircle,
  Eye,
  X,
  Search,
  PenTool,
  Users,
  TrendingUp,
  Tag,
  BookOpen,
  Layers,
  BarChart3,
  Sparkles,
  Shield,
  LineChart,
} from "lucide-react";


import { getJSON } from "@/lib/api";

type Priority = "High" | "Medium" | "Mid" | "Low";
type ReviewStatus = "In Progress" | "Pending Review" | "Completed Review" | "Needs Revision" | "under_review" | "approved" | "changes_requested" | "assigned" | "completed";

// Badge styles remain same, extended for new statuses
const badgeStyles: Record<string, string> = {
  "High": "bg-red-100 text-red-600 px-3 py-1 rounded-full",
  "Medium": "bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full",
  "Low": "bg-slate-200 text-black dark:bg-slate-700 dark:text-white px-3 py-1 rounded-full",
  "Mid": "bg-blue-100 text-blue-600 px-3 py-1 rounded-full",
  "In Progress": "bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full",
  "Pending Review": "bg-orange-100 text-orange-600 px-3 py-1 rounded-full",
  "Completed Review": "bg-green-100 text-green-600 px-3 py-1 rounded-full",
  "Needs Revision": "bg-red-200 text-red-700 px-3 py-1 rounded-full",
  "under_review": "bg-blue-100 text-blue-600 px-3 py-1 rounded-full",
  "approved": "bg-green-100 text-green-600 px-3 py-1 rounded-full",
  "changes_requested": "bg-orange-100 text-orange-600 px-3 py-1 rounded-full",
  "assigned": "bg-gray-100 text-gray-600 px-3 py-1 rounded-full",
};

export default function AssignedPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modalArticle, setModalArticle] = useState<any | null>(null);

  const [assignedArticles, setAssignedArticles] = useState<any[]>([]);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [assignedRes, submittedRes] = await Promise.all([
        getJSON("/editor/assigned"),
        getJSON("/editor/submitted")
      ]);

      if (assignedRes.status === 'success') {
        const mapped = assignedRes.data.map((item: any) => ({
          id: item.article_id,
          title: item.title,
          assignedDate: new Date(item.assigned_date).toLocaleDateString(),
          author: "Unknown Author", // Join backend to get author name? Backend does currently join content but maybe not author details fully or mapped. 
          // Actually getAssignedForEditor controller does not return author name. 
          // I'll leave as Unknown or update Controller later if needed.
          dueDate: item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No Deadline',
          priority: item.priority || 'Medium',
          status: item.assignment_status === 'in_progress' ? 'In Progress' : item.assignment_status, // map if needed
          progress: item.assignment_status === 'assigned' ? 0 : 50,
          image: "/images/placeholder.jpg"
        }));
        setAssignedArticles(mapped);
      }

      if (submittedRes.status === 'success') {
        setSubmittedCount(submittedRes.data.length);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };


  const handleOpenModal = (id: number) => {
    const found = assignedArticles.find(a => a.id === id);
    if (found) setModalArticle(found);
  };

  const closeModal = () => setModalArticle(null);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-2"
        >
          Editor Dashboard
        </motion.h1>

        <p className="text-slate-600 dark:text-slate-400 mb-10">
          Review, proof, and edit e-magazine articles
        </p>

        {/* Main Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard label="Assigned Articles" value={assignedArticles.length} icon={ClipboardList} />
          <StatCard label="Reviewed (Submitted)" value={submittedCount} icon={FileCheck2} />
          <StatCard label="In Progress" value={assignedArticles.filter(a => a.status === 'In Progress' || a.status === 'in_progress').length} icon={BookOpen} />
          {/* Placeholder for now */}
          <StatCard label="Needs Revision" value={0} icon={AlertTriangle} />
        </div>

        {/* Article Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-4">Article</th>
                <th className="px-5 py-4">Author</th>
                <th className="px-5 py-4">Due</th>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Progress</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {assignedArticles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No active assignments found.
                  </td>
                </tr>
              ) : (
                assignedArticles
                  .filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
                  .map(article => (
                    <motion.tr
                      key={article.id}
                      whileHover={{ backgroundColor: "rgba(99,102,241,0.05)" }}
                      className="border-b border-slate-100 dark:border-slate-700"
                    >
                      <td className="px-5 py-4 min-w-[200px]">
                        <p className="font-semibold">{article.title}</p>
                        <p className="text-[11px] text-slate-500">Assigned: {article.assignedDate}</p>
                      </td>

                      <td className="px-5 py-4 min-w-[140px]">
                        <div className="flex items-center gap-1.5 font-medium">
                          <UserCircle size={15} className="text-indigo-600" />
                          {article.author}
                        </div>
                      </td>

                      <td className="px-5 py-4 min-w-[120px] text-indigo-600 font-medium">
                        {article.dueDate}
                      </td>

                      <td className="px-5 py-4"><span className={badgeStyles[article.status] || badgeStyles['assigned']}>{article.status}</span></td>
                      {/* <td className="px-5 py-4"><span className={badgeStyles[article.status]}>{article.status}</span></td> */}

                      {/* Progress Bar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                            <motion.div
                              animate={{ width: `${article.progress}%` }}
                              className="h-full bg-indigo-600"
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <span className="text-[10px]">{article.progress}%</span>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-center gap-2">

                          {/* VIEW → Reader Preview */}
                          <Button
                            onClick={() => router.push(`/editor-dashboard/preview/${article.id}`)}
                            className="bg-white hover:bg-indigo-600 text-black dark:text-white dark:bg-slate-900 border text-xs rounded-full px-3 py-1"
                          >
                            <Eye size={13} /> View
                          </Button>


                          {/* EDIT → CMS Editor */}
                          <Button
                            onClick={() => router.push(`/editor-dashboard/assigned/${article.id}/edit`)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-full px-3 py-1.5"
                          >
                            <PenTool size={13} /> Edit
                          </Button>

                        </div>
                      </td>

                    </motion.tr>
                  )))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Summary (quick proofing) */}
      {modalArticle && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl border border-slate-200 dark:border-slate-700"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{modalArticle.title}</h2>
              <Button variant="ghost" onClick={closeModal}><X size={18} /></Button>
            </div>

            <div className="flex gap-4">
              <div className="w-28 h-28 relative rounded-xl overflow-hidden border border-slate-200">
                <Image src={modalArticle.image} alt="" fill className="object-cover" />
              </div>

              <div className="flex-1 text-sm space-y-2">
                <p className="font-semibold flex items-center gap-1"><Users size={14} /> {modalArticle.author}</p>
                <p className="text-slate-400 flex items-center gap-1"><CalendarClock size={14} /> Due: {modalArticle.dueDate}</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${modalArticle.progress}%` }} className="h-full bg-indigo-600" />
                </div>
                <p className="text-[10px] text-slate-500">{modalArticle.progress}% Completed</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );

}

/* Reused Components */
function StatCard({ label, value, icon: Icon }: { label: string, value: number, icon: any }) {
  return (
    <Card className="p-4 rounded-2xl border bg-white dark:bg-slate-800 shadow-sm">
      <CardContent className="p-0 flex justify-between items-center">
        <Icon className="h-6 w-6 text-indigo-600" />
        <div className="text-right flex-1">
          <p className="text-[10px] text-slate-500">{label}</p>
          <h2 className="text-2xl font-bold">{value}</h2>
        </div>
      </CardContent>
    </Card>
  );
}

function UtilityCard({ title, desc, icon: Icon }: { title: string, desc: string, icon: any }) {
  return (
    <Card className="p-4 rounded-2xl border bg-white dark:bg-slate-800 shadow-sm">
      <CardContent className="p-0 flex gap-3 items-center">
        <Icon size={20} className="text-indigo-600" />
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ title, icon: Icon }: { title: string, icon: any }) {
  return (
    <Card className="p-4 rounded-2xl border bg-white dark:bg-slate-800 shadow-sm">
      <CardContent className="p-0 flex gap-2 items-center">
        <Icon size={18} className="text-indigo-500" />
        <p className="font-semibold text-xs">{title}</p>
      </CardContent>
    </Card>
  );
}

function ActionCard({ title, desc, icon: Icon, link }: { title: string, desc: string, icon: any, link: string }) {
  return (
    <Link href={link}>
      <Card className="p-4 hover:shadow-md transition rounded-2xl bg-slate-50 dark:bg-slate-900 border">
        <CardContent className="p-0 flex gap-3 items-center">
          <Icon size={20} className="text-indigo-600" />
          <div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
