import React from 'react';
import { Mail, Globe, MapPin } from 'lucide-react';

export const metadata = {
    title: "About Us - MindRadiX",
    description: "MindRadiX: Democratizing Global Knowledge. A Multilingual & Multidisciplinary Publishing House.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            {/* Hero / Header Section */}
            <div className="max-w-5xl mx-auto mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-100 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    About MindRadiX
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 font-medium max-w-3xl mx-auto">
                    Democratizing Global Knowledge, One Language at a Time
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-12">

                {/* Introduction */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8 md:p-10">
                    <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                        Welcome to <span className="font-semibold text-indigo-600 dark:text-indigo-400">MindRadiX</span>, a premier, technology-driven international publication powerhouse and a first-of-its-kind multilingual & multidisciplinary publishing ecosystem.
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        At MindRadiX, we believe that knowledge has no language barrier. Our platform is built to bridge intellectual excellence with linguistic diversity—empowering authors to think, research, and publish in their native languages while ensuring their work receives global recognition through world-class editorial, verification, and publication standards.
                    </p>
                </section>

                {/* Vision */}
                <section className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-8 md:p-10 border border-indigo-100 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        👁️ Our Vision
                    </h2>
                    <blockquote className="text-xl italic text-slate-800 dark:text-slate-200 border-l-4 border-indigo-500 pl-4 mb-6">
                        &quot;To emerge as the world’s most trusted, inclusive, and technologically advanced repository of human intellect—where language is a bridge, not a barrier.&quot;
                    </blockquote>
                    <p className="text-slate-700 dark:text-slate-300">
                        We envision a global stage where a researcher from a small town can publish groundbreaking work in their local language and still be recognized as a global scholar. MindRadiX is dedicated to building a lighthouse of knowledge, preserving the world’s rich linguistic and intellectual diversity for generations to come.
                    </p>
                </section>

                {/* Mission */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                        🎯 Our Mission: The Four Pillars of Excellence
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { title: "Linguistic Empowerment", desc: "To enable authors to submit manuscripts in their native and local languages, ensuring that profound ideas are never lost due to language limitations." },
                            { title: "Sector-Specific Mastery", desc: "To publish specialized, ISSN-aligned magazines across every major discipline—from Science and Technology to Arts, Humanities, Commerce, and Medicine." },
                            { title: "Academic Purity", desc: "To protect the sanctity of research through a zero-tolerance policy against plagiarism, supported by rigorous, multi-layered verification." },
                            { title: "Hybrid Publishing Excellence", desc: "To combine the instant global reach of digital publishing with the timeless prestige of high-quality physical print." }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-2">{item.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* USPs */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8 md:p-10">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                        🛡️ The MindRadiX Vanguard: Our Core USPs
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        What establishes MindRadiX as a gold standard in modern publishing is our uncompromising commitment to originality, accuracy, and domain integrity, delivered through two specialized protocols:
                    </p>

                    <div className="space-y-8">
                        <div className="border-l-4 border-green-500 pl-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">1. Subject–Language Expert Synergy (SME Matching)</h3>
                            <p className="text-slate-700 dark:text-slate-300 mb-3">We don&apos;t just translate — we validate.</p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                                <li><strong>Expert Match:</strong> Manuscripts submitted in regional or global languages (Hindi, Marathi, Tamil, Bengali, etc.) are reviewed by Editors and Reviewers who are both domain experts and language specialists.</li>
                                <li><strong>Conceptual Depth:</strong> Technical and research-oriented papers are evaluated by subject-matter professionals fluent in the manuscript’s language, ensuring that both technical nuance and linguistic integrity remain fully intact.</li>
                            </ul>
                        </div>

                        <div className="border-l-4 border-blue-500 pl-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">2. The &quot;Double-Check&quot; Cross-Verification System</h3>
                            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                                <li><strong>Independent Deep-Scan:</strong> Every submission undergoes an autonomous originality check using globally recognized plagiarism-detection databases.</li>
                                <li><strong>Human-Intelligence Filter:</strong> Beyond software, expert reviewers screen for AI-generated content, synthetic writing, and conceptual paraphrasing—ensuring the MindRadiX archive represents 100% authentic human intellect.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Values - DNA */}
                <section>
                    <div className="bg-slate-900 text-white rounded-2xl p-8 md:p-12 relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                        <h2 className="text-2xl font-bold mb-8 relative z-10 flex items-center gap-2">💎 The MindRadiX DNA (Our Values)</h2>
                        <div className="grid md:grid-cols-2 gap-8 relative z-10">
                            {[
                                { title: "Integrity", desc: "Radical transparency in editorial decisions with a strict similarity threshold." },
                                { title: "Innovation", desc: "Leveraging advanced technology and AI to elevate and simplify the publishing journey." },
                                { title: "Inclusivity", desc: "Celebrating linguistic, cultural, and disciplinary diversity under one unified global platform." },
                                { title: "Legacy", desc: "Treating every publication as a permanent, citable contribution to the world’s scholarly record." }
                            ].map((item, idx) => (
                                <div key={idx}>
                                    <h3 className="text-lg font-bold text-indigo-300 mb-1">{item.title}</h3>
                                    <p className="text-slate-300 text-sm">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Join Revolution & Contact */}
                <section className="text-center py-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">🤝 Join the Knowledge Revolution</h2>
                    <div className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 space-y-2">
                        <p>Whether you are:</p>
                        <ul className="list-disc pl-5 text-left inline-block mx-auto">
                            <li>a student publishing your first article in your mother tongue,</li>
                            <li>a researcher documenting a breakthrough, or</li>
                            <li>an institution seeking a trusted global publication partner—</li>
                        </ul>
                        <p className="mt-4 font-medium">MindRadiX is your home.</p>
                    </div>

                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-12">
                        Write in your language. Read in your language. Gain global recognition.
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 max-w-xl mx-auto">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Contact MindRadiX</h3>
                        <div className="space-y-4 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center justify-center gap-2">
                                <Mail className="w-4 h-4" />
                                <a href="mailto:info.mindradix@gmail.com" className="hover:text-indigo-600">info.mindradix@gmail.com</a>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Globe className="w-4 h-4" />
                                <a href="https://www.mindradix.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">www.mindradix.com</a>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
