"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Flame,
  TrendingUp,
  Star,
  Rocket,
  Eye,
  ShoppingCart,
  X,
  Trash2,
  Bookmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

// -----------------------------
// Types
// -----------------------------
type MagazineIssue = {
  id: number;
  title: string;
  category: string;
  cover: string;
  articles: number;
  price: string;
  date: string;
};

type CartItem = {
  id: number;
  title: string;
  cover: string;
  price: string;
};

// -----------------------------
// Topics for rows
// -----------------------------
const topics: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "Trending", label: "Trending Now", icon: TrendingUp },
  { key: "Editors Pick", label: "Editor’s Picks", icon: Star },
  { key: "Popular Around You", label: "Popular Around You", icon: Flame },
  { key: "New Release", label: "New Releases", icon: Rocket },
];

// -----------------------------
// Dummy Magazine Issue Data
// -----------------------------
const magazines: MagazineIssue[] = [
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

// -----------------------------
// Utility: get user role (from localStorage)
// -----------------------------
function getUserRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.role || null;
  } catch {
    return null;
  }
}

// -----------------------------
// Skeleton loading components
// -----------------------------
function SkeletonCardRow({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-5 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="min-w-[340px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden"
        >
          <div className="w-full h-40 bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-8 w-full bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeletonRows() {
  return (
    <div className="space-y-14">
      {topics.map((topic) => (
        <div key={topic.key} className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-300 dark:text-slate-600">
            <topic.icon size={18} className="text-slate-400" /> {topic.label}
          </h3>
          <SkeletonCardRow />
        </div>
      ))}
    </div>
  );
}

// -----------------------------
// Magazine Row Slider Component
// -----------------------------
function MagazineRow({
  title,
  icon: Icon,
  items,
  isReader,
  bookmarks,
  onBookmark,
  onAddToCart,
}: {
  title: string;
  icon: LucideIcon;
  items: MagazineIssue[];
  isReader: boolean;
  bookmarks: number[];
  onBookmark: (id: number) => void;
  onAddToCart: (id: number) => void;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const handleNext = () => {
    if (items.length <= 3) return;
    setIndex((prev) => (prev >= items.length - 3 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    if (items.length <= 3) return;
    setIndex((prev) => (prev <= 0 ? items.length - 3 : prev - 1));
  };

  useEffect(() => {
    if (paused || items.length <= 3) return;
    const timer = setInterval(() => handleNext(), 3000);
    return () => clearInterval(timer);
  }, [paused, items.length]);

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
          {items.map((mag) => {
            const isBookmarked = bookmarks.includes(mag.id);

            return (
              <motion.div
                key={mag.id}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="min-w-[340px]"
              >
                <Card className="bg-white dark:bg-slate-800 shadow-lg rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700">
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
                    <p className="text-[12px] text-slate-500">
                      📚 {mag.articles} articles
                    </p>
                    <p className="text-sm font-medium text-indigo-600">
                      {mag.price}
                    </p>

                    <Button
                      onClick={() =>
                        router.push(`/articles/${mag.id}/preview`)
                      }
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl flex justify-center gap-1"
                    >
                      <Eye size={12} /> Read Now
                    </Button>

                    {isReader && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => onBookmark(mag.id)}
                          variant={isBookmarked ? "default" : "outline"}
                          className="w-1/2 text-xs rounded-xl flex items-center justify-center gap-1"
                        >
                          <Bookmark size={12} />
                          {isBookmarked ? "Bookmarked" : "Bookmark"}
                        </Button>

                        <Button
                          onClick={() => onAddToCart(mag.id)}
                          variant="outline"
                          className="w-1/2 text-xs rounded-xl flex items-center justify-center gap-1"
                        >
                          <ShoppingCart size={12} /> Add
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Arrows */}
        {items.length > 3 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 shadow p-2 rounded-full hover:scale-105 transition-transform"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 shadow p-2 rounded-full hover:scale-105 transition-transform"
            >
              →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// -----------------------------
// MAIN PAGE
// -----------------------------
export default function IssuesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const isReader = role === "reader";

  // Init user role, bookmarks, cart (localStorage)
  useEffect(() => {
    setRole(getUserRole());

    if (typeof window !== "undefined") {
      try {
        const storedBookmarks = JSON.parse(
          localStorage.getItem("bookmarked_issues") || "[]"
        ) as number[];
        setBookmarks(storedBookmarks);
      } catch {}

      try {
        const storedCart = JSON.parse(
          localStorage.getItem("cart_items") || "[]"
        ) as CartItem[];
        setCart(storedCart);
      } catch {}
    }

    // Fake loading delay for shimmer
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Handlers
  const handleBookmark = (id: number) => {
    setBookmarks((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((x) => x !== id) : [...prev, id];
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "bookmarked_issues",
          JSON.stringify(updated)
        );
      }
      return updated;
    });
  };

  const handleAddToCart = (id: number) => {
    const mag = magazines.find((m) => m.id === id);
    if (!mag) return;

    setCart((prev) => {
      if (prev.some((item) => item.id === id)) return prev;
      const updated = [
        ...prev,
        {
          id: mag.id,
          title: mag.title,
          cover: mag.cover,
          price: mag.price,
        },
      ];
      if (typeof window !== "undefined") {
        localStorage.setItem("cart_items", JSON.stringify(updated));
      }
      return updated;
    });

    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (id: number) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("cart_items", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const topicData: Record<string, MagazineIssue[]> = {
    "Trending Now": magazines.filter((m) => m.category === "Trending Now"),
    "Editor’s Picks": magazines.filter((m) => m.category === "Editor’s Picks"),
    "Popular Around You": magazines.filter(
      (m) => m.category === "Popular Around You"
    ),
    "New Releases": magazines.filter((m) => m.category === "New Releases"),
  };

  const filteredMagazines = magazines.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <main className="min-h-screen bg-white dark:bg-slate-900 px-6 py-12 space-y-12 relative">

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

      {/* Content Area */}
      {loading ? (
        <LoadingSkeletonRows />
      ) : (
        <>
          {/* Searched Result Grid */}
          {search && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-center">
              {filteredMagazines.map((mag) => {
                const isBookmarked = bookmarks.includes(mag.id);

                return (
                  <motion.div
                    key={mag.id}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className="overflow-hidden bg-white dark:bg-slate-800 shadow-md rounded-xl border dark:text-white">
                      <div className="relative w-full h-48">
                        <Image
                          src={mag.cover}
                          alt={mag.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="p-4 text-center space-y-1">
                        <h4 className="font-semibold text-md">{mag.title}</h4>
                        <p className="text-xs text-slate-500">
                          {mag.articles} articles
                        </p>
                        <p className="text-sm font-medium text-indigo-600">
                          {mag.price}
                        </p>

                        <Button
                          onClick={() =>
                            router.push(`/articles/${mag.id}/preview`)
                          }
                          className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl"
                        >
                          Read Now →
                        </Button>

                        {isReader && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              onClick={() => handleBookmark(mag.id)}
                              variant={isBookmarked ? "default" : "outline"}
                              className="w-1/2 text-xs rounded-xl flex items-center justify-center gap-1"
                            >
                              <Bookmark size={12} />
                              {isBookmarked ? "Bookmarked" : "Bookmark"}
                            </Button>
                            <Button
                              onClick={() => handleAddToCart(mag.id)}
                              variant="outline"
                              className="w-1/2 text-xs rounded-xl flex items-center justify-center gap-1"
                            >
                              <ShoppingCart size={12} /> Add
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
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
                  items={
                    topicData[topic.label] ||
                    magazines.filter((m) => m.category === topic.label)
                  }
                  isReader={isReader}
                  bookmarks={bookmarks}
                  onBookmark={handleBookmark}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating Mini-Cart Bubble */}
      <motion.button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg bg-indigo-600 text-white w-12 h-12 flex items-center justify-center hover:bg-indigo-700"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <ShoppingCart size={18} />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] rounded-full px-1.5 py-0.5">
            {cart.length}
          </span>
        )}
      </motion.button>

      {/* Mini-Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 z-50 shadow-xl border-l border-slate-200 dark:border-slate-700 flex flex-col"
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} />
                  <h3 className="text-sm font-semibold">Your Cart</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Your cart is empty. Add magazines to view them here.
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 items-center border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                    >
                      <div className="relative w-12 h-16 rounded overflow-hidden">
                        <Image
                          src={item.cover}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold line-clamp-2">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-indigo-600">
                          {item.price}
                        </p>
                      </div>
                      <button
                        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => handleRemoveFromCart(item.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-2">
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg"
                    onClick={() => {
                      // Placeholder: integrate your checkout/cart page here
                      router.push("/checkout");
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                  <p className="text-[11px] text-slate-500 text-center">
                    Taxes and final pricing will be shown at checkout.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
