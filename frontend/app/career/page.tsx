"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Briefcase, Users, Star, Code, Palette, ShieldCheck } from "lucide-react";

/* Replace authors data with careers */
const careers = [
  {
    id: 1,
    role: "Content Manager",
    department: "Editorial & Content",
    type: "Full-Time",
    openings: 2,
    experience: "3+ years",
    icon: "Users",
    image: "/careers/content-manager.jpg",
    description: "Manage magazine content pipeline, teams, scheduling, publishing, strategy and quality control.",
  },
  {
    id: 2,
    role: "Author / Writer",
    department: "Content Contributors",
    type: "Contract / Freelance",
    openings: 10,
    experience: "Portfolio required",
    icon: "Briefcase",
    image: "/careers/author.jpg",
    description: "Write high-quality magazine articles, opinion pieces, interviews, and storytelling content.",
  },
  {
    id: 3,
    role: "Reviewer",
    department: "Magazine Review Board",
    type: "Part-Time / Remote",
    openings: 5,
    experience: "2+ years",
    icon: "Star",
    image: "/careers/reviewer.jpg",
    description: "Review articles, fact-check, give feedback, maintain credibility and editorial excellence.",
  },
  {
    id: 4,
    role: "Editor",
    department: "Editorial",
    type: "Full-Time",
    openings: 3,
    experience: "3+ years",
    icon: "Palette",
    image: "/careers/editor.jpg",
    description: "Edit and polish articles, maintain tone, structure, accuracy and audience engagement.",
  },
  {
    id: 5,
    role: "SEO Specialist",
    department: "Growth & Marketing",
    type: "Full-Time",
    openings: 1,
    experience: "2+ years",
    icon: "Code",
    image: "/careers/seo.jpg",
    description: "Optimize e-magazine discoverability, keyword strategy, content ranking and traffic growth.",
  },
  {
    id: 6,
    role: "UI/UX Designer",
    department: "Design",
    type: "Contract / Remote",
    openings: 1,
    experience: "3+ years",
    icon: "Palette",
    image: "/careers/uiux.jpg",
    description: "Craft magazine website layout, reader-focused interfaces, typography and interactive experience.",
  },
  {
    id: 7,
    role: "Frontend Developer",
    department: "Engineering",
    type: "Full-Time",
    openings: 2,
    experience: "3+ years",
    icon: "Code",
    image: "/careers/frontend.jpg",
    description: "Build responsive magazine web UI, animations, UI performance and reader-facing features.",
  },
  {
    id: 8,
    role: "Backend Developer",
    department: "Engineering",
    type: "Full-Time",
    openings: 2,
    experience: "3+ years",
    icon: "Briefcase",
    image: "/careers/backend.jpg",
    description: "Develop APIs, CMS infrastructure, database, user handling, authentication and workflows.",
  },
  {
    id: 9,
    role: "Full Stack Developer",
    department: "Engineering",
    type: "Full-Time / Remote",
    openings: 1,
    experience: "4+ years",
    icon: "Code",
    image: "/careers/fullstack.jpg",
    description: "Work across entire magazine platform including CMS, frontend, backend and scaling.",
  },
  {
    id: 10,
    role: "QA / Test Engineer",
    department: "Engineering",
    type: "Part-Time",
    openings: 1,
    experience: "2+ years",
    icon: "ShieldCheck",
    image: "/careers/qa.jpg",
    description: "Test CMS, publishing tools, website reliability, performance, and fix quality issues.",
  },
  {
    id: 11,
    role: "Security Engineer",
    department: "Engineering",
    type: "Full-Time",
    openings: 1,
    experience: "3+ years",
    icon: "ShieldCheck",
    image: "/careers/security.jpg",
    description: "Ensure platform safety, protection, vulnerability checks, authentication and data security.",
  },
  {
    id: 12,
    role: "Data Analyst",
    department: "Insights & Growth",
    type: "Full-Time",
    openings: 1,
    experience: "2+ years",
    icon: "Briefcase",
    image: "/careers/data.jpg",
    description: "Track performance metrics, readership insights, engagement trends and data-driven decisions.",
  },
  {
    id: 13,
    role: "Mobile App Developer",
    department: "Engineering",
    type: "Contract",
    openings: 1,
    experience: "3+ years",
    icon: "Code",
    image: "/careers/mobile.jpg",
    description: "Develop future mobile reading experience for the magazine on iOS & Android.",
  },
  {
    id: 14,
    role: "Cloud Engineer",
    department: "Infrastructure",
    type: "Full-Time",
    openings: 1,
    experience: "3+ years",
    icon: "Briefcase",
    image: "/careers/cloud.jpg",
    description: "Deploy, scale and maintain cloud infrastructure supporting magazine platform reliability.",
  },
  {
    id: 15,
    role: "DevOps Engineer",
    department: "Infrastructure",
    type: "Full-Time",
    openings: 1,
    experience: "3+ years",
    icon: "ShieldCheck",
    image: "/careers/devops.jpg",
    description: "Automate deployments, server monitoring, logs, CI/CD, uptime, reliability and infrastructure stability.",
  }
];

interface Career {
  id: number;
  role: string;
  department: string;
  type: string;
  openings: number;
  experience: string;
  icon: string;
  image: string;
  description: string;
  rating?: number;
}


import { Suspense } from "react";

function CareerContent() {
  const router = useRouter();
  const params = useSearchParams();
  const careerId = params.get("id");

  const [search, setSearch] = useState("");
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);

  useEffect(() => {
    if (careerId) {
      const found = careers.find((r) => r.id === Number(careerId));
      if (found) setSelectedCareer(found);
    }
  }, [careerId]);

  const filtered = careers.filter((role) =>
    role.role.toLowerCase().includes(search.toLowerCase())
  );

  const closeModal = () => {
    setSelectedCareer(null);
    router.replace("/career");
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-900 transition-colors">

      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* HEADING */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 text-center text-slate-900 dark:text-white flex justify-center items-center gap-3">
            <Briefcase className="h-8 w-8 text-indigo-600" /> Careers at Magazine
          </h1>
          <p className="text-center text-slate-600 dark:text-slate-400 text-lg">
            Join our creative and technical team shaping the future of digital storytelling.
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="flex justify-center mb-10">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500 dark:text-slate-300" />
            <Input
              placeholder="Search careers..."
              className="pl-10 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* CAREER GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((career) => (
            <motion.div
              key={career.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center text-center">

                  <div className="w-20 h-20 mb-3">
                    {career.icon === "Users" && <Users className="h-16 w-16 text-indigo-500 mx-auto" />}
                    {career.icon === "Briefcase" && <Briefcase className="h-16 w-16 text-indigo-500 mx-auto" />}
                    {career.icon === "Code" && <Code className="h-16 w-16 text-indigo-500 mx-auto" />}
                    {career.icon === "Palette" && <Palette className="h-16 w-16 text-indigo-500 mx-auto" />}
                    {career.icon === "Star" && <Star className="h-16 w-16 text-yellow-500 mx-auto" />}
                    {career.icon === "ShieldCheck" && <ShieldCheck className="h-16 w-16 text-green-500 mx-auto" />}
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {career.role}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {career.department}
                  </p>

                  <div className="mt-2 text-sm space-y-1 text-slate-700 dark:text-slate-300">
                    <p className="flex items-center gap-1 justify-center"><Briefcase className="h-4 w-4" /> {career.type}</p>
                    <p className="flex items-center gap-1 justify-center"><Users className="h-4 w-4" /> {career.openings} openings</p>
                    <p className="flex items-center gap-1 justify-center"><Briefcase className="h-4 w-4" /> {career.experience} experience</p>
                  </div>

                  <Button
                    className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                    onClick={() => router.push(`/career?id=${career.id}`)}
                  >
                    View Details
                  </Button>

                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* MODAL VIEW FOR SELECTED CAREER */}
      {selectedCareer && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 flex justify-center items-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-lg w-full shadow-xl border border-slate-200 dark:border-slate-700"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-indigo-500" /> {selectedCareer.role}
              </h2>

              <Button
                variant="ghost"
                onClick={closeModal}
                className="text-slate-700 dark:text-slate-300 hover:text-indigo-600"
              >
                Close
              </Button>
            </div>

            <div className="flex gap-5 mb-4">
              <div className="w-28 h-28 relative rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
                <Image src={selectedCareer.image} alt={selectedCareer.role} fill className="object-cover" />
              </div>

              <div className="text-sm text-slate-800 dark:text-slate-300 space-y-1">
                <p className="flex items-center gap-1"><Users className="h-4 w-4" /> {selectedCareer.department}</p>
                <p className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {selectedCareer.type}</p>
                <p className="flex items-center gap-1"><Users className="h-4 w-4" /> {selectedCareer.openings} Openings</p>
                <p className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> Experience: {selectedCareer.experience}</p>
                {selectedCareer.rating && (
                  <p className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> Rating: {selectedCareer.rating}</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-500" /> Role Overview
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedCareer.description}
              </p>

              {/* APPLY BUTTON */}
              <Button className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                Apply for this Role
              </Button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

export default function CareerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>}>
      <CareerContent />
    </Suspense>
  );
}
