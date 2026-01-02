"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getJSON, postJSON, patchJSON, deleteJSON } from "@/lib/api";

// Types
type Plan = {
    id: string;
    name: string;
    description: string;
    price_amount: number;
    price_currency: string;
    features: string[];
    is_active: boolean;
};

type Enquiry = {
    id: string;
    name: string;
    email: string;
    company: string;
    message: string;
    plan_name?: string;
    status: 'pending' | 'reviewed' | 'contacted';
    created_at: string;
};

export default function AdminAdvertisementsPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    // const { toast } = useToast(); // Sonner uses global toast import

    // Plan Form State
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [planFormData, setPlanFormData] = useState<Partial<Plan>>({
        name: "",
        description: "",
        price_amount: 0,
        price_currency: "INR",
        features: [],
        is_active: true
    });
    const [featuresInput, setFeaturesInput] = useState("");

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('adminToken') || undefined;

        try {
            const [plansData, enquiriesData] = await Promise.all([
                getJSON("/advertisements/plans"), // Public (no token needed, or optional)
                getJSON("/advertisements/enquiries", token) // Explicitly pass adminToken
            ]);

            if (plansData.status === 'success') setPlans(plansData.data.plans);
            if (enquiriesData.status === 'success') setEnquiries(enquiriesData.data.enquiries);

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Plan Handlers ---

    const handleCreateOrUpdatePlan = async () => {
        try {
            const token = localStorage.getItem('adminToken') || undefined;
            // Headers are handled internally by postJSON/patchJSON when token is provided
            // const headers = {
            //     'Authorization': `Bearer ${token}`,
            //     'Content-Type': 'application/json'
            // };

            const payload = {
                ...planFormData,
                features: featuresInput.split('\n').filter(f => f.trim()),
                price_amount: Number(planFormData.price_amount)
            };

            let data;
            if (editingPlan) {
                data = await patchJSON(`/advertisements/plans/${editingPlan.id}`, payload, token);
            } else {
                data = await postJSON("/advertisements/plans", payload, token);
            }

            if (data && data.status === 'success') {
                toast.success("Success", { description: `Plan ${editingPlan ? 'updated' : 'created'}` });
                setIsPlanModalOpen(false);
                setEditingPlan(null);
                setPlanFormData({ name: "", description: "", price_amount: 0, price_currency: "INR", features: [], is_active: true });
                setFeaturesInput("");
                fetchData();
            } else {
                // Error handled by lib/api usually, but safe fallback
                toast.error("Error", { description: "Operation failed" });
            }

        } catch (error) {
            console.error("Error saving plan", error);
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm("Are you sure you want to delete this plan?")) return;
        try {
            const token = localStorage.getItem('adminToken') || undefined;
            await deleteJSON(`/advertisements/plans/${id}`, token);
            toast.success("Success", { description: "Plan deleted" });
            fetchData();
        } catch (error) {
            console.error("Error deleting plan", error);
        }
    };

    const openPlanModal = (plan?: Plan) => {
        if (plan) {
            setEditingPlan(plan);
            setPlanFormData(plan);
            setFeaturesInput(plan.features.join('\n'));
        } else {
            setEditingPlan(null);
            setPlanFormData({ name: "", description: "", price_amount: 0, price_currency: "INR", features: [], is_active: true });
            setFeaturesInput("");
        }
        setIsPlanModalOpen(true);
    };


    // --- Enquiry Handlers ---
    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('adminToken') || undefined;
            await patchJSON(`/advertisements/enquiries/${id}/status`, { status: newStatus }, token);
            toast.success("Updated", { description: "Enquiry status updated" });
            fetchData(); // Refresh to see update
        } catch (error) {
            console.error("Error updating status", error);
        }
    };


    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Advertisement Management</h1>
                <p className="text-muted-foreground">Manage pricing plans and review incoming enquiries.</p>
            </div>

            <Tabs defaultValue="plans" className="w-full">
                <TabsList>
                    <TabsTrigger value="plans">Pricing Plans</TabsTrigger>
                    <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
                </TabsList>

                {/* --- PLANS TAB --- */}
                <TabsContent value="plans" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Active Plans</h2>
                        <Button onClick={() => openPlanModal()}><Plus className="mr-2 h-4 w-4" /> Create Plan</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map(plan => (
                            <Card key={plan.id}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        {plan.name}
                                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                                            {plan.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold mb-4">{plan.price_currency} {plan.price_amount}</p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground mb-6">
                                        {plan.features.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}
                                        {plan.features.length > 3 && <li>+{plan.features.length - 3} more...</li>}
                                    </ul>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => openPlanModal(plan)}>
                                            <Edit className="h-4 w-4 mr-2" /> Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* --- ENQUIRIES TAB --- */}
                <TabsContent value="enquiries">
                    <Card>
                        <CardHeader>
                            <CardTitle>Incoming Enquiries</CardTitle>
                            <CardDescription>Review and track potential advertisement deals.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Name / Company</TableHead>
                                        <TableHead>Interest</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {enquiries.map((enq) => (
                                        <TableRow key={enq.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {new Date(enq.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{enq.name}</div>
                                                <div className="text-xs text-muted-foreground">{enq.company || enq.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                {enq.plan_name ? <Badge variant="outline">{enq.plan_name}</Badge> : "-"}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate" title={enq.message}>
                                                {enq.message}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        enq.status === 'contacted' ? 'default' :
                                                            enq.status === 'reviewed' ? 'secondary' : 'destructive'
                                                    }
                                                >
                                                    {enq.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {enq.status !== 'contacted' && (
                                                        <Button size="icon" variant="ghost" title="Mark Contacted" onClick={() => handleStatusChange(enq.id, 'contacted')}>
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                    )}
                                                    {enq.status === 'pending' && (
                                                        <Button size="icon" variant="ghost" title="Mark Reviewed" onClick={() => handleStatusChange(enq.id, 'reviewed')}>
                                                            <Clock className="h-4 w-4 text-yellow-600" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {enquiries.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No enquiries found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* CREATE/EDIT PLAN MODAL */}
            <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Plan Name</Label>
                            <Input id="name" value={planFormData.name} onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Description</Label>
                            <Input id="desc" value={planFormData.description} onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price Amount</Label>
                                <Input id="price" type="number" value={planFormData.price_amount} onChange={(e) => setPlanFormData({ ...planFormData, price_amount: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Input id="currency" value={planFormData.price_currency} onChange={(e) => setPlanFormData({ ...planFormData, price_currency: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="features">Features (One per line)</Label>
                            <Textarea
                                id="features"
                                rows={4}
                                value={featuresInput}
                                onChange={(e) => setFeaturesInput(e.target.value)}
                                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="active"
                                checked={planFormData.is_active}
                                onChange={(e) => setPlanFormData({ ...planFormData, is_active: e.target.checked })}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="active">Active (Visible to public)</Label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsPlanModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateOrUpdatePlan}>Save Plan</Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
