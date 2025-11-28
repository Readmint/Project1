import HeroCarousel from "@/src/components/home/HeroCarousel";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AuthorSection from "@/src/components/home/AuthorSection";
import Footer from "@/src/components/layout/Footer";

export default function HomePage() {
  const featuredArticles = [
    {
      id: 1,
      title: "The Future of Web Design",
      author: "Sarah Chen",
      category: "Design",
      excerpt:
        "Exploring emerging trends in web design and how they shape the digital landscape.",
      image: "/images/article1.jpg",
      date: "Mar 15, 2024",
    },
    {
      id: 2,
      title: "Building Scalable Applications",
      author: "James Wilson",
      category: "Technology",
      excerpt: "Best practices for designing systems that grow with your needs.",
      image: "/images/article2.jpg",
      date: "Mar 12, 2024",
    },
    {
      id: 3,
      title: "Creative Direction in 2024",
      author: "Emma Rodriguez",
      category: "Creative",
      excerpt:
        "How modern brands are redefining creativity and visual storytelling.",
      image: "/images/article3.jpg",
      date: "Mar 10, 2024",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-y-auto">
      
      {/* HERO CAROUSEL */}
      <HeroCarousel />

      {/* FEATURED ISSUES */}
<div className="mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50 dark:bg-slate-800">
  <div className="mb-12 text-center">
    <h4 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
      Featured Issues
    </h4>
    <p className="text-slate-600 dark:text-slate-300 text-lg">
      Explore our latest and most popular magazine issues
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {featuredArticles.map((article) => (
      <Link key={article.id} href={`/issues/${article.id}`}>
        <article className="rounded-xl overflow-hidden hover:shadow-lg dark:hover:shadow-indigo-900/20 transition-shadow duration-300 flex flex-col h-full bg-slate-50 dark:bg-slate-800 cursor-pointer">
          <Image
            src={article.image}
            width={600}
            height={400}
            alt={article.title}
            className="w-full h-48 object-cover"
          />

          <div className="p-6 flex flex-col flex-grow">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
                {article.category}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {article.date}
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {article.title}
            </h3>

            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 flex-grow">
              {article.excerpt}
            </p>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              By {article.author}
            </p>
          </div>
        </article>
      </Link>
    ))}
  </div>

  {/* View All Issues Button */}
  <div className="mt-12 text-center">
    <Link href="/issues">
      <Button
        size="lg"
        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white font-semibold px-8"
      >
        View All Issues
      </Button>
    </Link>
  </div>
</div>

{/* MEMBERSHIP PLANS (CTA) */}
<div className="text-indigo-600 py-20 px-4 sm:px-6 lg:px-8">
  <div className="max-w-5xl mx-auto text-center mb-12">
    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
      Choose Your Plan
    </h2>
    <h3 className="text-2xl sm:text-3xl font-semibold mb-2">
      Membership Plans
    </h3>
    <p className="text-slate-600 dark:text-slate-300 text-lg">
      Choose the plan that best suits your reading needs
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

{/* FREE PLAN */}
<div className="
  bg-white dark:bg-slate-800 text-slate-900 dark:text-white 
  rounded-2xl shadow-lg p-8 flex flex-col
  border-2 border-transparent
  hover:border-indigo-500 hover:shadow-xl
  transition-all duration-300 hover:scale-[1.02]
">
  <h3 className="text-2xl font-bold mb-2">Free</h3>
  <p className="text-xl font-semibold mb-4">Rs. 0/month</p>
  <p className="text-slate-600 dark:text-slate-400 mb-6">Perfect for casual readers</p>
  <ul className="space-y-2 flex-grow text-slate-700 dark:text-slate-400">
    <li>• Access to free issues</li>
    <li>• Limited article views</li>
    <li>• Basic bookmarking</li>
    <li>• Community access</li>
  </ul>
  <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white">
    Choose Free
  </Button>
</div>

{/* BASIC PLAN */}
<div className="
  bg-white text-slate-900 dark:text-white dark:bg-slate-800
  rounded-2xl shadow-lg p-8 flex flex-col
  border-2 border-transparent
  hover:border-indigo-500 hover:shadow-xl
  transition-all duration-300 hover:scale-[1.02]
">
  <h3 className="text-2xl font-bold mb-2">Basic</h3>
  <p className="text-xl font-semibold mb-4">$100/month</p>
  <p className="text-slate-600 dark:text-slate-400 mb-6">For regular readers</p>
  <ul className="space-y-2 flex-grow text-slate-700 dark:text-slate-400">
    <li>• All Free features</li>
    <li>• 5 premium issues per month</li>
    <li>• Unlimited bookmarks</li>
    <li>• Download for offline reading</li>
    <li>• Ad-free experience</li>
    <li>• Email support</li>
  </ul>
  <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white">
    Choose Basic
  </Button>
</div>

{/* PREMIUM PLAN */}
<div className="
  bg-white text-slate-900 dark:text-white dark:bg-slate-800
  rounded-2xl shadow-lg p-8 flex flex-col
  border-2 border-transparent
  hover:border-indigo-500 hover:shadow-xl
  transition-all duration-300 hover:scale-[1.02]
">
  <h3 className="text-2xl font-bold mb-2">Premium</h3>
  <p className="text-xl font-semibold mb-4">Rs. 200/month</p>
  <p className="text-slate-600 dark:text-slate-400 mb-6">For passionate readers</p>
  <ul className="space-y-2 flex-grow text-slate-700 dark:text-slate-400">
    <li>• All Basic features</li>
    <li>• Unlimited premium issues</li>
    <li>• Early access to new releases</li>
    <li>• Exclusive author content</li>
    <li>• Priority support</li>
    <li>• Certificate of achievements</li>
    <li>• Monthly webinars</li>
  </ul>
  <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white">
    Choose Premium
  </Button>
</div>
  </div>
</div>
<AuthorSection />

{/* FINAL CTA SECTION */}
<section className="bg-indigo-600 text-white py-20 mt-20">
  <div className="max-w-5xl mx-auto px-4 text-center">

    <h2 className="text-4xl font-bold mb-4">Ready to Start Reading?</h2>
    <p className="text-lg opacity-90 mb-8">
      Join thousands of readers and get access to premium content today
    </p>

    <div className="flex justify-center gap-6">

      <Button 
        className="bg-white text-indigo-600 hover:bg-slate-100"
        asChild
      >
        <a href="/signup">Get Started for Free</a>
      </Button>

      <Button 
        className="bg-white text-indigo-600 hover:bg-slate-100"
        asChild
      >
        <a href="/issues">Browse Issues</a>
      </Button>

    </div>

  </div>
</section>

<Footer />
    </div>
  );
}
