import React from 'react';

export const metadata = {
    title: "Intellectual Property Policy - MindRadix",
    description: "MindRadix Intellectual Property and Copyright Policy.",
};

export default function IntellectualPropertyPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 md:p-12">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">MindRadix – Intellectual Property & Copyright Policy</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 italic">Last Updated: 23‑12‑2025</p>

                <div className="space-y-8 text-slate-700 dark:text-slate-300">
                    <p>
                        This Intellectual Property Policy defines the ownership and usage rights of the content, trademarks, and technology available on MindRadix, owned and operated by Meadow Edutech Private Limited (“The Company”).
                    </p>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">1. Platform Intellectual Property</h2>
                        <p className="mb-2">All materials on the MindRadix platform, including but not limited to:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>The Brand:</strong> The name “MindRadix,” its logos, slogans, and trademarks.</li>
                            <li><strong>Technology:</strong> The website design, layout, graphics, user interface (UI), user experience (UX), source code, and underlying algorithms.</li>
                            <li><strong>Identity:</strong> Any unique identifiers like the ISSN(s) assigned to MindRadix publications.</li>
                            <li><strong>Ownership:</strong> These are the exclusive property of Meadow Edutech Private Limited. No user, author, or institution has the right to use, copy, or imitate these elements for any commercial or personal purpose without prior written consent.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">2. Content Copyright & License</h2>

                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2">2.1. Author Ownership</h3>
                        <p>Authors who publish on MindRadix retain the underlying copyright to their original work.</p>

                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2">2.2. License to MindRadix</h3>
                        <p className="mb-2">By submitting and publishing content on MindRadix, the Author grants the Company a worldwide, non-exclusive, royalty-free, perpetual, irrevocable, and sub-licensable license to:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Host, store, and display the work on the Platform.</li>
                            <li>Distribute, index (in databases like Google Scholar, etc.), and archive the work.</li>
                            <li>Use the work or its snippets for promotional and marketing purposes of MindRadix.</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2">2.3. Survival of License</h3>
                        <p>This license does not expire even if the author deletes their account or terminates the agreement, as it is necessary to maintain the integrity of digital archives.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">3. ISSN Ownership & Usage</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>All ISSN numbers associated with MindRadix magazines and journals are registered to Meadow Edutech Private Limited.</li>
                            <li>Authors and institutions are granted the right to cite the ISSN only in the context of their specific publication on MindRadix.</li>
                            <li>Unauthorized use of MindRadix’s ISSN for other publications or platforms is a legal offense and will be strictly prosecuted.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">4. Permitted Use for Readers</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Readers may access, download, and share published content for personal, educational, and non-commercial purposes only.</li>
                            <li>Proper attribution to the Author and MindRadix must be maintained.</li>
                            <li>Automated data mining, scraping, or harvesting of content from the Platform is strictly prohibited.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">5. Prohibited Activities</h2>
                        <p className="mb-2">Users and third parties are strictly prohibited from:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Using the MindRadix name or logo to imply a partnership or endorsement that does not exist.</li>
                            <li>Republishing MindRadix content on other commercial platforms without express permission from both the Author and the Company.</li>
                            <li>Reverse-engineering the platform or using its design elements to create a competing service.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">6. Copyright Infringement (Takedown Policy)</h2>
                        <p className="mb-2">MindRadix respects the intellectual property of others. If you believe that your work has been copied in a way that constitutes copyright infringement:</p>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                            <ul className="list-disc pl-5 space-y-1 mb-3">
                                <li>You must submit a formal notice to <a href="mailto:support@MindRadix.in" className="text-indigo-600 hover:underline">support@MindRadix.in</a>.</li>
                                <li>The notice should include the URL of the infringing material, your contact details, and proof of your original ownership.</li>
                            </ul>
                            <p>MindRadix will investigate and take appropriate action (removal or disabling access) as per the Information Technology Act, India.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">7. Limitation of Liability</h2>
                        <p>
                            While MindRadix performs plagiarism checks, the ultimate responsibility for the originality of the content lies with the Author. Meadow Edutech Private Limited shall not be held liable for any copyright disputes arising between authors and third parties.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
}
