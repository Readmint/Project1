"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { authors } from "@/src/data/authors";

interface Author {
  id: number;
  name: string;
  designation: string;
  organization?: string;
  category: string;
  followers: number;
  rating: string;
  reviews: string;
  articles: string;
  image: string;
  bio: string;
}


function AuthorsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const authorId = params.get("id");

  const [search, setSearch] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);

  /* Reserve 1 author for search testing, use 10 for sections */
  const visibleAuthors = authors.slice(0, 10);
  const testAuthor = authors[10];
  const allAuthors = authors; // search scans all 11

  /* Distribute 10 authors into 5 professional sections (2 each) */
  const sections = [
    { title: "Trending & Bestselling Authors", list: visibleAuthors.slice(0, 2) },
    { title: "Rising Voices", list: visibleAuthors.slice(2, 4) },
    { title: "Established Authors", list: visibleAuthors.slice(4, 6) },
    { title: "Debut Authors", list: visibleAuthors.slice(6, 8) },
    { title: "Literary Masters", list: visibleAuthors.slice(8, 10) },
  ];

  /* Auto-open modal if ?id= is present */
  useEffect(() => {
    if (authorId) {
      const found = authors.find(a => a.id === Number(authorId));
      if (found) setSelectedAuthor(found);
    }
  }, [authorId]);

  /* Close modal */
  const closeModal = () => {
    setSelectedAuthor(null);
    router.replace("/authors");
  };

  /* Card UI exactly like original */
  const AuthorCard = ({ author }: { author: Author }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
        <CardContent className="p-6 flex flex-col items-center text-center">

          {/* Profile Image */}
          <div className="w-32 h-32 relative mb-4 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600">
            <Image src={author.image} alt={author.name} fill className="object-cover" />
          </div>

          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {author.name}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            {author.category}
          </p>

          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            Followers: {author.followers.toLocaleString()}
          </p>

          <Button
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => setSelectedAuthor(author)}
          >
            View Profile
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Heading */}
        <h1 className="text-4xl font-bold mb-2 text-center text-slate-900 dark:text-white">
          Meet Our Authors
        </h1>

        <p className="text-center text-slate-600 dark:text-slate-400 mb-10">
          Discover the brilliant minds behind our magazine&apos;s stories.
        </p>

        {/* Search Bar */}
        <div className="flex justify-center mb-10">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500 dark:text-slate-300" />
            <Input
              placeholder="Search authors..."
              className="pl-10 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* When searching, show matching cards like original, from all 11 authors */}
        {search ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {allAuthors
              .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
              .map(a => <AuthorCard key={a.id} author={a} />)
            }
            {testAuthor && testAuthor.name.toLowerCase().includes(search.toLowerCase()) && (
              <AuthorCard key={testAuthor.id} author={testAuthor} />
            )}
          </div>
        ) : (
          /* Default view shows 5 sections, 2 authors each */
          sections.map(section => (
            <div key={section.title} className="mb-14">
              <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                {section.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {section.list.map(a => <AuthorCard key={a.id} author={a} />)}
              </div>
            </div>
          ))
        )}

      </div>

      {/* ✅ Modal opens exactly like original */}
      {selectedAuthor && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 flex justify-center items-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-lg w-full shadow-xl border border-slate-200 dark:border-slate-700"
          >

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {selectedAuthor.name}
              </h2>
              <Button
                variant="ghost"
                onClick={closeModal}
                className="text-slate-700 dark:text-slate-300 hover:text-indigo-600"
              >
                Close
              </Button>
            </div>

            {/* Details */}
            <div className="flex gap-4 mb-4">
              <div className="w-28 h-28 relative rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
                <Image src={selectedAuthor.image} alt={selectedAuthor.name} fill className="object-cover" />
              </div>

              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedAuthor.designation}
                </p>

                {selectedAuthor.organization && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedAuthor.organization}
                  </p>
                )}

                <p className="text-slate-700 dark:text-slate-300 mt-2">
                  Category: <span className="font-medium">{selectedAuthor.category}</span>
                </p>

                <p className="text-slate-700 dark:text-slate-300">
                  Followers: <span className="font-medium">{selectedAuthor.followers.toLocaleString()}</span>
                </p>

                <p className="text-slate-700 dark:text-slate-300">
                  Rating: <span className="font-medium">{selectedAuthor.rating}</span>
                </p>

                <p className="text-slate-700 dark:text-slate-300">
                  Reviews: <span className="font-medium">{selectedAuthor.reviews}</span>
                </p>

                <p className="text-slate-700 dark:text-slate-300">
                  Articles Published: <span className="font-medium">{selectedAuthor.articles}</span>
                </p>
              </div>
            </div>

            {/* Bio */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                About the Author
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedAuthor.bio}
              </p>
            </div>

          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function AuthorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>}>
      <AuthorsContent />
    </Suspense>
  );
}
