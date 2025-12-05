"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart2, Clock, FileCheck2, RefreshCw, Layers, TrendingUp, Calendar, Tag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type CategoryStats = {
  category: string;
  edits: number;
  avgTime: string;
  qualityScore: number;
};

const mockOverview = {
  totalEdits: 342,
  avgTurnaround: "7.4 hours",
  revisionCycles: 128,
  qualityScore: 92,
};

const mockCategoryStats: CategoryStats[] = [
  { category: "Technology", edits: 141, avgTime: "6.2 hr", qualityScore: 95 },
  { category: "Environment", edits: 78, avgTime: "7.9 hr", qualityScore: 88 },
  { category: "Lifestyle", edits: 64, avgTime: "8.4 hr", qualityScore: 90 },
  { category: "Business", edits: 59, avgTime: "6.8 hr", qualityScore: 93 },
];

export default function AnalyticsPage() {
  const [selected, setSelected] = useState<CategoryStats | null>(null);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={22} className="text-indigo-600" />
        <h1 className="text-xl font-bold">Editing Analytics</h1>
      </div>

      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-6">
        View your editing performance, efficiency and category-wise statistics.
      </p>

      {/* Overview Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <AnalyticsCard
          title="Total Edits Completed"
          value={mockOverview.totalEdits.toString()}
          icon={<FileCheck2 size={20} className="text-green-600" />}
        />

        <AnalyticsCard
          title="Avg Turnaround Time"
          value={mockOverview.avgTurnaround}
          icon={<Clock size={20} className="text-indigo-600" />}
        />

        <AnalyticsCard
          title="Revision Cycles"
          value={mockOverview.revisionCycles.toString()}
          icon={<RefreshCw size={20} className="text-orange-600" />}
        />

        <AnalyticsCard
          title="Quality Score"
          value={mockOverview.qualityScore + "%"}
          icon={<BarChart2 size={20} className="text-blue-600" />}
        />
      </div>

      {/* Category Stats Title */}
      <h2 className="font-bold text-sm flex items-center gap-2 mb-3">
        <Layers size={14} className="text-indigo-600" /> Category-Wise Editing Stats
      </h2>

      {/* Category Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {mockCategoryStats.map((cat, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelected(cat)}
          >
            <Card className="rounded-xl bg-white dark:bg-slate-800 border shadow-sm cursor-pointer">
              <CardContent className="p-5">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Tag size={10} /> {cat.category}
                </p>

                <h3 className="font-semibold text-sm mb-2">{cat.edits} Edits</h3>

                <div className="text-[10px] space-y-1 text-slate-600 dark:text-slate-300">
                  <p className="flex items-center gap-1">
                    <Clock size={11} /> Avg Time: {cat.avgTime}
                  </p>
                  <p className="flex items-center gap-1">
                    <TrendingUp size={11} /> Quality Score: {cat.qualityScore}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Trend Box */}
      <Card className="rounded-xl bg-indigo-50 dark:bg-slate-800/50 border border-indigo-200 dark:border-slate-700 p-6 mb-8">
        <h3 className="font-bold text-sm flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-300">
          <Calendar size={14} /> Monthly Trends (Preview)
        </h3>

        <p className="text-[10px] text-slate-600 dark:text-slate-300 mb-3">
          Detailed monthly analytics (charts, graphs and timelines) will be
          generated here from backend data.
        </p>

        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-400">
          Chart Placeholder
        </div>
      </Card>

      {/* Selected Category Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full border shadow-xl"
          >
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <Layers size={16} className="text-indigo-600" />
              {selected.category} Stats
            </h3>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">
              Detailed breakdown of your editing activity in this category.
            </p>

            <div className="space-y-2 text-[10px] text-slate-600 dark:text-slate-300 mb-4">
              <p><strong>Edits:</strong> {selected.edits}</p>
              <p><strong>Average Time:</strong> {selected.avgTime}</p>
              <p><strong>Quality Score:</strong> {selected.qualityScore}%</p>
            </div>

            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 mb-4">
              Category Chart Placeholder
            </div>

            <Button
              onClick={() => setSelected(null)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-full py-2"
            >
              Close
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* Component: Analytics Overview Cards */
function AnalyticsCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl bg-white dark:bg-slate-800 border shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[10px] text-slate-500">{title}</p>
          {icon}
        </div>
        <h3 className="text-lg font-bold">{value}</h3>
      </CardContent>
    </Card>
  );
}
