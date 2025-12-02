"use client";

import { useState, useEffect } from "react";
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

export default function AuthorsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const authorId = params.get("id");

  const [search, setSearch] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);

  /* Auto-open modal if ?id is present */
  useEffect(() => {
    if (authorId) {
      const found = authors.find((a) => a.id === Number(authorId));
      if (found) setSelectedAuthor(found);
    }
  }, [authorId]);

  /* Filter authors */
  const filtered = authors.filter((author) =>
    author.name.toLowerCase().includes(search.toLowerCase())
  );

  /* Close modal */
  const closeModal = () => {
    setSelectedAuthor(null);
    router.replace("/authors");
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Heading */}
        <h1 className="text-4xl font-bold mb-2 text-center text-slate-900 dark:text-white">
          Meet Our Authors
        </h1>

        <p className="text-center text-slate-600 dark:text-slate-400 mb-10">
          Discover the brilliant minds behind our magazine's stories.
        </p>

        {/* Search */}
        <div className="flex justify-center mb-10">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500 dark:text-slate-300" />
            <Input
              placeholder="Search authors..."
              className="pl-10 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Author Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((author) => (
            <motion.div
              key={author.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
                    onClick={() => router.push(`/authors?id=${author.id}`)}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-12 space-x-3">
          <Button variant="ghost" className="text-slate-700 dark:text-slate-300 hover:text-indigo-600">
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

          <Button variant="ghost" className="text-slate-700 dark:text-slate-300 hover:text-indigo-600">
            Next
          </Button>
        </div>
      </div>

      {/* Modal */}
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

            {/* Main Content */}
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