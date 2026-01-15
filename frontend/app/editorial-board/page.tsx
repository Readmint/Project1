"use client";

import { motion } from "framer-motion";
import {
    Users,
    UserCheck,
    PenTool,
    BookOpen,
    Search,
    ArrowRight
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* --------------------------------------------------------------------------
   DATA (Now Dynamic)
   -------------------------------------------------------------------------- */
import { useEffect, useState } from "react";
import { getJSON } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function EditorialBoardPage() {
    const [boardMembers, setBoardMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBoard = async () => {
            try {
                const res = await getJSON("/editorial/board");
                if (res.status === "success") {
                    setBoardMembers(res.data);
                }
            } catch (e) {
                console.error("Failed to fetch board members", e);
            } finally {
                setLoading(false);
            }
        };
        fetchBoard();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">

            {/* ------------------------------------------------------------------
          HERO / JOIN US SECTION
         ------------------------------------------------------------------ */}
            <section className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="absolute inset-0 bg-indigo-50/50 dark:bg-indigo-900/10 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                                <Users size={14} /> Join Our Community
                            </div>

                            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                Join Our <span className="text-indigo-600">Editorial Board</span>
                            </h1>

                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
                                ReadMint is a multilingual digital publication platform inviting experts to join our editorial team.
                                You can apply in English or your local Indian language.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                                        <UserCheck size={18} className="text-indigo-600" /> Open Roles
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {["Editor-in-Chief", "Editor", "Content Manager", "Senior Reviewer", "Reviewer"].map((role) => (
                                            <span key={role} className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">Who Can Apply</h4>
                                        <p className="text-sm text-slate-500">Academicians • Professionals • Language & Subject Experts</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">Why Join</h4>
                                        <ul className="text-sm text-slate-500 space-y-0.5">
                                            <li className="flex items-center gap-1.5"><span className="text-green-500">✔</span> Appointment Letter</li>
                                            <li className="flex items-center gap-1.5"><span className="text-green-500">✔</span> Editorial Certificate</li>
                                            <li className="flex items-center gap-1.5"><span className="text-green-500">✔</span> Profile Listing</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Link href="/apply-editorial">
                                    <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 text-base shadow-lg hover:shadow-xl transition-all">
                                        Apply Now <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                </Link>
                                <p className="text-[10px] text-slate-400 mt-3">* Selection subject to internal review & ethics standards</p>
                            </div>

                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative hidden md:block"
                        >
                            {/* Decorative background elements or image */}
                            <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-slate-200 dark:bg-slate-800">
                                <img
                                    src="/images/Blue%20White%20Modern%20Meet%20The%20Team%20Collection%20LinkedIn%20Post.svg"
                                    alt="Editorial Team"
                                    className="w-full h-auto object-contain"
                                />
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* ------------------------------------------------------------------
          EDITORIAL BOARD MEMBERS
         ------------------------------------------------------------------ */}
            <section className="py-20 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Editorial Board</h2>
                    <div className="h-1 w-20 bg-indigo-600 mx-auto rounded-full" />
                    <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Meet the distinguished experts leading our publication standards and integrity.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {boardMembers.length > 0 ? boardMembers.map((member: any, idx) => (
                            <BoardMemberCard key={idx} member={member} index={idx} />
                        )) : (
                            <div className="col-span-full text-center py-10 text-slate-500">
                                No board members found.
                            </div>
                        )}
                    </div>
                )}
            </section>

        </div>
    );
}

/* --------------------------------------------------------------------------
   COMPONENTS
   -------------------------------------------------------------------------- */

function BoardMemberCard({ member, index }: { member: any; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
        >
            <Card className="h-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col">
                {/* Header Color Strip */}
                <div className={`h-2 w-full ${member.color.split(' ')[0].replace('/30', '')}`} />

                <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border items-center justify-center flex text-2xl">
                            {member.image ? (
                                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                                member.name.split(" ").map((n: any) => n[0]).join("").slice(0, 2)
                            )}
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${member.color}`}>
                            {member.role}
                        </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        {member.name}
                    </h3>

                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-4 h-10 line-clamp-2">
                        {member.affiliation}
                    </p>

                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                        {member.bio}
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
