import React from 'react';

export const metadata = {
    title: "Refund & Cancellation Policy - MindRadix",
    description: "MindRadix Refund & Cancellation Policy - Terms for refunds on subscriptions and services.",
};

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 md:p-12">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">MindRadix â€“ Refund & Cancellation Policy</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Last Updated: 23â€‘12â€‘2025</p>

                <div className="space-y-8 text-slate-700 dark:text-slate-300">
                    <p>
                        This Refund & Cancellation Policy outlines the terms under which refunds are processed by Meadow Edutech Private Limited (â€œCompanyâ€, â€œMindRadixâ€, â€œWeâ€, â€œUsâ€). By making a payment on the MindRadix platform as a Reader, Author, or Institutional Client, you agree to the terms mentioned herein.
                    </p>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">1. General Principles</h2>
                        <p>
                            MindRadix provides technology-enabled digital publication, editorial services, institutional infrastructure, and physical printed products. Since these services involve immediate resource allocation (Editorial review), third-party technology costs (Plagiarism screening), and logistics/printing costs, most fees paid to MindRadix are non-refundable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">2. Service-Specific Refund Terms</h2>

                        <div className="ml-4 space-y-4">
                            <div>
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">2.1. For Readers (Digital Subscriptions & E-Magazines)</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Single Issue Purchases:</strong> Access to digital magazines/articles is granted immediately upon payment. All single-issue digital purchases are non-refundable.</li>
                                    <li><strong>Subscription Plans:</strong> Users may cancel their monthly or annual subscriptions at any time. No pro-rata refunds will be provided for the remaining period of the current billing cycle.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">2.2. For Authors (Manuscript Processing & APC)</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Processing & Plagiarism Fees:</strong> Once a manuscript is submitted and the screening process has started, this fee is 100% non-refundable, regardless of acceptance or rejection.</li>
                                    <li><strong>Publication Fees (APC):</strong>
                                        <ul className="list-circle pl-5 mt-1 space-y-1">
                                            <li>If an author withdraws their article after payment but before the final layout/formatting work has begun, a 50% refund may be considered.</li>
                                            <li>Once the article is digitally published or assigned an ISSN, no refund requests will be entertained.</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">2.3. For Institutional Clients (Universities, Colleges & NGOs)</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Dashboard & Setup Fees:</strong> Non-refundable once the dashboard is activated or credentials are provided.</li>
                                    <li><strong>Bulk Publishing/Conferences:</strong>
                                        <ul className="list-circle pl-5 mt-1 space-y-1">
                                            <li>If cancelled 30 days prior to the event, a 25% cancellation fee applies.</li>
                                            <li>No refunds if cancelled within 30 days or after editorial work has commenced.</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">2.4. For Physical Books & Magazines (New)</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Cancellation Window:</strong> Orders for physical products can be cancelled for a full refund only within 24 hours of placing the order.</li>
                                    <li><strong>Post-Packing/Dispatch Rule:</strong> No cancellation or refund will be issued if the 24-hour window has passed OR if the parcel has been packed, a delivery partner has been assigned, or the order has been dispatched.</li>
                                    <li><strong>Wrong Product Claims:</strong> A refund or replacement is only applicable if the wrong product is delivered (e.g., a different book/issue than ordered).</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">3. Eligibility for Refund (Exceptions)</h2>
                        <p className="mb-2">A refund may be processed only under the following specific circumstances:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Duplicate Payments:</strong> 100% refund for accidental duplicate transactions reported within 7 days.</li>
                            <li><strong>Service Failure:</strong> If MindRadix is unable to provide the agreed-upon digital service due to a permanent platform failure.</li>
                            <li><strong>Accidental Payment (Digital):</strong> If a refund is requested within 24 hours and no content has been accessed/submitted.</li>
                            <li><strong>Validated Wrong Delivery:</strong> If the wrong physical product is delivered and verified through the mandatory proof process (See Section 5).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">4. Non-Refundable Scenarios</h2>
                        <p className="mb-2">No refunds will be issued in the following cases:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Editorial Rejection:</strong> Based on quality, ethics, or plagiarism.</li>
                            <li><strong>Change of Mind:</strong> For physical orders after dispatch or after the 24-hour window.</li>
                            <li><strong>Insufficient Proof:</strong> If the user fails to provide a mandatory unboxing video for a &quot;Wrong Product&quot; claim.</li>
                            <li><strong>Delivery Failure:</strong> If the parcel is not delivered due to an incorrect/incomplete address provided by the user.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">5. Refund Process & Mandatory Proof</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>How to Apply:</strong> Email <a href="mailto:support@MindRadix.in" className="text-indigo-600 hover:underline">support@MindRadix.in</a> with the subject: &quot;Refund Request â€“ [Transaction ID]&quot;.</li>
                            <li><strong>Mandatory Documentation for Physical Products:</strong> To claim a refund/replacement for a wrong product, you MUST provide:
                                <ul className="list-circle pl-5 mt-1 space-y-1">
                                    <li>A complete Unboxing Video (from start to finish, showing the shipping label clearly).</li>
                                    <li>Clear photographs of the product received.</li>
                                    <li>Order confirmation details for comparison.</li>
                                </ul>
                            </li>
                            <li><strong>Evaluation:</strong> Our team will review the request and evidence within 5-7 working days.</li>
                            <li><strong>Credit:</strong> Approved refunds will be credited back to the original payment source within 7-10 working days.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">6. Cancellation Policy</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Authors/Readers:</strong> Can cancel submissions/subscriptions via their dashboard; fees remain subject to Section 2.</li>
                            <li><strong>Physical Orders:</strong> Cancellation is strictly permitted only within the 24-hour window as defined in Section 2.4.</li>
                            <li><strong>Institutions:</strong> Cancellation of bulk agreements is subject to the specific SLA signed or this policy.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">7. Contact Information</h2>
                        <p className="mb-2">For any queries related to payments, cancellations, or refunds:</p>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                            <p><strong>Meadow Edutech Private Limited</strong></p>
                            <p><strong>Email:</strong> <a href="mailto:support@MindRadix.in" className="text-indigo-600 hover:underline">support@MindRadix.in</a></p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}

