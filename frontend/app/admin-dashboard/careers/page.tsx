"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getJSON, postJSON, patchJSON, deleteJSON } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Plus, Users, Edit, Trash2, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- Types ---
interface JobRole {
    id: string;
    role: string;
    department: string;
    type: string;
    openings: number;
    experience: string;
    description: string;
    posted_at: string;
    status: 'active' | 'closed';
    icon: string;
}

interface Application {
    id: string;
    role_name: string;
    applicant_name: string;
    email: string;
    phone: string;
    resume_link: string;
    status: 'pending' | 'reviewed' | 'interviewing' | 'rejected' | 'hired';
    applied_at: string;
}

export default function AdminCareersPage() {
    const [roles, setRoles] = useState<JobRole[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<JobRole | null>(null);

    // Form State
    const [roleForm, setRoleForm] = useState({
        role: "",
        department: "",
        type: "Full-Time",
        openings: 1,
        experience: "",
        description: "",
        icon: "Briefcase"
    });

    const fetchAll = async () => {
        setLoading(true);
        // Explicitly get adminToken for these requests
        const token = localStorage.getItem('adminToken') || undefined;
        try {
            const [rolesRes, appsRes] = await Promise.all([
                getJSON("/careers/roles?all=true"), // Public endpoint, but ?all=true might filter if we enabled it, currently backend sends all active, need update if we want closed
                getJSON("/careers/applications", token) // Admin only
            ]);

            if (rolesRes.status === 'success') setRoles(rolesRes.data.roles);
            if (appsRes.status === 'success') setApplications(appsRes.data.applications);

        } catch (error) {
            console.error("Error fetching career data", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleSaveRole = async () => {
        const token = localStorage.getItem('adminToken') || undefined;
        try {
            if (editingRole) {
                await patchJSON(`/careers/roles/${editingRole.id}`, roleForm, token);
                toast.success("Job Role Updated");
            } else {
                await postJSON("/careers/roles", roleForm, token);
                toast.success("Job Role Created");
            }
            setIsRoleModalOpen(false);
            setEditingRole(null);
            setRoleForm({ role: "", department: "", type: "Full-Time", openings: 1, experience: "", description: "", icon: "Briefcase" });
            fetchAll();
        } catch (error) {
            toast.error("Operation Failed");
        }
    };

    const handleDeleteRole = async (id: string) => {
        if (!confirm("Are you sure? This will delete the role.")) return;
        const token = localStorage.getItem('adminToken') || undefined;
        try {
            await deleteJSON(`/careers/roles/${id}`, token);
            toast.success("Role Deleted");
            fetchAll();
        } catch (error) {
            toast.error("Delete Failed");
        }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        const token = localStorage.getItem('adminToken') || undefined;
        try {
            await patchJSON(`/careers/applications/${id}/status`, { status }, token);
            toast.success(`Status updated to ${status}`);
            fetchAll();
        } catch (error) {
            toast.error("Update Failed");
        }
    };

    const openEdit = (role: JobRole) => {
        setEditingRole(role);
        setRoleForm({
            role: role.role,
            department: role.department,
            type: role.type,
            openings: role.openings,
            experience: role.experience,
            description: role.description,
            icon: role.icon
        });
        setIsRoleModalOpen(true);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Career Management
                    </h1>
                    <p className="text-muted-foreground">Manage job openings and review applications</p>
                </div>
            </div>

            <Tabs defaultValue="roles" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="roles" className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Openings
                    </TabsTrigger>
                    <TabsTrigger value="applications" className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> Applications
                    </TabsTrigger>
                </TabsList>

                {/* --- ROLES TAB --- */}
                <TabsContent value="roles" className="space-y-4 pt-4">
                    <div className="flex justify-end">
                        <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => {
                                    setEditingRole(null);
                                    setRoleForm({ role: "", department: "", type: "Full-Time", openings: 1, experience: "", description: "", icon: "Briefcase" });
                                }}>
                                    <Plus className="mr-2 h-4 w-4" /> Post New Job
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>{editingRole ? "Edit Job Role" : "Post New Job Role"}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Role Title</Label>
                                            <Input value={roleForm.role} onChange={e => setRoleForm({ ...roleForm, role: e.target.value })} placeholder="e.g. Senior Editor" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Department</Label>
                                            <Input value={roleForm.department} onChange={e => setRoleForm({ ...roleForm, department: e.target.value })} placeholder="e.g. Editorial" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Select value={roleForm.type} onValueChange={v => setRoleForm({ ...roleForm, type: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Full-Time">Full-Time</SelectItem>
                                                    <SelectItem value="Part-Time">Part-Time</SelectItem>
                                                    <SelectItem value="Contract">Contract</SelectItem>
                                                    <SelectItem value="Remote">Remote</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Openings</Label>
                                            <Input type="number" min={1} value={roleForm.openings} onChange={e => setRoleForm({ ...roleForm, openings: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Experience Required</Label>
                                        <Input value={roleForm.experience} onChange={e => setRoleForm({ ...roleForm, experience: e.target.value })} placeholder="e.g. 3+ years" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea rows={5} value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} placeholder="Job duties and requirements..." />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
                                    <Button onClick={handleSaveRole} className="bg-indigo-600 text-white">Save Role</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800">
                                <TableRow>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Experience</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No active job roles found.</TableCell>
                                    </TableRow>
                                ) : (
                                    roles.map((role) => (
                                        <TableRow key={role.id}>
                                            <TableCell className="font-medium">{role.role}</TableCell>
                                            <TableCell>{role.department}</TableCell>
                                            <TableCell><Badge variant="outline">{role.type}</Badge></TableCell>
                                            <TableCell>{role.experience}</TableCell>
                                            <TableCell>
                                                <Badge className={role.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                                                    {role.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteRole(role.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* --- APPLICATIONS TAB --- */}
                <TabsContent value="applications" className="space-y-4 pt-4">
                    <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800">
                                <TableRow>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead>Job Role</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Applied Date</TableHead>
                                    <TableHead>Resume</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No applications received yet.</TableCell>
                                    </TableRow>
                                ) : (
                                    applications.map((app) => (
                                        <TableRow key={app.id}>
                                            <TableCell className="font-medium">{app.applicant_name}</TableCell>
                                            <TableCell>{app.role_name}</TableCell>
                                            <TableCell className="text-xs">
                                                <div className="font-medium">{app.email}</div>
                                                <div className="text-muted-foreground">{app.phone}</div>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {/* Robust Date Handling to avoid "Invalid Date" */}
                                                {app.applied_at && !isNaN(new Date(app.applied_at).getTime())
                                                    ? new Date(app.applied_at).toLocaleDateString()
                                                    : "Date unavailable"}
                                            </TableCell>
                                            <TableCell>
                                                <a href={app.resume_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm">
                                                    View Resume
                                                </a>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        app.status === 'hired' ? 'bg-green-100 text-green-700' :
                                                            app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                app.status === 'interviewing' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-yellow-100 text-yellow-700'
                                                    }
                                                >
                                                    {app.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Select defaultValue={app.status} onValueChange={(val) => handleStatusUpdate(app.id, val)}>
                                                    <SelectTrigger className="w-[130px] h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="reviewed">Reviewed</SelectItem>
                                                        <SelectItem value="interviewing">Interviewing</SelectItem>
                                                        <SelectItem value="hired">Hired</SelectItem>
                                                        <SelectItem value="rejected">Rejected</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
