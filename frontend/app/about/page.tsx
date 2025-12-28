import React from 'react';
import { Mail, Globe, MapPin } from 'lucide-react';

export const metadata = {
    title: "About Us - MindRadix",
    description: "MindRadix: Democratizing Global Knowledge. A Multilingual & Multidisciplinary Publishing House.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            {/* Hero / Header Section */}
            <div className="max-w-5xl mx-auto mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-100 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    About MindRadix
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 font-medium max-w-3xl mx-auto">
                    Democratizing Global Knowledge, One Language at a Time
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-12">

                {/* Introduction */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8 md:p-10">
                    <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                        Welcome to <span className="font-semibold text-indigo-600 dark:text-indigo-400">MindRadix</span>, a premier, technology-driven international publication powerhouse. Operated by <strong>Meadow Edutech Private Limited</strong>, MindRadix is a first-of-its-kind Multilingual & Multidisciplinary Publishing House.
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        We believe that Knowledge has no language barrier. Our platform is a revolutionary ecosystem where intellectual brilliance meets linguistic diversity. We empower authors to think and write in their native tongues while ensuring their work receives global recognition through our world-class verification and publication standards.
                    </p>
                </section>

                {/* Vision */}
                <section className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-8 md:p-10 border border-indigo-100 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        👁️ Our Vision
                    </h2>
                    <blockquote className="text-xl italic text-slate-800 dark:text-slate-200 border-l-4 border-indigo-500 pl-4 mb-6">
                        &quot;To emerge as the world’s most trusted, inclusive, and technologically advanced repository of human intellect, where language is a bridge, not a barrier.&quot;
                    </blockquote>
                    <p className="text-slate-700 dark:text-slate-300">
                        We envision a global stage where a researcher in a small town can publish groundbreaking work in their local language and still be recognized as a global scholar. MindRadix is dedicated to building a lighthouse of knowledge—archiving the rich linguistic and intellectual diversity of the world for generations to come.
                    </p>
                </section>

                {/* Mission */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                        🎯 Our Mission: The Four Pillars of Excellence
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { title: "Linguistic Empowerment", desc: "To enable authors to submit manuscripts in their native/local languages, ensuring that profound ideas are never lost due to a lack of English proficiency." },
                            { title: "Sector-Specific Mastery", desc: "To publish specialized, ISSN-certified magazines across every major sector—from Science and Technology to Arts, Humanities, Commerce, and Medicine." },
                            { title: "Academic Purity", desc: "To protect the sanctity of research by implementing a zero-tolerance policy against plagiarism through rigorous, multi-layered verification." },
                            { title: "Hybrid Publishing Excellence", desc: "To synchronize the instant reach of the digital age with the timeless, prestigious legacy of high-quality physical print." }
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
                        🛡️ The MindRadix Vanguard: Our Core USPs
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        What makes MindRadix the gold standard in modern publishing is our commitment to Originality and Domain Accuracy through two specialized protocols:
                    </p>

                    <div className="space-y-8">
                        <div className="border-l-4 border-green-500 pl-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">1. Subject-Language Expert Synergy (SME Matching)</h3>
                            <p className="text-slate-700 dark:text-slate-300 mb-3">We don&apos;t just &quot;translate&quot;; we &quot;validate.&quot; At MindRadix, our Content Managers follow a scientific workflow to ensure that every manuscript is reviewed by a peer:</p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                                <li><strong>The Expert Match:</strong> If an author submits a manuscript in a local language (e.g., Hindi, Marathi, Tamil, etc.), we assign it to an Editor and Reviewer who is a certified expert in that specific field AND a master of that specific language.</li>
                                <li><strong>Conceptual Depth:</strong> A technical paper on Engineering will be reviewed by an Engineer fluent in that language. This ensures that the technical nuances and linguistic integrity of the work remain 100% intact.</li>
                            </ul>
                        </div>

                        <div className="border-l-4 border-blue-500 pl-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">2. The &quot;Double-Check&quot; Cross-Verification System</h3>
                            <p className="text-slate-700 dark:text-slate-300 mb-3">To protect the reputation of our magazines and our authors, we implement a fortified original content check:</p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                                <li><strong>Independent Deep-Scan:</strong> Regardless of the author’s provided report, our team performs an autonomous, independent deep-scan using global-standard plagiarism detection databases.</li>
                                <li><strong>Human-Intelligence Filter:</strong> Our experts go beyond software to screen for &apos;Synthetic (AI) Content&apos; and &apos;Conceptual Paraphrasing,&apos; ensuring the MindRadix archive is a collection of 100% authentic human intellect.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Values - DNA */}
                <section>
                    <div className="bg-slate-900 text-white rounded-2xl p-8 md:p-12 relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                        <h2 className="text-2xl font-bold mb-8 relative z-10 flex items-center gap-2">💎 The MindRadix DNA (Our Values)</h2>
                        <div className="grid md:grid-cols-2 gap-8 relative z-10">
                            {[
                                { title: "Integrity", desc: "Radical transparency in every editorial decision and a strict 15% similarity index limit." },
                                { title: "Innovation", desc: "Utilizing pioneering AI and technology to simplify the publishing journey for the modern author." },
                                { title: "Inclusivity", desc: "Celebrating the diversity of languages and disciplines under one unified brand." },
                                { title: "Legacy", desc: "Treating every publication as a permanent, citable contribution to the world's scholarly history." }
                            ].map((item, idx) => (
                                <div key={idx}>
                                    <h3 className="text-lg font-bold text-indigo-300 mb-1">{item.title}</h3>
                                    <p className="text-slate-300 text-sm">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Corporate Stewardship */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8 md:p-10">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        🏢 Corporate Stewardship
                    </h2>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        MindRadix is the flagship brand of <strong>Meadow Edutech Private Limited</strong>, a company incorporated under the Companies Act, 2013, India. Built on the foundation of ethical innovation, Meadow Edutech is committed to creating digital and physical publishing solutions that fortify the fields of education and research globally. By combining legal compliance with technical expertise, we ensure that our partners and users are always protected.
                    </p>
                </section>

                {/* Join Revolution & Contact */}
                <section className="text-center py-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">🤝 Join the Knowledge Revolution</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
                        Whether you are a student writing your first article in your mother tongue, a researcher documenting a breakthrough, or a university seeking a global digital partner—MindRadix is your home.
                    </p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-12">
                        Write in your tongue. Read in your language. Gain Global Recognition.
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 max-w-xl mx-auto">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Corporate Office</h3>
                        <div className="space-y-4 text-slate-600 dark:text-slate-400">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">Meadow Edutech Private Limited</div>
                            <div className="flex items-center justify-center gap-2 text-center px-4">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span>Office No. 123, 1st Floor, Tech Park, Jaipur, Rajasthan, India - 302001</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Mail className="w-4 h-4" />
                                <a href="mailto:support@MindRadix.in" className="hover:text-indigo-600">support@MindRadix.in</a>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Globe className="w-4 h-4" />
                                <a href="https://www.MindRadix.in" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">www.MindRadix.in</a>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
