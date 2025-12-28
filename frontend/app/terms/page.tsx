import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsAndConditions() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/signup">
                    <Button variant="ghost" className="mb-6 text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:text-slate-900 dark:hover:text-white">
                        <ArrowLeft size={18} />
                        Back to Sign Up
                    </Button>
                </Link>

                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 sm:p-12 border border-slate-200 dark:border-slate-700">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">MindRadix – Website Terms & Conditions</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 italic">Last Updated: 23‑12‑2025</p>

                    <div className="prose dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300">

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Platform Identity & Legal Entity</h2>
                            <p>
                                MindRadix – An International Publication Platform ("MindRadix", "Platform", "we", "us", "our") is a digital publication platform owned and operated by Meadow Edutech Private Limited, a company incorporated under the Companies Act, 2013, India. MindRadix provides technology‑enabled services for digital reading, submission, review, editing, plagiarism screening, and publication of content. All services are offered under the brand name MindRadix.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Acceptance & Binding Agreement</h2>
                            <p className="mb-2">
                                By accessing, browsing, registering, or otherwise using the Platform, you agree to be legally bound by these Terms & Conditions, together with our:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mb-2">
                                <li>Privacy Policy (Compliant with the Digital Personal Data Protection Act, 2023);</li>
                                <li>Author Terms, Declarations & Undertakings;</li>
                                <li>Refund & Cancellation Policy;</li>
                                <li>Shipping & Delivery Policy;</li>
                                <li>Institutional or service‑specific terms.</li>
                            </ul>
                            <p>
                                If you do not agree, you must immediately discontinue use. These Terms constitute a legally binding agreement between you and Meadow Edutech Private Limited.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Eligibility</h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Users must be 18 years or older.</li>
                                <li>Institutional accounts must be created by authorized representatives.</li>
                                <li>You represent that you have the legal capacity to enter into this Agreement.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Scope of Services</h2>
                            <ul className="list-none space-y-2">
                                <li><strong>4.1 Current Services:</strong> E‑Magazines and Articles.</li>
                                <li><strong>4.2 Physical Goods:</strong> MindRadix may offer printed versions of magazines, journals, and books. Shipping of these goods is governed by these Terms and our specific Shipping Policy.</li>
                                <li><strong>4.3 Future Services:</strong> MindRadix may introduce research papers, e‑books, or institutional publications. Such services will be governed by updated terms. MindRadix is under no obligation to accept or continue any service.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. User Categories</h2>
                            <p>
                                These Terms apply to all users, including Readers, Authors, Editors, Reviewers, Content Managers, Universities, Colleges, Institutions, NGOs, and Organizations.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Accounts, Credentials & Security</h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Users must provide accurate information. Accounts are non-transferable.</li>
                                <li>Users are responsible for all activities conducted through their accounts.</li>
                                <li>MindRadix is not liable for losses due to unauthorized access caused by user negligence.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">7. Content Ownership, License & Withdrawal</h2>
                            <ul className="list-none space-y-2">
                                <li><strong>7.1 Ownership:</strong> Authors retain ownership of their original content unless otherwise agreed in writing.</li>
                                <li><strong>7.2 License Grant:</strong> By submitting content, Authors grant MindRadix a worldwide, non‑exclusive, royalty‑free, perpetual, irrevocable, and sublicensable license to host, publish, distribute, and display such content in both digital and physical (print) formats.</li>
                                <li><strong>7.3 Content Withdrawal:</strong> Once published, content becomes part of a permanent archive. Requests for removal post-publication are subject to editorial approval and may incur a 'Withdrawal Fee'. MindRadix reserves the right to issue a 'Retraction Note' instead of complete removal.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">8. ISSN & Publication Identity</h2>
                            <p>
                                All magazines are issued under ISSN(s) owned by Meadow Edutech Private Limited. Authors/Institutions acquire no ownership rights in the ISSN. Usage is valid only within the MindRadix Platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">9. Editorial Control, Ethics & Plagiarism</h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>All submissions undergo editorial review and plagiarism screening.</li>
                                <li>Unethical, plagiarized, or unlawful content will be rejected or removed.</li>
                                <li>Editorial decisions are final and binding.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">10. Payments, Fees & Taxes</h2>
                            <p>
                                All fees (Processing, Publication, Plagiarism-check) are exclusive of GST unless stated. MindRadix currently does not collect GST. If any tax becomes applicable in the future under Indian law, it shall be borne by the user.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">11. Refund and Cancellation Policy</h2>
                            <ul className="list-none space-y-2">
                                <li><strong>11.1 Processing Fees:</strong> Fees for plagiarism checks or editorial processing are non-refundable once the process has started.</li>
                                <li><strong>11.2 Subscriptions:</strong> Users may cancel subscriptions at any time, but no refunds will be issued for the remaining active period.</li>
                                <li><strong>11.3 Physical Goods:</strong> Orders for physical products can be cancelled for a full refund only within 24 hours of placing the order. No refund will be issued if the parcel is packed, a delivery partner is assigned, or the order is dispatched.</li>
                                <li><strong>11.4 Wrong Product:</strong> Refund/Replacement for physical goods applies only for "Wrong Product" delivery, subject to a mandatory Unboxing Video as proof.</li>
                                <li><strong>11.5 Duplicate Payments:</strong> Must be reported to <a href="mailto:support@MindRadix.in" className="text-indigo-600 hover:underline">support@MindRadix.in</a> within 7 working days for a reversal claim.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">12. Shipping & Delivery</h2>
                            <ul className="list-none space-y-2">
                                <li><strong>Timelines:</strong> Standard delivery takes 5-10 working days within India.</li>
                                <li><strong>RTO Charges:</strong> If a parcel returns due to the user's error (wrong address/unavailability), additional shipping charges for re-delivery will be borne by the user.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">13. Prohibited Conduct & User Comments</h2>
                            <ul className="list-none space-y-2">
                                <li><strong>13.1 Conduct:</strong> Users shall not upload illegal content, scrape data, or bypass security.</li>
                                <li><strong>13.2 User Comments:</strong> Responsibility for comments lies solely with the user. MindRadix reserves the right to delete defamatory or offensive remarks.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">14. Advertising & Sponsorship</h2>
                            <p>
                                MindRadix may display advertisements and sponsorships. The responsibility for the accuracy of claims made in such advertisements rests solely with the advertiser. MindRadix does not endorse these products/services and is not liable for any interactions with the advertiser.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">15. Institutional & Bulk Publishing</h2>
                            <p>
                                Universities and NGOs may publish in bulk or conduct conferences. Separate dashboards or agreements may be provided for these entities.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">16. Third‑Party Links & Services</h2>
                            <p>
                                The Platform may contain links to third‑party sites. MindRadix does not endorse or control such sites and is not responsible for their content.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">17. Limitation of Liability</h2>
                            <p>
                                MindRadix and Meadow Edutech Private Limited shall not be liable for indirect, incidental, or academic damages. Maximum liability shall not exceed the amount paid by the user to the Platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">18. Disclaimer of Warranties & No Professional Advice</h2>
                            <ul className="list-none space-y-2">
                                <li><strong>18.1 General Disclaimer:</strong> All Services are provided “as‑is”. MindRadix disclaims all warranties, including accuracy and suitability.</li>
                                <li><strong>18.2 No Professional Advice:</strong> Content published on MindRadix is for informational purposes only and does NOT constitute professional, medical, legal, or financial advice. MindRadix and Meadow Edutech are not liable for damages arising from reliance on such information.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">19. Indemnification</h2>
                            <p>
                                You agree to indemnify MindRadix from claims, damages, and expenses arising from your submissions, misuse of Services, or violation of these Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">20. Suspension, Termination & Systematic Downtime</h2>
                            <ul className="list-none space-y-2">
                                <li><strong>20.1 Termination:</strong> MindRadix may suspend accounts for Terms violations or ethical breaches at any time.</li>
                                <li><strong>20.2 Systematic Downtime:</strong> MindRadix reserves the right to temporarily suspend the Platform for scheduled maintenance or technical fixes. We shall not be liable for any inconvenience or data loss during such downtime.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">21. Force Majeure</h2>
                            <p>
                                Neither party shall be liable for delays due to events beyond control, including natural disasters or technical outages.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">22. Governing Law & Dispute Resolution</h2>
                            <p>
                                These Terms are governed by the laws of India. Disputes shall be resolved by arbitration in India, with courts at the Company’s registered office having jurisdiction.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">23. Modifications</h2>
                            <p>
                                MindRadix may modify these Terms at any time. Continued use constitutes acceptance of the new Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">24. Artificial Intelligence & Automated Tools Usage</h2>
                            <p>
                                MindRadix may use AI for screening. Authors must disclose AI usage in manuscripts. MindRadix is not liable for outcomes arising from reliance on automated tools.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">25. No Guarantee of Indexing or Recognition</h2>
                            <p>
                                Publication does not guarantee indexing in UGC-CARE, Scopus, or other bodies. Recognition is subject to independent third-party evaluation.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">26. Content Removal & Legal Compliance</h2>
                            <p>
                                MindRadix reserves the right to remove content without notice to comply with court orders or government directives.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">27. Language & Translation Disclaimer</h2>
                            <p>
                                MindRadix does not guarantee the accuracy of automated translations. Users are responsible for verifying content in their chosen language.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">28. Survival & Severability</h2>
                            <p>
                                Provisions regarding licenses, liability, and governing law shall survive termination. If any provision is held unenforceable, the remainder remains in effect.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">29. Grievance Redressal & IP Infringement</h2>
                            <p className="mb-2">In compliance with the IT Rules, the details of the Grievance Officer are:</p>
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-md">
                                <p><strong>Name:</strong> Mr. Amit Sharma</p>
                                <p><strong>Designation:</strong> Grievance Redressal Officer</p>
                                <p><strong>Email:</strong> <a href="mailto:support@MindRadix.in" className="text-indigo-600 hover:underline">support@MindRadix.in</a></p>
                                <p><strong>Address:</strong> Meadow Edutech Pvt Ltd, Office No. 123, 1st Floor, Tech Park, Jaipur, Rajasthan, India - 302001</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Contact Us</h2>
                            <p className="mb-1"><strong>Meadow Edutech Private Limited</strong></p>
                            <p><strong>Email:</strong> <a href="mailto:support@MindRadix.in" className="text-indigo-600 hover:underline">support@MindRadix.in</a></p>
                        </section>

                        <div className="pt-6 border-t border-slate-200 dark:border-slate-700 mt-8">
                            <p className="text-sm">
                                By using MindRadix, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
