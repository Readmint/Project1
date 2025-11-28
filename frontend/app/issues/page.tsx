"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Footer from "@/src/components/layout/Footer";

const categories = [
  "All",
  "Technology",
  "Business",
  "Science",
  "Health",
  "Arts",
  "Lifestyle",
];

// Dummy Magazine Data
const magazines = [
  {
    id: 1,
    title: "Tech Innovations Monthly",
    category: "Technology",
    date: "2025-01-15",
    articles: 12,
    price: "$4.99",
    cover: "/covers/tech1.jpg",
  },
  {
    id: 2,
    title: "The Business Review",
    category: "Business",
    date: "2025-01-05",
    articles: 9,
    price: "$3.99",
    cover: "/covers/business1.jpg",
  },
  {
    id: 3,
    title: "Health & Wellness Today",
    category: "Health",
    date: "2024-12-25",
    articles: 15,
    price: "$5.49",
    cover: "/covers/health1.jpg",
  },
];

export default function IssuesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortDate, setSortDate] = useState("newest");

  // Filter Logic
  const filteredMagazines = magazines
    .filter((m) =>
      m.title.toLowerCase().includes(search.toLowerCase())
    )
    .filter((m) =>
      categoryFilter === "All" ? true : m.category === categoryFilter
    )
    .sort((a, b) =>
      sortDate === "newest"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    );

  return (
    <>

      <div className="min-h-screen bg-white dark:bg-slate-900 px-4 sm:px-6 lg:px-10 py-10">
        
        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            All Magazine Issues
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
            Browse our complete collection of digital magazines
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-10 items-center justify-center">
          
          {/* Search Bar */}
          <Input
            type="text"
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
          />

          {/* Sort by date */}
          <select
            className="w-full md:w-48 h-10 rounded-md bg-slate-100 dark:bg-slate-800 text-sm border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-2"
            onChange={(e) => setSortDate(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* Category Filter */}
          <select
            className="w-full md:w-48 h-10 rounded-md bg-slate-100 dark:bg-slate-800 text-sm border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-2"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

        </div>

        {/* Card Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMagazines.map((mag) => (
            <div
              key={mag.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Cover Image */}
              <div className="relative w-full h-48">
                <Image
                  src={mag.cover}
                  alt={mag.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col gap-1">
                <span className="text-xs bg-indigo-100 dark:bg-indigo-700/40 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full w-fit font-medium">
                  {mag.category}
                </span>

                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
                  {mag.title}
                </h3>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Published: {new Date(mag.date).toLocaleDateString()}
                </p>

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {mag.articles} articles
                </p>

                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {mag.price}
                </p>

                <Button className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-10">
          <Button
            variant="ghost"
            className="text-slate-700 dark:text-slate-300 hover:text-indigo-600"
          >
            Previous
          </Button>

          {[1, 2, 3].map((num) => (
            <Button
              key={num}
              variant="ghost"
              className="text-slate-700 dark:text-slate-300 hover:text-indigo-600"
            >
              {num}
            </Button>
          ))}

          <Button
            variant="ghost"
            className="text-slate-700 dark:text-slate-300 hover:text-indigo-600"
          >
            Next
          </Button>
        </div>

      </div>

      <Footer />
    </>
  );
}
