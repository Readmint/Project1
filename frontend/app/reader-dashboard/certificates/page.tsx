"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, Calendar, Search } from "lucide-react";
import { motion } from "framer-motion";

interface Certificate {
  id: number;
  title: string;
  issue: string;
  date: string;
  image: string;
}

const certificates: Certificate[] = [
  {
    id: 1,
    title: "Digital Reading Achievement",
    issue: "AI Innovators Weekly",
    date: "Jan 12, 2025",
    image: "/certificates/cert1.jpg",
  },
  {
    id: 2,
    title: "Active Reader Award",
    issue: "Design Paradigms",
    date: "Feb 02, 2025",
    image: "/certificates/cert2.jpg",
  },
  {
    id: 3,
    title: "Premium Reader Badge",
    issue: "Global Markets Digest",
    date: "Feb 14, 2025",
    image: "/certificates/cert3.jpg",
  },
];

export default function CertificatesPage() {
  const [search, setSearch] = useState("");

  const filtered = certificates.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 px-6 py-16 space-y-10">

      {/* Header */}
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2">
          <Award size={32} /> Your Certificates
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 mt-2">
          View and download certificates you've earned through your reading journey.
        </p>
      </div>

      {/* Search */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search certificates..."
            className="w-full bg-slate-100 dark:bg-slate-800 pl-9 border border-slate-300 dark:border-slate-700 text-sm py-2 rounded-full 
            focus:outline-none focus:ring-2 focus:ring-indigo-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-8">

        {filtered.map((cert) => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="rounded-2xl bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
              
              {/* Certificate Image */}
              <div className="relative w-full h-48">
                <Image
                  src={cert.image}
                  alt={cert.title}
                  fill
                  className="object-cover"
                />
              </div>

              <CardContent className="p-5 space-y-4">
                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {cert.title}
                </h3>

                {/* Issue + Date */}
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Issue:</span> {cert.issue}
                  </p>
                  <p className="flex items-center gap-1">
                    <Calendar size={13} /> {cert.date}
                  </p>
                </div>

                {/* Download Button */}
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs flex items-center justify-center gap-2"
                  onClick={() => alert(`Downloading ${cert.title}...`)}
                >
                  <Download size={14} /> Download
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 opacity-70">
            <Award size={40} className="mx-auto text-indigo-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              No certificates found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
