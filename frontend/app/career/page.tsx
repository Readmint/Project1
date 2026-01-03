"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Briefcase, Users, Star, Code, Palette, ShieldCheck, X } from "lucide-react";
import { getJSON, postJSON } from "@/lib/api";
import { toast } from "sonner";

// --- Types ---
interface JobRole {
  id: string;
  role: string;
  department: string;
  type: string;
  openings: number;
  experience: string;
  description: string;
  icon: string;
  image: string;
  status: 'active' | 'closed';
}

function CareerContent() {
  const router = useRouter();
  const params = useSearchParams();
  const careerId = params.get("id");

  const [roles, setRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCareer, setSelectedCareer] = useState<JobRole | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Application Form State
  const [formData, setFormData] = useState({
    applicant_name: "",
    email: "",
    phone: "",
    resume_link: "",
    portfolio_link: "",
    cover_letter: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch Roles
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await getJSON("/careers/roles");
        if (res.status === 'success') {
          setRoles(res.data.roles);
        }
      } catch (error) {
        console.error("Failed to fetch roles", error);
        toast.error("Could not load job openings");
      } finally {
        setLoading(false);
      }
    }
    fetchRoles();
  }, []);

  // Handle URL param selection
  useEffect(() => {
    if (careerId && roles.length > 0) {
      const found = roles.find((r) => r.id === careerId);
      if (found) setSelectedCareer(found);
    }
  }, [careerId, roles]);

  const filtered = roles.filter((role) =>
    role.role.toLowerCase().includes(search.toLowerCase())
  );

  const closeModal = () => {
    setSelectedCareer(null);
    setIsApplying(false);
    router.replace("/career");
  };

  const handleApplyClick = () => {
    setIsApplying(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCareer) return;

    setSubmitting(true);
    try {
      // Date formatting for robust submission
      // Using postJSON which calls /api/api/careers/apply
      await postJSON("/careers/apply", {
        role_id: selectedCareer.id,
        role_name: selectedCareer.role,
        ...formData
      });

      toast.success("Application Submitted!", { description: "We will review your profile shortly." });
      closeModal();
      setFormData({ applicant_name: "", email: "", phone: "", resume_link: "", portfolio_link: "", cover_letter: "" });
    } catch (error: any) {
      console.error("Application error", error);
      toast.error("Submission Failed", { description: error.message || "Please try again." });
    } finally {
      setSubmitting(false);
    }
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

        {/* LOADING STATE */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* CAREER GRID */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((career) => (
              <motion.div
                key={career.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden h-full flex flex-col">
                  <CardContent className="p-6 flex flex-col items-center text-center flex-grow">

                    <div className="w-20 h-20 mb-3 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-full">
                      {/* Dynamic Icon Fallback */}
                      {career.icon === "Users" ? <Users className="h-10 w-10 text-indigo-500" /> :
                        career.icon === "Code" ? <Code className="h-10 w-10 text-indigo-500" /> :
                          career.icon === "Palette" ? <Palette className="h-10 w-10 text-indigo-500" /> :
                            career.icon === "Star" ? <Star className="h-10 w-10 text-yellow-500" /> :
                              career.icon === "ShieldCheck" ? <ShieldCheck className="h-10 w-10 text-green-500" /> :
                                <Briefcase className="h-10 w-10 text-indigo-500" />}
                    </div>

                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                      {career.role}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {career.department}
                    </p>

                    <div className="mt-auto text-sm space-y-1 text-slate-700 dark:text-slate-300 w-full">
                      <p className="flex items-center gap-2 justify-center"><Briefcase className="h-4 w-4 opacity-70" /> {career.type}</p>
                      <p className="flex items-center gap-2 justify-center"><Users className="h-4 w-4 opacity-70" /> {career.openings} openings</p>
                      <p className="flex items-center gap-2 justify-center"><Star className="h-4 w-4 opacity-70" /> {career.experience}</p>
                    </div>

                    <Button
                      className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                      onClick={() => router.push(`/career?id=${career.id}`)}
                    >
                      View Details
                    </Button>

                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {!loading && filtered.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-500">
                No open positions match your search.
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL VIEW FOR SELECTED CAREER */}
      {selectedCareer && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 flex justify-center items-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-2xl w-full shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-indigo-500" /> {selectedCareer.role}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{selectedCareer.department} • {selectedCareer.type}</p>
              </div>

              <Button
                variant="ghost"
                onClick={closeModal}
                className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 -mt-2 -mr-2"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {!isApplying ? (
              <>
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="w-full md:w-1/3 aspect-square relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                    {/* Use default image if none provided */}
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-slate-900 text-indigo-200 dark:text-slate-700">
                      <Briefcase className="h-20 w-20" />
                    </div>
                    {selectedCareer.image && selectedCareer.image !== '/careers/default.jpg' && (
                      <Image src={selectedCareer.image} alt={selectedCareer.role} fill className="object-cover" />
                    )}
                  </div>

                  <div className="flex-1 text-sm text-slate-800 dark:text-slate-300 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Experience</p>
                        <p className="font-medium">{selectedCareer.experience}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Openings</p>
                        <p className="font-medium">{selectedCareer.openings}</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
                        <Briefcase className="h-4 w-4 text-indigo-500" /> Role Overview
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                        {selectedCareer.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <Button
                    onClick={handleApplyClick}
                    className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all"
                  >
                    Apply for this Role
                  </Button>
                </div>
              </>
            ) : (
              /* APPLICATION FORM */
              <form onSubmit={handleApplySubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <Button variant="ghost" size="sm" onClick={() => setIsApplying(false)} type="button" className="p-0 h-auto hover:bg-transparent text-indigo-600">Back</Button>
                  <span className="text-slate-400">/</span>
                  <span className="font-medium text-slate-900 dark:text-white">Application Form</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.applicant_name}
                      onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resume">Resume / CV Link *</Label>
                    <Input
                      id="resume"
                      required
                      value={formData.resume_link}
                      onChange={(e) => setFormData({ ...formData, resume_link: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
                    <p className="text-xs text-slate-500">Provide a link to your LinkedIn, Google Drive, or personal site.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio URL</Label>
                    <Input
                      id="portfolio"
                      value={formData.portfolio_link}
                      onChange={(e) => setFormData({ ...formData, portfolio_link: e.target.value })}
                      placeholder="https://behance.net/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover">Cover Letter (Optional)</Label>
                  <Textarea
                    id="cover"
                    rows={4}
                    value={formData.cover_letter}
                    onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                    placeholder="Tell us why you're a great fit..."
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    {submitting ? "Submitting Application..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            )}

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
