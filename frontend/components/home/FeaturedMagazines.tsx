"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getJSON } from "@/lib/api";
import { toast } from "react-hot-toast";

// Featured Magazine Mock Data removed
const featuredMagazines: any[] = [];

export default function FeaturedMagazines() {
  const router = useRouter();
  const [magazines, setMagazines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await getJSON('/featured/latest');
        if (res && res.data && res.data.latest && res.data.latest.length > 0) {
          setMagazines(res.data.latest);
        } else {
          // Fallback or try trending
          const resTrending = await getJSON('/featured/trending');
          if (resTrending && resTrending.data && resTrending.data.trending && resTrending.data.trending.length > 0) {
            setMagazines(resTrending.data.trending);
          } else {
            setMagazines([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch featured magazines", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  const handleReadNow = (magId: string) => {
    const userString = localStorage.getItem('user');
    if (!userString) {
      toast.error("Please login to read");
      router.push('/login');
      return;
    }
    router.push(`/reader/article/${magId}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-10">

      {/* Section Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-3">Latest & Trending</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
          Explore our latest releases and trending stories.
        </p>
      </div>

      {/* Featured Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))
        ) : magazines.length > 0 ? (
          magazines.slice(0, 4).map((mag, i) => (
            <motion.div
              key={mag.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="overflow-hidden bg-white dark:bg-slate-800 shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 h-full flex flex-col hover:shadow-xl transition-shadow">

                {/* Cover Image */}
                <div className="relative w-full h-48 bg-slate-200 dark:bg-slate-700">
                  <Image
                    src={mag.cover_image || "/covers/trending-ai.jpg"}
                    alt={mag.title}
                    fill
                    className="object-cover"
                  />
                  {!mag.is_free && (
                    <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                      Premium
                    </span>
                  )}
                </div>

                {/* Card Details */}
                <CardContent className="p-4 text-center space-y-2 flex-1 flex flex-col">
                  {mag.category_name && (
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-700/40 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full w-fit font-medium mx-auto">
                      {mag.category_name}
                    </span>
                  )}

                  <h4 className="font-semibold text-md line-clamp-2 min-h-[3rem]">{mag.title}</h4>
                  <p className="text-[12px] text-slate-500 line-clamp-2">
                    {mag.summary || (mag.content ? mag.content.replace(/<[^>]*>?/gm, '').substring(0, 60) + "..." : "No summary")}
                  </p>

                  <div className="flex-1"></div>

                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {mag.is_free ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      <span>{mag.price ? `₹${mag.price}` : "Paid"}</span>
                    )}
                  </div>

                  {/* Read Button */}
                  <Button
                    onClick={() => handleReadNow(mag.id)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl flex justify-center gap-1"
                  >
                    <Eye size={12} /> Read Now
                  </Button>
                </CardContent>

              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-10 text-slate-500">
            No articles available at the moment.
          </div>
        )}

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
