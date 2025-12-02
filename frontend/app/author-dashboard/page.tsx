"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, MessageSquare, Clock, FileCheck, FileClock, PenTool, LayoutDashboard, Search } from "lucide-react";
import { motion } from "framer-motion";
import router from "next/router";

type Status = "Published" | "In Review" | "Revise" | "Draft" | "Rejected";

type Article = {
  id: number;
  title: string;
  time: string;
  views: number;
  comments: number;
  status: Status;
};

const articleData: Article[] = [
  { id:1, title:"The Future of AI in Healthcare", time:"2 days ago", views:1234, comments:45, status:"Published" },
  { id:2, title:"Quantum Computing: Breaking Barriers", time:"5 days ago", views:0, comments:12, status:"In Review" },
  { id:3, title:"Sustainable Energy 2025", time:"1 week ago", views:0, comments:0, status:"Revise" },
  { id:4, title:"The Rise of Decentralized Finance", time:"2 weeks ago", views:0, comments:0, status:"Draft" },
  { id:5, title:"AI Ethics in Journalism", time:"3 weeks ago", views:0, comments:0, status:"Rejected" },
  { id:6, title:"Storytelling for Digital Media", time:"1 month ago", views:0, comments:4, status:"Rejected" },
  { id:7, title:"Modern Newsroom Automation", time:"1 month ago", views:0, comments:34, status:"Rejected" },
  { id:8, title:"Climate Change Impact Study", time:"2 months ago", views:0, comments:9, status:"Draft" }
];

const statusStyles: Record<Status, string> = {
  Published: "bg-indigo-600 text-white",
  "In Review": "bg-blue-600 text-white",
  Revise: "bg-yellow-500 text-black",
  Draft: "bg-slate-300 text-black dark:bg-slate-700 dark:text-white",
  Rejected: "bg-red-600 text-white",
};

export default function DashboardHome() {
  const [search, setSearch] = useState("");
  const [profileComplete, setProfileComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const personal = localStorage.getItem("signup-personal-info");
    const payment = localStorage.getItem("signup-payment-details");

    const completed = Boolean(personal && payment);
    setProfileComplete(completed);

    if (completed) {
      setProgress(100);
    } else {
      let p = 0;
      if (personal) p += 50;
      if (payment) p += 50;
      setProgress(p);
    }
  }, []);

  if (!profileComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-[65vh] p-4">
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
          <Card className="w-[360px] sm:w-[400px] p-6 rounded-2xl border-2 border-indigo-600 shadow-lg bg-white dark:bg-slate-800">
            <CardContent className="p-0 space-y-4 text-center">
              <LayoutDashboard className="w-10 h-10 mx-auto text-indigo-600"/>

              <h3 className="text-lg font-bold">⚠ Complete Author Signup</h3>
              
              <p className="text-xs text-slate-600 dark:text-slate-300">
                You must complete both personal and payout details before accessing the Author Dashboard.
              </p>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-indigo-600"
                  transition={{ duration: 0.6 }}
                />
              </div>

              <p className="text-[10px] text-slate-500">{progress}% completed</p>

              <Button
                onClick={() => router.push("/author-dashboard/profile")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-xs mt-3"
              >
                Complete Signup →
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // If profile complete show dashboard
  const filtered = articleData.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
  const rows = filtered.slice(0, 5);

  return (
    <div className="space-y-6 opacity-100 pointer-events-auto">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <LayoutDashboard className="h-6 text-indigo-600"/> Author Dashboard
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage your articles and track performance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Published" value={rows.filter(a=>a.status==="Published").length} icon={FileCheck} color="indigo"/>
        <StatCard label="In Review" value={rows.filter(a=>a.status==="In Review").length} icon={FileClock} color="blue"/>
        <StatCard label="Drafts" value={rows.filter(a=>a.status==="Draft").length} icon={PenTool} color="slate"/>
        <StatCard label="Comments" value={rows.reduce((acc,a)=>acc+a.comments,0)} icon={MessageSquare} color="purple"/>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <input
          placeholder="Search"
          className="w-full bg-slate-100 dark:bg-slate-800 pl-10 border text-sm py-2 rounded-lg"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
      </div>

      {/* Article Rows */}
      {rows.map(article => (
        <motion.div key={article.id} whileHover={{ scale: 1.01 }}>
          <Card className="flex justify-between items-center px-5 py-4 rounded-xl border bg-white dark:bg-slate-800 shadow-md hover:border-indigo-600">
            <div className="flex flex-col flex-1 gap-1">
              <h4 className="text-lg font-semibold">{article.title}</h4>
              <span className="text-[10px] flex items-center gap-1 text-slate-500">
                <Clock className="h-3"/> {article.time}
              </span>

              <div className="flex items-center gap-4 text-xs mt-1 text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1"><Eye className="h-3"/> {article.views}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3"/> {article.comments}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-[10px] ${statusStyles[article.status]}`}>
                {article.status}
              </span>

              <Button className="bg-indigo-600 hover:bg-indigo-700 text-[10px] text-white rounded-full px-4 py-1.5">
                <Eye className="h-3"/> View
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function StatCard({label, value, icon:Icon, color}:{label:string, value:number, icon:any, color: 'indigo' | 'blue' | 'purple' | 'slate'}) {
  const map = { indigo:"text-indigo-600", blue:"text-blue-600", purple:"text-purple-600", slate:"text-slate-700 dark:text-slate-300" };
  return (
    <Card className="rounded-xl border bg-slate-100 dark:bg-slate-800 text-center">
      <CardContent className="p-4 flex justify-between items-center">
        <Icon className={`h-5 ${map[color]}`}/>
        <div className="text-right flex-1">
          <p className="text-[10px] text-slate-500">{label}</p>
          <h2 className="text-xl font-bold">{value}</h2>
        </div>
      </CardContent>
    </Card>
  );
}
