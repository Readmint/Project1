"use client";

import { useState, useEffect } from "react";
import { getJSON, postJSON, deleteJSON, API_BASE } from "@/lib/api"; // Assuming these helpers exist
import { toast } from "sonner";
import { Loader2, Trash2, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";

export default function EditorialBoardManagementPage() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        role: "Editor",
        affiliation: "",
        bio: "",
        color: "bg-indigo-100 text-indigo-700"
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            const res = await getJSON("/editorial/board");
            if (res.status === "success") {
                setMembers(res.data);
            }
        } catch (e) {
            toast.error("Failed to load board members");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;

        try {
            // Using correct delete endpoint
            const token = localStorage.getItem("adminToken");
            const res = await deleteJSON(`/editorial/board/${id}`, token || undefined);
            if (res.status === "success") {
                toast.success("Member removed");
                loadMembers();
            } else {
                toast.error("Failed to remove member");
            }
        } catch (e) {
            toast.error("Error removing member");
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Need FormData for file upload
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => data.append(key, value));
            if (imageFile) {
                data.append("image", imageFile);
            }

            // Using fetch directly for FormData if postJSON doesn't support it or force Content-Type
            // Assuming postJSON handles JSON, so using fetch for multipart
            const token = localStorage.getItem("adminToken") || ""; // Get admin token
            // Wait, project uses httpOnly cookies typically? Or localStorage 'token'?
            // In 'author-dashboard' it used localStorage 'token' or context.
            // Let's try standard fetch with Authorization header.

            // API_BASE is imported from @/lib/api

            const res = await fetch(`${API_BASE}/editorial/board`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: data
            });

            const result = await res.json();

            if (res.ok && result.status === "success") {
                toast.success("Board member added successfully");
                setModalOpen(false);
                setFormData({ name: "", role: "Editor", affiliation: "", bio: "", color: "bg-indigo-100 text-indigo-700" });
                setImageFile(null);
                loadMembers();
            } else {
                toast.error(result.message || "Failed to add member");
            }

        } catch (e) {
            console.error(e);
            toast.error("Error adding member");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Editorial Board</h1>
                    <p className="text-muted-foreground">Manage the public editorial board members.</p>
                </div>

                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                            <Plus size={18} /> Add Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Add Board Member</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddMember} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Dr. Jane Doe" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <Input required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="Editor-in-Chief" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Affiliation</label>
                                <Input value={formData.affiliation} onChange={e => setFormData({ ...formData, affiliation: e.target.value })} placeholder="University of X" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bio</label>
                                <Textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Brief biography..." rows={3} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Profile Image</label>
                                <Input type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} accept="image/*" />
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? <Loader2 className="animate-spin" /> : "Save Member"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map((member: any) => (
                        <div key={member.id} className="group relative bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(member.id)}>
                                    <Trash2 size={14} />
                                </Button>
                            </div>

                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-slate-50 relative">
                                    {member.image ? (
                                        <Image src={member.image} alt={member.name} fill className="object-cover" />
                                    ) : (
                                        <span className="text-xl font-bold text-slate-400">
                                            {member.name.charAt(0)}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 ${member.color || 'bg-slate-100 text-slate-600'}`}>
                                        {member.role}
                                    </span>
                                    <h3 className="font-bold text-lg">{member.name}</h3>
                                    <p className="text-xs text-indigo-600 font-medium h-8 line-clamp-2">{member.affiliation}</p>
                                </div>

                                <p className="text-sm text-slate-500 line-clamp-3">
                                    {member.bio}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
