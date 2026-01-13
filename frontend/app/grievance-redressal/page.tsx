import React from 'react';

export const metadata = {
    title: "Grievance Redressal Policy - MindRadix",
    description: "MindRadix Grievance Redressal Mechanism.",
};

export default function GrievanceRedressalPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 md:p-12">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">MindRadix – Grievance Redressal Policy</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 italic">Last Updated: 23‑12‑2025</p>

                <div className="space-y-8 text-slate-700 dark:text-slate-300">
                    <p>
                        MindRadix (owned by Meadow Edutech Private Limited) is committed to providing a transparent and accountable environment for all its users. In accordance with the Information Technology Act, 2000, the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the Digital Personal Data Protection (DPDP) Act, 2023, we have established this Grievance Redressal Mechanism.
                    </p>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">1. Objective</h2>
                        <p>
                            The purpose of this policy is to ensure that all complaints or grievances related to content, privacy, technical issues, or payments are addressed in a time-bound and efficient manner.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">2. Designated Grievance Officer</h2>
                        <p className="mb-2">We have appointed a Grievance Officer to oversee and resolve user concerns. Any user, author, or third party can reach out to the officer using the details below:</p>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                            <p><strong>Name of the Officer:</strong> Mr. Amit Sharma</p>
                            <p><strong>Designation:</strong> Grievance Redressal Officer</p>
                            <p><strong>Company:</strong> Meadow Edutech Private Limited (MindRadix)</p>
                            <p><strong>Email Address:</strong> <a href="mailto:info.mindradix@gmail.com" className="text-indigo-600 hover:underline">info.mindradix@gmail.com</a></p>
                            <p><strong>Address:</strong> Meadow Edutech Pvt Ltd, Office No. 123, 1st Floor, Tech Park, Jaipur, Rajasthan, India - 302001</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">3. Types of Grievances</h2>
                        <p className="mb-2">You may file a grievance regarding:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Content Concerns:</strong> Plagiarism, defamatory content, or violation of intellectual property.</li>
                            <li><strong>Privacy & Data:</strong> Misuse of personal data or requests for data deletion/correction under the DPDP Act.</li>
                            <li><strong>Payment Issues:</strong> Duplicate transactions or refund-related disputes.</li>
                            <li><strong>Technical Issues:</strong> Account access problems or platform glitches.</li>
                            <li><strong>Ethics Violations:</strong> Concerns regarding publication ethics or peer-review misconduct.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">4. How to File a Grievance</h2>
                        <p className="mb-2">To ensure a quick resolution, please provide the following details when sending your complaint:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Subject Line:</strong> Must start with "Formal Grievance – [Reason]" (e.g., Formal Grievance – Copyright Issue).</li>
                            <li><strong>User Details:</strong> Full Name, Registered Email ID, and Contact Number.</li>
                            <li><strong>Description:</strong> A detailed explanation of the issue.</li>
                            <li><strong>Evidence:</strong> URLs of the specific page, screenshots, or payment receipts (if applicable).</li>
                            <li><strong>Request:</strong> Clear mention of the action you want MindRadix to take.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">5. Timelines for Resolution</h2>
                        <p className="mb-2">We follow a strict timeline to ensure fairness:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Acknowledgment:</strong> We will acknowledge the receipt of your grievance within 24 to 48 hours.</li>
                            <li><strong>Resolution:</strong> We aim to investigate and resolve the issue within 15 working days from the date of receipt.</li>
                            <li><strong>Extensions:</strong> In complex cases (such as legal investigations), we may take up to 30 days, and the user will be informed of the delay.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">6. Rights of the Company</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>MindRadix reserves the right to reject grievances that are frivolous, malicious, or lack sufficient evidence.</li>
                            <li>The final decision on content removal or account suspension rests with the Grievance Officer and the Editorial Board.</li>
                        </ul>
                    </section>

                </div>
            </div>
        </div>
    );
}
