"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// ------------------------------------
// Testimonials Data
// ------------------------------------
const testimonials = [
  {
    name: "Aisha Patel",
    image: "/images/aisha.jpg",
    rating: 5,
    magazine: "Tech Horizon",
    review:
      "The articles are always insightful and brilliantly researched. My go-to magazine every morning!",
  },
  {
    name: "Daniel Wright",
    image: "/images/daniel.jpg",
    rating: 4,
    magazine: "Global Affairs Weekly",
    review:
      "Great coverage of global political issues. The writing is balanced and very engaging.",
  },
  {
    name: "Maria Gomez",
    image: "/images/maria.jpg",
    rating: 5,
    magazine: "Health & Wellness Digest",
    review:
      "Absolutely love the wellness articles. They helped me build healthier habits!",
  },
];

// ------------------------------------
// About Us Page
// ------------------------------------
export default function AboutUsPage() {
  const [index, setIndex] = useState(0);

  // Auto rotate testimonial card
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const current = testimonials[index];

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-900 text-foreground transition-colors">
      {/* ------------------------------------ */}
      {/* Hero Section */}
      {/* ------------------------------------ */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-20">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl sm:text-6xl font-bold text-center text-slate-900 dark:text-white"
        >
          About <span className="text-indigo-600">Us</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-6 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
        >
          We are a modern digital magazine platform dedicated to delivering
          high-quality journalism, compelling stories, and insights from
          brilliant writers across the world.
        </motion.p>
      </section>

      {/* ------------------------------------ */}
      {/* Mission */}
      {/* ------------------------------------ */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Our Mission
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Our mission is to empower readers with meaningful content that
              informs, inspires, and challenges perspectives. We strive to give
              authors a platform where their voices reach the right audiences,
              and readers access journalism they can trust.
            </p>
          </div>

          <Image
            src="/images/mission.jpg"
            width={500}
            height={350}
            alt="Our Mission"
            className="rounded-xl shadow-lg object-cover"
          />
        </div>
      </section>

      {/* ------------------------------------ */}
      {/* Values */}
      {/* ------------------------------------ */}
      <section className="bg-slate-100 dark:bg-slate-800/50 py-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">
            Our Core Values
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Integrity in Journalism",
                desc: "Our commitment to accuracy and truth shapes every story we publish.",
              },
              {
                title: "Empowering Voices",
                desc: "We uplift diverse writers and foster a culture of inclusive storytelling.",
              },
              {
                title: "Innovation",
                desc: "We use modern tools to create a seamless and elevated reading experience.",
              },
            ].map((value, i) => (
              <Card
                key={i}
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md rounded-xl"
              >
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-slate-700 dark:text-slate-300">
                  {value.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------ */}
      {/* Stats Section */}
      {/* ------------------------------------ */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 py-20">
        <div className="grid sm:grid-cols-3 gap-10 text-center">
          {[
            { label: "Active Readers", value: "1M+" },
            { label: "Published Articles", value: "25,000+" },
            { label: "Expert Authors", value: "500+" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow"
            >
              <h3 className="text-4xl font-bold text-indigo-600">{stat.value}</h3>
              <p className="mt-2 text-slate-700 dark:text-slate-300">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ------------------------------------ */}
      {/* Reader Reviews Section (Rotating Cards) */}
      {/* ------------------------------------ */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800/40">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">
            Reader Reviews
          </h2>

          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto"
          >
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg p-6 rounded-2xl">
              <CardContent className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600">
                  <Image
                    src={current.image}
                    alt={current.name}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                </div>

                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {current.name}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Reviewed: {current.magazine}
                </p>

                {/* Star Rating */}
                <div className="flex justify-center mb-3">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <span key={i} className="text-indigo-600 text-xl">
                      ★
                    </span>
                  ))}
                </div>

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  "{current.review}"
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------ */}
      {/* Call to Action */}
      {/* ------------------------------------ */}
      <section className="text-center py-20 px-6">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
          Join Our Community
        </h2>
        <p className="max-w-xl mx-auto text-slate-700 dark:text-slate-300 mb-8">
          Become part of a growing platform where storytelling meets
          innovation. Discover articles you'll love and authors who inspire.
        </p>
        <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 text-lg rounded-xl"
            onClick={() => (window.location.href = "/signup")}
        >
            Get Started
        </Button>
      </section>

    </div>
  );
}