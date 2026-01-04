"use client";

import { useState, useEffect } from "react";
import { getJSON, postJSON, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, FileText, Calendar, User, Download, CheckCircle, XCircle, Clock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function EditorialApplicationsPage() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionApp, setActionApp] = useState<any>(null); // The app being acted upon
    const [actionType, setActionType] = useState<string | null>(null); // 'interview', 'approved', 'rejected'
    const [processing, setProcessing] = useState(false);

    // Form states
    const [rejectReason, setRejectReason] = useState("");
    const [interviewData, setInterviewData] = useState({ date: "", time: "", link: "" });

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            const response = await getJSON("/editorial/applications", token || undefined);

            if (response.status === "success") {
                setApplications(response.data);
            } else {
                toast.error("Failed to load applications");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error loading applications");
        } finally {
            setLoading(false);
        }
    };

    const handleActionSearch = (app: any, type: string) => {
        setActionApp(app);
        setActionType(type);
        setRejectReason("");
        setInterviewData({ date: "", time: "", link: "" });
    };

    const submitAction = async () => {
        if (!actionApp || !actionType) return;
        setProcessing(true);

        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const payload = {
                applicationId: actionApp.id,
                status: actionType,
                reason: actionType === 'rejected' ? rejectReason : undefined,
                interviewDate: actionType === 'interview' ? interviewData.date : undefined,
                interviewTime: actionType === 'interview' ? interviewData.time : undefined,
                interviewLink: actionType === 'interview' ? interviewData.link : undefined
            };

            const response = await postJSON("/admin/editorial/applications/update-status", payload, token);

            if (response.status === "success") {
                toast.success(response.message);
                // Update local state
                setApplications(prev => prev.map(a => a.id === actionApp.id ? { ...a, status: actionType } : a));
                setActionApp(null);
                setActionType(null);
            } else {
                toast.error(response.message || "Action failed");
            }
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Failed to update status");
        } finally {
            setProcessing(false);
        }
    };

    const getDownloadLink = (path: string | null) => {
        if (!path) return "#";
        // Explicitly attach token as query param for the proxy endpoint
        const token = typeof window !== 'undefined' ? localStorage.getItem("adminToken") : "";
        // Route is defined in admin.routes.ts, which is mounted at /api/admin
        // API_BASE usually ends with /api. If API_BASE is .../api/api, and route is /admin/..., 
        // we can try using "admin/..." relative to API_BASE?
        // Wait, getJSON("/editorial/applications") worked. 
        // getJSON in lib/api uses `${API_BASE}${endpoint}`.
        // If getJSON("/editorial/applications") worked, and that route is in editorial.controller...
        // Wait. `submitApplication` is `/api/editorial/apply`.
        // `getApplications` is `/api/editorial/applications`.
        // These are in `editorial.routes.ts`.
        // BUT my new `downloadResume` is in `admin.routes.ts`.
        // So `editorialRoutes` (mounted at /api/editorial) vs `adminRoutes` (mounted at /api/admin).
        // I should have put `downloadResume` in `editorial.routes.ts` or make the frontend use `/admin/editorial/download-resume`.
        // Since I put it in `admin.routes.ts`, I must use `${API_BASE}/admin/editorial/download-resume`.

        return `${API_BASE}/admin/editorial/download-resume?path=${encodeURIComponent(path)}&token=${token}`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium"><CheckCircle size={12} /> Approved</span>;
            case 'rejected': return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium"><XCircle size={12} /> Rejected</span>;
            case 'interview': return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium"><Video size={12} /> Interview</span>;
            default: return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium"><Clock size={12} /> Pending</span>;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Editorial Applications</h1>
                <p className="text-muted-foreground">Review incoming applications for the Editorial Board.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : applications.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed text-slate-500">
                    <User className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No applications received yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {applications.map((app: any) => (
                        <div key={app.id} className="bg-white dark:bg-slate-900 border rounded-lg p-6 shadow-sm flex flex-col xl:flex-row gap-6">
                            <div className="flex-1 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{app.fullName}</h3>
                                            {getStatusBadge(app.status)}
                                        </div>
                                        <p className="text-sm text-indigo-600 font-medium">{app.role}</p>
                                    </div>
                                    <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        <Calendar size={12} /> {new Date(app.submitted_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Email:</span> {app.email}</p>
                                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Mobile:</span> {app.mobile}</p>
                                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Country:</span> {app.country}</p>
                                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Affiliation:</span> {app.currentAffiliation || "-"}</p>
                                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Designation:</span> {app.currentDesignation || "-"}</p>
                                </div>

                                {/* Statement Preview */}
                                {app.statementOfInterest && (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md text-xs text-slate-600 italic border border-slate-100">
                                        "{app.statementOfInterest.substring(0, 150)}..."
                                    </div>
                                )}

                                <div className="flex gap-4 pt-2">
                                    {app.linkedin && (
                                        <a href={app.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">LinkedIn Profile</a>
                                    )}
                                    {app.googleScholar && (
                                        <a href={app.googleScholar} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Google Scholar</a>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 justify-center min-w-[200px] border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-800 pt-4 xl:pt-0 xl:pl-6">
                                {/* Resume Button */}
                                {app.resume_path || app.resume_url ? (
                                    <a href={getDownloadLink(app.resume_path || app.resume_url)} target="_blank" rel="noopener noreferrer" className="w-full">
                                        <Button variant="outline" className="w-full gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                            <Download size={16} /> Download Resume
                                        </Button>
                                    </a>
                                ) : (
                                    <Button variant="outline" disabled className="w-full gap-2 opacity-50">
                                        <FileText size={16} /> No Resume
                                    </Button>
                                )}

                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2">
                                    <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                                        onClick={() => handleActionSearch(app, 'interview')}>
                                        <Video size={14} className="mr-2" /> Call for Interview
                                    </Button>
                                    <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white w-full"
                                        onClick={() => handleActionSearch(app, 'approved')}>
                                        <CheckCircle size={14} className="mr-2" /> Approve Application
                                    </Button>
                                    <Button size="sm" variant="destructive" className="w-full"
                                        onClick={() => handleActionSearch(app, 'rejected')}>
                                        <XCircle size={14} className="mr-2" /> Reject Application
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Dialog */}
            <Dialog open={!!actionApp} onOpenChange={(open) => !open && setActionApp(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'interview' && 'Schedule Interview'}
                            {actionType === 'approved' && 'Approve Application'}
                            {actionType === 'rejected' && 'Reject Application'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'interview' && `Send an interview invitation to ${actionApp?.fullName}.`}
                            {actionType === 'approved' && `Confirm approval for ${actionApp?.fullName}. This will send an acceptance email.`}
                            {actionType === 'rejected' && `Provide feedback for rejection. A polite email will be sent to ${actionApp?.fullName}.`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        {actionType === 'interview' && (
                            <>
                                <div className="grid gap-2">
                                    <Label>Interview Date</Label>
                                    <Input type="date" value={interviewData.date} onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Interview Time</Label>
                                    <Input type="time" value={interviewData.time} onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Meeting Link</Label>
                                    <Input placeholder="https://meet.google.com/..." value={interviewData.link} onChange={(e) => setInterviewData({ ...interviewData, link: e.target.value })} />
                                </div>
                            </>
                        )}

                        {actionType === 'rejected' && (
                            <div className="grid gap-2">
                                <Label>Reason / Feedback (Included in Email)</Label>
                                <Textarea
                                    placeholder="We have decided to proceed with other candidates because..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={4}
                                />
                                <p className="text-xs text-slate-500">Use a positive and encouraging tone.</p>
                            </div>
                        )}

                        {actionType === 'approved' && (
                            <p className="text-sm text-green-700 bg-green-50 p-3 rounded">
                                Are you sure you want to approve this candidate? An official welcome email will be sent immediately.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionApp(null)}>Cancel</Button>
                        <Button
                            onClick={submitAction}
                            disabled={processing}
                            className={actionType === 'rejected' ? "bg-red-600 hover:bg-red-700" : (actionType === 'approved' ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700")}
                        >
                            {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirm & Send Email
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
