"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
// Submission Guidelines Content
// ------------------------------------
const submissionGuidelines = `
We welcome original submissions from writers, journalists, poets, and thought leaders.

📌 What We're Looking For
- In-depth articles (1200–3000 words)
- Opinion pieces backed by real insights
- Fictional short stories
- Poetry and lyrical writing
- Research-based essays
- Interviews and cultural commentary

✅ Submission Rules
- Must be original and unpublished
- No AI-generated content without disclosure
- Follow magazine tone: professional, engaging, well researched
- Submit in Word or Google Docs format
- Include author bio and profile image
- Limit: 2 submissions per month per author

📬 Email submissions to: submissions@yourmagazine.com
🕒 Review timeline: 7–14 business days
💼 If selected: You’ll receive confirmation + publishing contract

We do not accept:
- Hate speech
- Political propaganda
- Plagiarized content
- Explicit or harmful content
`;

// ------------------------------------
// Events Data (Made Up)
// ------------------------------------
const events = [
  {
    id: "event-1",
    title: "Author Connect Live 2025",
    image: "/images/event1.jpg",
    date: "Jan 22, 2025",
    description: "A global webinar featuring award-winning storytellers.",
  },
  {
    id: "event-2",
    title: "Future of Digital Publishing Summit",
    image: "/images/event2.jpg",
    date: "Feb 14, 2025",
    description: "Panel discussions on AI, media, and evolving reader trends.",
  },
  {
    id: "event-3",
    title: "Voices of Tomorrow — Debut Writers Meet",
    image: "/images/event3.jpg",
    date: "Mar 03, 2025",
    description: "Celebrating and mentoring next-gen literary voices.",
  },
];

// ------------------------------------
// About Us Page
// ------------------------------------
export default function AboutUsPage() {
  const router = useRouter();
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  // Auto rotate testimonial card
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const currentTestimonial = testimonials[testimonialIndex];

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
      {/* Stats */}
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
      {/* Reader Testimonials */}
      {/* ------------------------------------ */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800/40">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">
            Reader Reviews
          </h2>

          <motion.div
            key={testimonialIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto"
          >
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg p-6 rounded-2xl">
              <CardContent className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600">
                  <Image
                    src={currentTestimonial.image}
                    alt={currentTestimonial.name}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                </div>

                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {currentTestimonial.name}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Reviewed: {currentTestimonial.magazine}
                </p>

                <div className="flex justify-center mb-3">
                  {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                    <span key={i} className="text-xl text-indigo-600">★</span>
                  ))}
                </div>

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  "{currentTestimonial.review}"
                </p>

              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------ */}
      {/* ✅ NEW: SUBMISSION GUIDELINES */}
      {/* ------------------------------------ */}
      <section className="py-16 px-6 bg-white dark:bg-slate-900 text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Submission Guidelines
        </h2>
        <p className="max-w-2xl mx-auto text-slate-700 dark:text-slate-300 mb-6">
          Want to write for us? Learn about our tone, standards, and submission process.
        </p>

        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={() => setIsGuidelinesOpen(true)}
        >
          View Guidelines
        </Button>
      </section>

      {/* Submission Modal */}
      {isGuidelinesOpen && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-xl border border-slate-200 dark:border-slate-700"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                Submission Guidelines
              </h3>
              <Button variant="ghost" className="text-white" onClick={() => setIsGuidelinesOpen(false)}>
                Close
              </Button>
            </div>

            <div className="whitespace-pre-line text-slate-900 dark:text-slate-200 text-sm leading-relaxed bg-slate-100 dark:bg-slate-900/30 p-4 rounded-xl overflow-y-auto max-h-[60vh]">
              {submissionGuidelines}
            </div>

            <div className="mt-6 text-center">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6" onClick={() => router.push('/signup')}>
                Submit an Article
              </Button>
            </div>

          </motion.div>
        </div>
      )}

      {/* ------------------------------------ */}
      {/* ✅ NEW: OUR EVENTS */}
      {/* ------------------------------------ */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-slate-800/60">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Our Events
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Stay updated with our upcoming community events, webinars, and summits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-md hover:shadow-lg transition-all">
              <div className="w-full h-48 relative">
                <Image src={event.image} alt={event.title} fill className="object-cover"/>
              </div>
              <CardContent className="p-6 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{event.date}</p>
                <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  {event.title}
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">{event.description}</p>

                <Button variant="outline" className="mt-4 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 hover:bg-indigo-50">
                  Learn More
                </Button>

              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ------------------------------------ */}
      {/* Community CTA (unchanged) */}
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
