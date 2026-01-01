"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Check, Upload, ArrowRight, BookOpen, User, PenTool, Globe, Briefcase, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ROLES = [
    "Editor-in-Chief",
    "Editor",
    "Content Manager",
    "Senior Reviewer",
    "Reviewer"
];

const DOMAINS = [
    "Agriculture & Allied Sciences",
    "Life Sciences",
    "Technology / AI / Computer Science",
    "Social Sciences",
    "Arts & Humanities",
    "Education",
    "Management"
];

const LANGUAGES = [
    "English", "Hindi", "Bengali", "Marathi", "Tamil", "Telugu", "Gujarati", "Urdu"
];

export default function EditorialApplicationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        mobile: "",
        country: "",
        state: "",
        city: "",
        role: "",
        highestQualification: "",
        currentAffiliation: "",
        currentDesignation: "",
        totalExperience: "",
        hasEditorialExperience: "No",
        publicationsCount: "",
        orcid: "",
        googleScholar: "",
        majorPublications: "",
        statementOfInterest: "",
        availability: "",
        willingToReview: "Yes",
        agreeToEthics: false,
        confirmTruth: false,
        agreePolicies: false,
        understandSelection: false,
        acknowledgeHonorary: false
    });

    const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
    const [otherDomain, setOtherDomain] = useState("");
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [otherLanguage, setOtherLanguage] = useState("");
    const [areasOfExperience, setAreasOfExperience] = useState<string[]>([]);
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            // handled separately for consent checkboxes logic if needed, but here simple booleans in state
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const toggleSelection = (list: string[], setList: (L: string[]) => void, item: string) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!resumeFile) {
            toast.error("Please upload your Resume/CV");
            return;
        }
        if (!formData.role) {
            toast.error("Please select a role");
            return;
        }
        if (!formData.agreeToEthics || !formData.confirmTruth || !formData.agreePolicies) {
            toast.error("Please accept all mandatory declarations");
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();
            // Append text fields
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, String(value));
            });

            // Append arrays
            const finalDomains = [...selectedDomains];
            if (otherDomain) finalDomains.push(otherDomain);
            data.append("subjectExpertise", JSON.stringify(finalDomains));

            const finalLanguages = [...selectedLanguages];
            if (otherLanguage) finalLanguages.push(otherLanguage);
            data.append("languages", JSON.stringify(finalLanguages));

            data.append("areasOfExperience", JSON.stringify(areasOfExperience));

            // Append file
            data.append("resume", resumeFile);

            // API Call
            // Note: Do NOT set Content-Type header manually for FormData.
            // We use fetch directly here to avoid api.ts helper setting 'application/json'
            // Retrieve token if needed? Application usually public.
            // Assuming public endpoint.

            const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://us-central1-readmint-fe3c3.cloudfunctions.net/api/api";
            const res = await fetch(`${API_BASE}/editorial/apply`, {
                method: "POST",
                body: data
            });

            const result = await res.json();

            if (res.ok && result.status === 'success') {
                setSubmitted(true);
                toast.success("Application Submitted Successfully!");
                window.scrollTo(0, 0);
            } else {
                toast.error(result.message || "Submission failed");
            }

        } catch (error) {
            console.error("Application error:", error);
            toast.error("Failed to submit application. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">Thank You!</h2>
                    <div className="space-y-4 text-slate-600">
                        <p>
                            Thank you for applying to the <strong>MindRadiX Editorial Board</strong>.
                        </p>
                        <p>
                            Our editorial committee will review your application, and shortlisted candidates will be contacted via email.
                        </p>
                    </div>
                    <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2 justify-center"><Check size={14} /> Appointment Letter</div>
                        <div className="flex items-center gap-2 justify-center"><Check size={14} /> Editorial Certificate</div>
                        <div className="flex items-center gap-2 justify-center"><Check size={14} /> Profile Listing</div>
                    </div>
                    <Button onClick={() => router.push("/")} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6">
                        Return to Home
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Join Our Editorial Board</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        MindRadiX invites academicians, professionals, and subject & language experts to ensure quality and multilingual excellence.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-indigo-600 font-medium bg-indigo-50 py-3 px-6 rounded-full inline-block">
                        <span>Academicians</span> • <span>Professionals</span> • <span>Subject Experts</span> • <span>Language Editors</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                    {/* 1. Personal Info */}
                    <Section title="1. Personal Information" icon={User}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputWrapper label="Full Name *">
                                <Input name="fullName" value={formData.fullName} onChange={handleInputChange} required placeholder="Dr. John Doe" />
                            </InputWrapper>
                            <InputWrapper label="Email Address *">
                                <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="email@university.edu" />
                            </InputWrapper>
                            <InputWrapper label="Mobile / WhatsApp *">
                                <Input name="mobile" value={formData.mobile} onChange={handleInputChange} required placeholder="+91 98765 43210" />
                            </InputWrapper>
                            <InputWrapper label="Country *">
                                <Input name="country" value={formData.country} onChange={handleInputChange} required />
                            </InputWrapper>
                            <InputWrapper label="State *">
                                <Input name="state" value={formData.state} onChange={handleInputChange} required />
                            </InputWrapper>
                            <InputWrapper label="City *">
                                <Input name="city" value={formData.city} onChange={handleInputChange} required />
                            </InputWrapper>
                        </div>
                    </Section>

                    {/* 2. Role */}
                    <Section title="2. Role Applied For" icon={Briefcase}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ROLES.map(role => (
                                <label key={role} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.role === role ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}>
                                    <input type="radio" name="role" value={role} checked={formData.role === role} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                                    <span className="font-medium text-slate-700">{role}</span>
                                </label>
                            ))}
                        </div>
                    </Section>

                    {/* 3. Subject Expertise */}
                    <Section title="3. Subject / Domain Expertise" icon={BookOpen}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {DOMAINS.map(domain => (
                                <CheckboxLabel key={domain} label={domain} checked={selectedDomains.includes(domain)} onChange={() => toggleSelection(selectedDomains, setSelectedDomains, domain)} />
                            ))}
                            <div className="sm:col-span-2 mt-2">
                                <Input placeholder="Other (Specify)" value={otherDomain} onChange={(e) => setOtherDomain(e.target.value)} />
                            </div>
                        </div>
                    </Section>

                    {/* 4. Language */}
                    <Section title="4. Language Proficiency" icon={Globe}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {LANGUAGES.map(lang => (
                                <CheckboxLabel key={lang} label={lang} checked={selectedLanguages.includes(lang)} onChange={() => toggleSelection(selectedLanguages, setSelectedLanguages, lang)} />
                            ))}
                            <div className="col-span-2">
                                <Input placeholder="Other (Specify)" value={otherLanguage} onChange={(e) => setOtherLanguage(e.target.value)} />
                            </div>
                        </div>
                    </Section>

                    {/* 5. Academic Background */}
                    <Section title="5. Academic / Professional Background" icon={GraduationCap}>
                        <div className="space-y-6">
                            <InputWrapper label="Highest Qualification *">
                                <select name="highestQualification" value={formData.highestQualification} onChange={handleInputChange} className="w-full p-2 border rounded-md" required>
                                    <option value="">Select Qualification</option>
                                    <option value="PhD">PhD</option>
                                    <option value="Post-Graduate">Post-Graduate (Masters)</option>
                                    <option value="Graduate">Graduate (Bachelors)</option>
                                    <option value="Professional Certification">Professional Certification</option>
                                    <option value="Other">Other</option>
                                </select>
                            </InputWrapper>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputWrapper label="Current Affiliation (University/Org)">
                                    <Input name="currentAffiliation" value={formData.currentAffiliation} onChange={handleInputChange} placeholder="Harvard University / Independent" />
                                </InputWrapper>
                                <InputWrapper label="Current Designation">
                                    <Input name="currentDesignation" value={formData.currentDesignation} onChange={handleInputChange} placeholder="Assistant Professor / Senior Editor" />
                                </InputWrapper>
                            </div>
                        </div>
                    </Section>

                    {/* 6. Experience */}
                    <Section title="6. Experience Details" icon={PenTool}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputWrapper label="Total Professional Experience (Years) *">
                                    <Input name="totalExperience" type="number" value={formData.totalExperience} onChange={handleInputChange} required />
                                </InputWrapper>
                                <InputWrapper label="Editorial / Review Experience">
                                    <div className="flex gap-4 mt-2">
                                        <label className="flex items-center gap-2"><input type="radio" name="hasEditorialExperience" value="Yes" checked={formData.hasEditorialExperience === 'Yes'} onChange={handleInputChange} /> Yes</label>
                                        <label className="flex items-center gap-2"><input type="radio" name="hasEditorialExperience" value="No" checked={formData.hasEditorialExperience === 'No'} onChange={handleInputChange} /> No</label>
                                    </div>
                                </InputWrapper>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">Areas of Experience</label>
                                <div className="flex flex-wrap gap-3">
                                    {['Editorial Work', 'Peer Review', 'Content Management', 'Language Editing', 'Research Publication'].map(area => (
                                        <CheckboxLabel key={area} label={area} checked={areasOfExperience.includes(area)} onChange={() => toggleSelection(areasOfExperience, setAreasOfExperience, area)} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* 7. Profile */}
                    <Section title="7. Professional Profile (Optional)" icon={User}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputWrapper label="Number of Research Papers Published">
                                <Input name="publicationsCount" type="number" value={formData.publicationsCount} onChange={handleInputChange} />
                            </InputWrapper>
                            <InputWrapper label="ORCID iD">
                                <Input name="orcid" value={formData.orcid} onChange={handleInputChange} placeholder="0000-0000-0000-0000" />
                            </InputWrapper>
                            <div className="md:col-span-2">
                                <InputWrapper label="Google Scholar / Research Profile Link">
                                    <Input name="googleScholar" value={formData.googleScholar} onChange={handleInputChange} placeholder="https://scholar.google.com/..." />
                                </InputWrapper>
                            </div>
                        </div>
                    </Section>

                    {/* 8. Resume Upload */}
                    <Section title="8. Resume / CV Upload *" icon={Upload}>
                        <div className="p-8 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 text-center hover:bg-white hover:border-indigo-400 transition-all cursor-pointer relative">
                            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <Upload className="mx-auto h-10 w-10 text-indigo-400 mb-2" />
                            <p className="text-indigo-900 font-medium">{resumeFile ? resumeFile.name : "Click to upload Resume/CV (PDF/DOCX)"}</p>
                            <p className="text-xs text-indigo-500 mt-1">Max 5 MB</p>
                        </div>
                    </Section>

                    {/* 9. Statement */}
                    <Section title="9. Statement of Interest *" icon={PenTool}>
                        <InputWrapper label="Why do you want to join MindRadiX? (300-500 words)">
                            <Textarea name="statementOfInterest" value={formData.statementOfInterest} onChange={handleInputChange} rows={6} required placeholder="Describe your motivation and expertise..." />
                        </InputWrapper>
                    </Section>

                    {/* 10. Availability */}
                    <Section title="10. Availability & Commitment" icon={Check}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputWrapper label="Approx. Availability (Hours/Month)">
                                <Input name="availability" type="number" value={formData.availability} onChange={handleInputChange} />
                            </InputWrapper>
                            <InputWrapper label="Willing to review/manage content periodically?">
                                <select name="willingToReview" value={formData.willingToReview} onChange={handleInputChange} className="w-full p-2 border rounded-md">
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </InputWrapper>
                        </div>
                    </Section>

                    {/* 11. Declaration */}
                    <Section title="11. Declaration & Consent *" icon={Check} last>
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                            <label className="flex items-start gap-3 p-3 cursor-pointer">
                                <input type="checkbox" checked={formData.confirmTruth} onChange={(e) => setFormData({ ...formData, confirmTruth: !formData.confirmTruth })} className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 flex-shrink-0" />
                                <span className="text-sm text-slate-700">I confirm that the information provided is true and accurate.</span>
                            </label>
                            <label className="flex items-start gap-3 p-3 cursor-pointer">
                                <input type="checkbox" checked={formData.agreePolicies} onChange={(e) => setFormData({ ...formData, agreePolicies: !formData.agreePolicies })} className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 flex-shrink-0" />
                                <span className="text-sm text-slate-700">I agree to follow MindRadiX’s editorial policies and ethics standards.</span>
                            </label>
                            <label className="flex items-start gap-3 p-3 cursor-pointer">
                                <input type="checkbox" checked={formData.understandSelection} onChange={(e) => setFormData({ ...formData, understandSelection: !formData.understandSelection })} className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 flex-shrink-0" />
                                <span className="text-sm text-slate-700">I understand that selection is subject to internal review.</span>
                            </label>
                            <label className="flex items-start gap-3 p-3 cursor-pointer">
                                <input type="checkbox" checked={formData.acknowledgeHonorary} onChange={(e) => setFormData({ ...formData, acknowledgeHonorary: !formData.acknowledgeHonorary })} className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 flex-shrink-0" />
                                <span className="text-sm text-slate-700">I acknowledge that this is an honorary position.</span>
                            </label>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <input type="checkbox" checked={formData.agreeToEthics} onChange={() => setFormData({ ...formData, agreeToEthics: !formData.agreeToEthics })} required className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                            <span className="font-bold text-slate-800">I agree to the mandatory editorial ethics & guidelines.</span>
                        </div>
                    </Section>


                    {/* Footer */}
                    <div className="p-8 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-sm text-slate-500">
                            <p>✔ Appointment Letter & Certificate on selection</p>
                            <p>Selection subject to internal review.</p>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 px-10 text-lg rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3">
                            {loading ? "Submitting Application..." : (
                                <>Apply Now <ArrowRight /></>
                            )}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
}

function Section({ title, icon: Icon, children, last }: any) {
    return (
        <div className={`p-6 md:p-8 ${!last ? 'border-b border-slate-100' : ''}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 p-2 rounded-lg">
                    <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function InputWrapper({ label, children }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">{label}</label>
            {children}
        </div>
    );
}

function CheckboxLabel({ label, checked, onChange, isInput }: any) {
    return (
        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
            {isInput ? (
                // If using actual event
                <input type="checkbox" checked={checked} onChange={onChange} className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 flex-shrink-0" />
            ) : (
                // If using toggle function
                <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                    {checked && <Check size={12} className="text-white" />}
                </div>
            )}
            <span className="text-sm text-slate-700 leading-snug select-none" onClick={!isInput ? onChange : undefined}>{label}</span>
        </label>
    );
}
