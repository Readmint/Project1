import React from 'react';

export const metadata = {
    title: "Plagiarism & Ethics Policy - MindRadix",
    description: "MindRadix Plagiarism and Publication Ethics Policy.",
};

export default function PlagiarismEthicsPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 md:p-12">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">MindRadix – Plagiarism & Publication Ethics Policy</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 italic">Last Updated: 23‑12‑2025</p>

                <div className="space-y-8 text-slate-700 dark:text-slate-300">
                    <p>
                        MindRadix (owned by Meadow Edutech Private Limited) is committed to maintaining the highest standards of publication ethics. We ensure that all content published on our platform—whether in e-magazines, articles, or books—is original, ethical, and reliable.
                    </p>
                    <p>
                        This policy applies to all Authors, Editors, Reviewers, and Institutional Partners.
                    </p>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">1. Plagiarism Policy</h2>
                        <p>Plagiarism is the act of presenting someone else’s work, ideas, or data as your own without proper acknowledgment.</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li><strong>Screening Process:</strong> Every manuscript submitted to MindRadix undergoes mandatory screening through advanced AI-based plagiarism detection software.</li>
                            <li><strong>Permissible Limit:</strong> We generally accept content with a similarity index of less than 15% (excluding references/bibliography). However, any single source showing more than 3-5% similarity may be flagged.</li>
                            <li><strong>Self-Plagiarism:</strong> Authors must not submit manuscripts that reuse significant portions of their own previously published work without proper citation or justification.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">2. Usage of Artificial Intelligence (AI)</h2>
                        <p>In the era of Generative AI (like ChatGPT), MindRadix follows these rules:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li><strong>Disclosure:</strong> Authors must clearly disclose if AI tools were used in the writing, data analysis, or image generation process.</li>
                            <li><strong>Responsibility:</strong> AI cannot be listed as an author. The human author(s) remain legally and ethically responsible for the accuracy and originality of the content.</li>
                            <li><strong>Excessive AI Content:</strong> MindRadix reserves the right to reject content that is found to be 100% AI-generated without significant human contribution.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">3. Authorship & Contributions</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Genuine Authorship:</strong> All individuals listed as authors must have made a significant intellectual contribution to the work.</li>
                            <li><strong>Guest/Gift Authorship:</strong> Including individuals who did not contribute to the work is strictly prohibited.</li>
                            <li><strong>Changes in Authorship:</strong> Any changes to the author list after submission must be backed by a written explanation and consent from all authors involved.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">4. Data Integrity & Originality</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Original Work:</strong> By submitting to MindRadix, authors guarantee that the work is original and has not been published elsewhere (in any language).</li>
                            <li><strong>Data Fabrication:</strong> Any evidence of faking data, manipulating images, or misrepresenting facts will lead to immediate rejection and a permanent ban on the author.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">5. Conflict of Interest</h2>
                        <p>
                            Authors must disclose any financial, personal, or professional relationships that could be perceived as influencing their work. This includes sponsorships, grants, or employment by organizations that may benefit from the publication.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">6. Peer Review & Editorial Integrity</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Unbiased Review:</strong> Our editorial team and reviewers are required to evaluate manuscripts based solely on intellectual merit, without regard to the author's race, gender, religion, or institutional affiliation.</li>
                            <li><strong>Confidentiality:</strong> Reviewers must treat all submitted manuscripts as confidential documents and must not use the content for their own benefit before publication.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">7. Actions Against Misconduct</h2>
                        <p>If plagiarism or ethical misconduct is discovered (either before or after publication), MindRadix will take the following actions:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li><strong>Pre-Publication:</strong> Immediate rejection of the manuscript and forfeiture of any processing fees paid.</li>
                            <li><strong>Post-Publication:</strong> The content will be formally Retracted or removed. A 'Retraction Note' will be published to inform readers.</li>
                            <li><strong>Institutional Notification:</strong> In severe cases, MindRadix may report the misconduct to the author’s University, College, or Employer.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">8. Reporting Ethical Concerns</h2>
                        <p className="mb-2">If any reader or user identifies a case of plagiarism or ethical breach on our platform, they are encouraged to report it to our editorial team at:</p>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                            <p><strong>Email:</strong> <a href="mailto:support@MindRadix.in" className="text-indigo-600 hover:underline">support@MindRadix.in</a></p>
                            <p>We investigate all such claims with confidentiality and rigor.</p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
