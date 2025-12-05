"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  CalendarDays,
  Hash,
  Star,
  Trophy,
  Download,
  CheckCircle2,
} from "lucide-react";

const certificates = [
  {
    id: "RM-EX-99231",
    title: "Editing Excellence Certificate",
    desc: "Awarded for consistently delivering high-quality edits across all categories.",
    issued: "Dec 01, 2025",
    score: 96,
  },
  {
    id: "RM-FT-88312",
    title: "Fast Turnaround Certificate",
    desc: "For completing 15+ assignments before deadlines with exceptional speed.",
    issued: "Nov 20, 2025",
    score: 91,
  },
];

export default function CertificatesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 p-6 max-w-5xl mx-auto text-slate-900 dark:text-slate-100">

      <div className="flex items-center gap-2 mb-2">
        <Award size={22} className="text-indigo-600" />
        <h1 className="text-xl font-bold">Certificates</h1>
      </div>

      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-6">
        View and download your achievement certificates earned through contribution and performance.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {certificates.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className="rounded-xl border bg-white dark:bg-slate-800 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between mb-3">
                  <Award className="text-yellow-500" size={26} />
                  <Star size={14} className="text-yellow-500" />
                </div>

                <h3 className="font-semibold text-sm">{c.title}</h3>
                <p className="text-[10px] text-slate-500 mt-1">{c.desc}</p>

                <div className="text-[10px] text-slate-400 dark:text-slate-300 mt-3 space-y-1">
                  <p className="flex items-center gap-1"><CalendarDays size={11}/> Issued: {c.issued}</p>
                  <p className="flex items-center gap-1"><Hash size={11}/> Certificate ID: {c.id}</p>
                </div>

                <Button className="mt-4 w-full bg-indigo-600 text-white text-xs rounded-full py-2 flex items-center justify-center gap-1">
                  <Download size={12}/> Download PDF
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Trophy size={20} className="text-indigo-600" />
        <h2 className="text-lg font-semibold">Milestones</h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Milestone label="100+ Edits Completed" score={100} />
        <Milestone label="Avg Quality Score Above 90%" score={92} />
        <Milestone label="Editor of the Month" score={98} />
      </div>
    </div>
  );
}

/* Milestone Component */
function Milestone({ label, score }: { label: string; score: number }) {
  return (
    <Card className="rounded-xl border bg-white dark:bg-slate-800 shadow-sm">
      <CardContent className="p-4">
        <p className="text-[10px] text-slate-500">{label}</p>
        <h3 className="text-xl font-semibold">{score}%</h3>
        <CheckCircle2 size={18} className="text-green-600" />
      </CardContent>
    </Card>
  );
}
