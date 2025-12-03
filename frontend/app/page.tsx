'use client';

import HeroCarousel from "@/components/home/HeroCarousel";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AuthorSection from "@/components/home/AuthorSection";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";  // ✅ CARD IMPORT FIXED

interface FeaturedArticle {
  id: number;
  title: string;
  author: string;
  category: string;
  excerpt: string;
  image: string;
  date: string;
}

interface AdvertisementPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  perks: string[];
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const featuredArticles: FeaturedArticle[] = [
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

  const adPlans: AdvertisementPlan[] = [
    {
      id: 'silver',
      name: 'Silver Reach',
      price: 12000,
      description: 'Boost visibility among magazine readers',
      perks: [
        'Full-page ad in one issue',
        'Newsletter shoutout',
        '1 month collaborator badge'
      ]
    },
    {
      id: 'gold',
      name: 'Gold Spotlight',
      price: 28000,
      description: 'High-impact multi-channel presence',
      perks: [
        '3 issue placements',
        'Homepage logo display',
        'Exclusive brand feature'
      ]
    },
    {
      id: 'platinum',
      price: 80000,
      name: 'Platinum Domination',
      description: 'Premium brand takeover experience',
      perks: [
        'Hero banner placement',
        'Dedicated issue branding',
        'CEO interview feature'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-y-auto">
      
      {/* HERO */}
      <HeroCarousel />

      {/* FEATURED ISSUES (unchanged) */}
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

        <div className="mt-12 text-center">
          <Link href="/issues">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white font-semibold px-8">
              View All Issues
            </Button>
          </Link>
        </div>
      </div>

      {/* ✅ NEW: EDITOR’S DESK */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center text-slate-900 dark:text-white">
            Editor’s Desk
          </h2>
          <Card className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-2xl shadow-md">
            <CardContent>
              <p className="text-lg leading-relaxed text-center text-slate-700 dark:text-slate-300">
                Every issue is curated with a commitment to storytelling excellence, authenticity, and creative boldness. Our editorial lens amplifies voices that matter, blending insight, culture, and craft.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ✅ NEW: EDITORIAL MEMBERS */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
            Editorial Members
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            The minds refining every narrative
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { name: "Aditi Banerjee", role: "Chief Editor", img: "/images/editorA.jpg" },
            { name: "Rohan Verma", role: "Senior Copy Lead", img: "/images/editorB.jpg" },
            { name: "Mei Takahashi", role: "Creative Review Director", img: "/images/editorC.jpg" },
            { name: "Ibrahim Al-Farsi", role: "Editorial Advisor", img: "/images/editorD.jpg" },
          ].map((member, i) => (
            <motion.div key={i} whileHover={{ scale: 1.03 }}>
              <Card className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md hover:shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
                <div className="w-24 h-24 relative mb-4 rounded-full overflow-hidden border border-indigo-300 dark:border-indigo-600">
                  <Image src={member.img} alt={member.name} fill className="object-cover"/>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {member.name}
                </h3>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300 mt-1">
                  {member.role}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ✅ NEW: ADVERTISEMENT PLANS */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
            Advertisement Plans
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Reach the audience shaping culture
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {adPlans.map((ad) => (
            <Card key={ad.id} className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-lg p-8 flex flex-col border hover:border-indigo-500 transition-all duration-300">
              <h3 className="text-2xl font-bold mb-2">{ad.name}</h3>
              <p className="text-xl font-semibold mb-4">₹{ad.price.toLocaleString()}</p>
              <p className="text-slate-600 dark:text-slate-400 mb-6">{ad.description}</p>
              <ul className="space-y-2 flex-grow text-slate-700 dark:text-slate-300 mb-6">
                {ad.perks.map((perk, idx) => (
                  <li key={idx}>✓ {perk}</li>
                ))}
              </ul>
              <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white">
                Enquire Now
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* ✅ NEW: PARTNERS / COLLABORATORS */}
      <section className="py-16 px-4 bg-gray-100 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
            Partners & Collaborators
          </h2>

          <p className="text-lg text-slate-600 dark:text-slate-400">
            The organizations amplifying our reach and vision
          </p>
        </div>

        <div className="flex justify-center flex-wrap gap-16 max-w-5xl mx-auto opacity-85 hover:opacity-100 transition-all">
          {[
            "/images/collab1.svg",
            "/images/collab2.svg",
            "/images/collab3.svg",
            "/images/collab4.svg",
          ].map((logo, i) => (
            <div key={i} className="w-40 h-14 relative grayscale hover:grayscale-0 transition-all">
              <Image src={logo} alt="Collaborator logo" fill className="object-contain"/>
            </div>
          ))}
        </div>
      </section>

      {/* AUTHORS SECTION still works unchanged */}
      <AuthorSection />

      {/* CTA still works unchanged */}
      <section className="bg-indigo-600 text-white py-20 mt-20">
        <div className="max-w-5xl mx-auto px-4 text-center">

          <h2 className="text-4xl font-bold mb-4">Ready to Start Reading?</h2>
          <p className="text-lg opacity-90 mb-8">
            Join thousands of readers and get access to premium content today
          </p>

          <div className="flex justify-center gap-6">

            <Button 
              className="bg-white text-indigo-600 hover:bg-slate-100"
              onClick={() => router.push('/signup')}
            >
              Get Started for Free
            </Button>

            <Button 
              className="bg-white text-indigo-600 hover:bg-slate-100"
              onClick={() => router.push('/issues')}
            >
              Browse Issues
            </Button>

          </div>

          <div className="mt-8 text-sm opacity-80">
            <p>No credit card required for free plan • Cancel anytime • No hidden fees</p>
          </div>

        </div>
      </section>

    </div>
  );
}
