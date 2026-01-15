"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";

const slides = [
  {
    title: "Top Trending Article",
    subtitle: "What the world is reading right now",
    image: "/images/Blue Orange Objects  Education .svg",
    href: "/articles/1",
  },
  {
    title: "New Releases",
    subtitle: "Freshly published stories from top contributors",
    image: "/images/Blue and White Minimalist .svg",
    href: "/articles/2",
  },
  {
    title: "Editor’s Pick",
    subtitle: "Hand-selected stories curated by our editorial team",
    image: "/images/Orange And Cream Modern .svg",
    href: "/articles/3",
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  // Auto slide
  useEffect(() => {
    const interval = setInterval(
      () => setIndex((prev) => (prev + 1) % slides.length),
      4500
    );
    return () => clearInterval(interval);
  }, []);

  const slide = slides[index];

  return (
    <div className="relative w-full h-[550px] overflow-hidden bg-slate-100 dark:bg-slate-800 transition-colors">
      <Image
        src={slide.image}
        alt={slide.title}
        fill
        quality={100}
        priority
        className="object-contain opacity-100 p-2"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>

      {/* Text Content */}
      <div className="absolute inset-0 flex items-center px-6 lg:px-20">
        <div className="max-w-xl text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{slide.title}</h2>
          <p className="text-lg md:text-xl opacity-90 mb-6">
            {slide.subtitle}
          </p>

          <Link href={slide.href}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
              Read Now <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <div
            key={i}
            onClick={() => setIndex(i)}
            className={`w-3 h-3 rounded-full cursor-pointer ${i === index
              ? "bg-white"
              : "bg-white/40 hover:bg-white/70 transition"
              }`}
          ></div>
        ))}
      </div>
    </div>
  );
}
