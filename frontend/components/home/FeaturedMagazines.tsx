"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// Featured Magazine Mock Data (you can replace with API)
const featuredMagazines = [
  {
    id: 1,
    title: "Tech Today - December",
    category: "Trending Now",
    cover: "/covers/trending-ai.jpg",
    articles: 12,
    price: "$5.99",
  },
  {
    id: 2,
    title: "Editor’s Vision 2025",
    category: "Editor's Picks",
    cover: "/covers/editors-startups.jpg",
    articles: 10,
    price: "$4.99",
  },
  {
    id: 3,
    title: "Design Futures 2026",
    category: "New Releases",
    cover: "/covers/new-design.jpg",
    articles: 6,
    price: "$6.00",
  },
  {
    id: 4,
    title: "Eco Innovations",
    category: "Trending Now",
    cover: "/covers/neutral-tech.jpg",
    articles: 14,
    price: "$3.99",
  },
];

export default function FeaturedMagazines() {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-10">

      {/* Section Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-3">Featured Magazines</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
          Explore trending issues, editor-recommended reads, and our latest premium magazine releases.
        </p>
      </div>

      {/* Featured Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {featuredMagazines.map((mag, i) => (
          <motion.div
            key={mag.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="overflow-hidden bg-white dark:bg-slate-800 shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700">
              
              {/* Cover Image */}
              <div className="relative w-full h-40">
                <Image
                  src={mag.cover}
                  alt={mag.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Card Details */}
              <CardContent className="p-4 text-center space-y-2">
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-700/40 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full w-fit font-medium mx-auto">
                  {mag.category}
                </span>

                <h4 className="font-semibold text-md">{mag.title}</h4>
                <p className="text-[12px] text-slate-500">📚 {mag.articles} articles</p>
                <p className="text-sm font-medium text-indigo-600">{mag.price}</p>

                {/* Read Button */}
                <Button
                  onClick={() => router.push(`/articles/${mag.id}/preview`)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl flex justify-center gap-1"
                >
                  <Eye size={12} /> Read Now
                </Button>
              </CardContent>

            </Card>
          </motion.div>
        ))}

      </div>

      {/* VIEW ALL ISSUES BUTTON */}
      <div className="flex justify-center mt-8">
        <Button
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
          onClick={() => router.push("/issues")}
        >
          View All Issues →
        </Button>
      </div>

    </div>
  );
}
