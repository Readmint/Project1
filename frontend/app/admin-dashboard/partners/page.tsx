"use client";

import { useState, useEffect } from "react";
import {
    Building2,
    Plus,
    Search,
    MoreVertical,
    Mail,
    Calendar,
    ShieldCheck,
    X,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { getJSON, postJSON } from "@/lib/api";

export default function PartnerManagementPage() {
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        organization_name: "",
        type: "university",
        name: "", // Admin Name
        email: "", // Admin Email
        password: "" // Admin Password
    });

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const json: any = await getJSON("/partner/all");
            setPartners(json.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Error loading partners");
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePartner = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);

            await postJSON("/partner/create-partner", formData);

            toast.success("Partner organization created successfully");
            setIsCreateModalOpen(false);
            setFormData({
                organization_name: "",
                type: "university",
                name: "",
                email: "",
                password: ""
            });
            fetchPartners(); // Refresh list
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "Failed to create partner");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredPartners = partners.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.admin_email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Partner Management
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Manage partner organizations and their administrators
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                    <Plus size={18} /> Onboard Partner
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4 rounded-xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                        placeholder="Search partners by name or email..."
                        className="pl-9 bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </Card>

            {/* List */}
            {loading ? (
                <div className="text-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600 mb-4" />
                    <p className="text-slate-500">Loading partners...</p>
                </div>
            ) : filteredPartners.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No partners found</h3>
                    <p className="text-slate-500 mb-6">Get started by onboarding a new partner organization.</p>
                    <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">
                        Onboard First Partner
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPartners.map((partner) => (
                        <Card key={partner.id} className="group hover:shadow-md transition-all duration-300 border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Building2 size={24} />
                                    </div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                        {partner.type}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">
                                    {partner.name}
                                </h3>

                                <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                        <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{partner.admin_name || "Unknown Admin"}</p>
                                            <p className="text-xs text-slate-500">Organization Administrator</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                        <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                                        <span className="truncate">{partner.admin_email}</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                                        <span>Onboarded {new Date(partner.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Onboard New Partner</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleCreatePartner} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Organization Name</Label>
                            <Input
                                placeholder="e.g. Stanford University"
                                value={formData.organization_name}
                                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="university">University</option>
                                    <option value="publisher">Publisher</option>
                                    <option value="corporation">Corporation</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-2 border-t mt-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 block">Admin Credentials</Label>

                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label>Admin Full Name</Label>
                                    <Input
                                        placeholder="e.g. John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Admin Email</Label>
                                    <Input
                                        type="email"
                                        placeholder="admin@university.edu"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <Input
                                        type="text" // Visible as per requirement "provided by admin" (often easier to copy-paste initially) - or we can make it password type. Let's stick to text for easy copying.
                                        placeholder="Strong password..."
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                    <p className="text-[10px] text-slate-500">Share these credentials with the partner safely.</p>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-indigo-600 text-white" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Partner Account"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
