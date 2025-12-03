"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flame, TrendingUp, Star, Rocket, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

// Topics for rows (like Wattpad)
const topics = [
  { key: "Trending", label: "Trending Now", icon: TrendingUp },
  { key: "Editors Pick", label: "Editor’s Picks", icon: Star },
  { key: "Popular Around You", label: "Popular Around You", icon: Flame },
  { key: "New Release", label: "New Releases", icon: Rocket },
];

// Dummy Magazine Issue Data
const magazines = [
  {
    id: 1,
    title: "Tech Today - December",
    category: "Trending Now",
    cover: "/covers/trending-ai.jpg",
    articles: 12,
    price: "$5.99",
    date: "2025-12-01",
  },
  {
    id: 2,
    title: "Startup Weekly - Vol 8",
    category: "Editor’s Picks",
    cover: "/covers/editors-startups.jpg",
    articles: 8,
    price: "$3.49",
    date: "2025-11-15",
  },
  {
    id: 3,
    title: "Local Buzz - September",
    category: "Popular Around You",
    cover: "/covers/hot-newsroom.jpg",
    articles: 15,
    price: "$4.25",
    date: "2025-09-10",
  },
  {
    id: 4,
    title: "Design Futures 2026",
    category: "New Releases",
    cover: "/covers/new-design.jpg",
    articles: 6,
    price: "$6.00",
    date: "2025-10-20",
  },
  {
    id: 5,
    title: "Eco Innovations - July",
    category: "Trending Now",
    cover: "/covers/neutral-tech.jpg",
    articles: 10,
    price: "$2.99",
    date: "2025-07-05",
  },
  {
    id: 6,
    title: "Space Media - Special",
    category: "Popular Around You",
    cover: "/covers/space-media.jpg",
    articles: 9,
    price: "$9.50",
    date: "2025-08-18",
  },
];

// Reusable row slider component
function MagazineRow({ title, icon: Icon, items }: any) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const handleNext = () => {
    setIndex((prev: number) => (prev >= items.length - 3 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setIndex((prev: number) => (prev <= 0 ? items.length - 3 : prev - 1));
  };

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => handleNext(), 3000);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div className="space-y-4">
      {/* Row Header */}
      <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
        <Icon size={18} className="text-indigo-600" /> {title}
      </h3>

      {/* Slider */}
      <div
        className="relative max-w-full overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <motion.div
          className="flex gap-5"
          animate={{ x: -index * 360 }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        >
          {items.map((mag: any) => (
            <Card key={mag.id} className="min-w-[340px] bg-white dark:bg-slate-800 shadow-lg rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700">
              <div className="relative w-full h-40">
                <Image src={mag.cover} alt={mag.title} fill className="object-cover" />
              </div>

              {/* Card Details */}
              <CardContent className="p-4 text-center space-y-2">
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-700/40 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full w-fit font-medium mx-auto">
                  {mag.category}
                </span>

                <h4 className="font-semibold text-md">{mag.title}</h4>
                <p className="text-[12px] text-slate-500">📚 {mag.articles} articles</p>
                <p className="text-sm font-medium text-indigo-600">{mag.price}</p>

                <Button
                  onClick={() => router.push(`/articles/${mag.id}/preview`)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl flex justify-center gap-1"
                >
                  <Eye size={12} /> Read Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Arrows */}
        <button onClick={handlePrev} className="absolute left-1 top-1/2 -translate-y-1/2 bg-white shadow p-2 rounded-full hover:scale-105">←</button>
        <button onClick={handleNext} className="absolute right-1 top-1/2 -translate-y-1/2 bg-white shadow p-2 rounded-full hover:scale-105">→</button>
      </div>
    </div>
  );
}

export default function IssuesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const topicData: any = {
    "Trending Now": magazines.filter((m) => m.category === "Trending Now"),
    "Editor’s Picks": magazines.filter((m) => m.category === "Editor’s Picks"),
    "Popular Around You": magazines.filter((m) => m.category === "Popular Around You"),
    "New Releases": magazines.filter((m) => m.category === "New Releases"),
  };

  return (
    <main className="min-h-screen bg-white dark:bg-slate-900 px-6 py-12 space-y-12">

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          All Magazine Issues
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
          Browse our complete collection
        </p>
      </div>

      {/* Global Search */}
      <div className="flex justify-center">
        <Input
          placeholder="Search issues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 dark:text-white"
        />
      </div>

      {/* Searched Result Grid */}
      {search && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-center">
          {magazines
            .filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
            .map((mag: any) => (
              <Card key={mag.id} className="overflow-hidden bg-white dark:bg-slate-800 shadow-md rounded-xl border dark:text-white">
                <div className="relative w-full h-48">
                  <Image src={mag.cover} alt={mag.title} fill className="object-cover" />
                </div>

                <div className="p-4 text-center space-y-1">
                  <h4 className="font-semibold text-md">{mag.title}</h4>
                  <p className="text-xs text-slate-500">{mag.articles} articles</p>
                  <p className="text-sm font-medium text-indigo-600">{mag.price}</p>

                  <Button onClick={() => router.push(`/articles/${mag.id}/preview`)} className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl">
                    Read Now →
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* Topic Rows */}
      {!search && (
        <div className="space-y-14">
          {topics.map((topic) => (
            <MagazineRow
              key={topic.key}
              title={topic.label}
              icon={topic.icon}
              items={topicData[topic.label.replace(" →", "")] || magazines.filter(m => m.category === topic.label)}
            />
          ))}
        </div>
      )}

    </main>
  );
}
