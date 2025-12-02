"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authors } from "@/src/data/authors";

export default function AuthorSection() {
  const router = useRouter();

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Handle next slide
  const handleNext = () => {
    setIndex((prev) => (prev >= authors.length - 3 ? 0 : prev + 1));
  };

  // Handle previous slide
  const handlePrev = () => {
    setIndex((prev) => (prev <= 0 ? authors.length - 3 : prev - 1));
  };

  // Auto-slide
  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      handleNext();
    }, 2000);

    return () => clearInterval(timer);
  }, [paused]);

  return (
    <section className="w-full py-20 bg-gray-50 dark:bg-slate-800">
      {/* Text header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold">Featured Authors</h2>
        <p className="text-xl mt-1 font-semibold text-gray-700 dark:text-gray-300">
          Top Rated Authors
        </p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Discover the best authors in their fields
        </p>
      </div>

      {/* Slider container */}
      <div
        className="relative max-w-6xl mx-auto overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Cards row */}
        <motion.div
          className="flex gap-6"
          animate={{ x: -index * 360 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          {authors.map((author) => (
            <div
              key={author.id}
              className="min-w-[340px] bg-white dark:bg-slate-800 shadow-lg rounded-2xl p-6"
            >
              <div className="w-full h-40 relative mb-4 rounded-xl overflow-hidden">
                <Image
                  src={author.image}          // FIXED: use unified dataset key
                  fill
                  alt={author.name}
                  className="object-cover"
                />
              </div>

              <h3 className="text-xl font-semibold">{author.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {author.category}
              </p>

              <div className="flex items-center gap-2 mt-3">
                <span className="text-yellow-500 text-lg">★</span>
                <span className="font-semibold">{author.rating}</span>
                <span className="text-gray-500">
                  ({author.reviews} reviews)
                </span>
              </div>

              <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                Articles Published: <b>{author.articles}</b>
              </p>

              {/* View Profile */}
              <button
                onClick={() => router.push(`/authors?id=${author.id}`)}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl transition"
              >
                View Profile
              </button>
            </div>
          ))}
        </motion.div>

        {/* Left arrow */}
        <button
          onClick={handlePrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow p-3 rounded-full hover:scale-105 transition"
        >
          ←
        </button>

        {/* Right arrow */}
        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow p-3 rounded-full hover:scale-105 transition"
        >
          →
        </button>
      </div>
    </section>
  );
}
