"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Search, Check, AlertCircle, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJSON, postJSON, putJSON, deleteJSON } from "@/lib/api"; // Assuming these helpers exist
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminPaymentsPage() {
    const [stats, setStats] = useState<any>(null);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900">Payments & Subscriptions</h1>

            <FinancialStats />

            <Tabs defaultValue="plans" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
                    <TabsTrigger value="receipts">Payment Receipts</TabsTrigger>
                </TabsList>

                <TabsContent value="plans">
                    <PlansManager />
                </TabsContent>

                <TabsContent value="receipts">
                    <ReceiptsLog />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function FinancialStats() {
    const [data, setData] = useState({ totalRevenue: 0, successfulTransactions: 0, failedTransactions: 0 });

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        getJSON('/admin/financials', token || undefined).then((res: any) => {
            if (res?.status === 'success') setData(res.data);
        }).catch(console.error);
    }, []);

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{data.totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">From last 100 transactions</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Successful Transactions</CardTitle>
                    <Check className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.successfulTransactions}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Failed Transactions</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{data.failedTransactions}</div>
                </CardContent>
            </Card>
        </div>
    );
}

function PlansManager() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("adminToken");
            const res: any = await getJSON('/admin/plans', token || undefined);
            if (res?.status === 'success') {
                setPlans(res.data.plans);
            }
        } catch (err) {
            toast.error("Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleDelete = async (planId: string) => {
        if (!confirm("Are you sure you want to delete this plan?")) return;
        try {
            const token = localStorage.getItem("adminToken");
            await deleteJSON(`/admin/plans/${planId}`, token || undefined);
            toast.success("Plan deleted");
            fetchPlans();
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    const handleEdit = (plan: any) => {
        setCurrentPlan(plan);
        setIsEditing(true);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setCurrentPlan({
            name: '',
            price_monthly: 0,
            price_yearly: 0,
            description: '',
            features: [],
            type: 'reader'
        });
        setIsEditing(false);
        setModalOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manage Plans</CardTitle>
                    <CardDescription>Create and edit subscription packages available to users.</CardDescription>
                </div>
                <Button onClick={handleCreate} className="bg-indigo-600"><Plus className="mr-2 h-4 w-4" /> Add Plan</Button>
            </CardHeader>
            <CardContent>
                {loading ? <div className="p-4 text-center">Loading...</div> : (
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-4 font-medium">Name</th>
                                    <th className="p-4 font-medium">Price (Mo/Yr)</th>
                                    <th className="p-4 font-medium">Type</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map((plan) => (
                                    <tr key={plan.id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="p-4 font-medium">{plan.name}</td>
                                        <td className="p-4">₹{plan.price_monthly} / ₹{plan.price_yearly}</td>
                                        <td className="p-4 capitalize">{plan.type}</td>
                                        <td className="p-4 text-right space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)}><Edit className="h-4 w-4 text-slate-500" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                        </td>
                                    </tr>
                                ))}
                                {plans.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No plans found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>

            <PlanModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                plan={currentPlan}
                isEditing={isEditing}
                onSuccess={() => { setModalOpen(false); fetchPlans(); }}
            />
        </Card>
    );
}

function PlanModal({ open, onOpenChange, plan, isEditing, onSuccess }: any) {
    const [formData, setFormData] = useState<any>({});
    const [featuresText, setFeaturesText] = useState("");

    useEffect(() => {
        if (plan) {
            setFormData(plan);
            setFeaturesText(Array.isArray(plan.features) ? plan.features.join('\n') : '');
        }
    }, [plan]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            features: featuresText.split('\n').filter(f => f.trim() !== '')
        };

        try {
            const token = localStorage.getItem("adminToken");
            if (isEditing) {
                await putJSON(`/admin/plans/${plan.id}`, payload, token || undefined);
                toast.success("Plan updated");
            } else {
                await postJSON('/admin/plans', payload, token || undefined);
                toast.success("Plan created");
            }
            onSuccess();
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Plan" : "Create New Plan"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Modify the details of the existing subscription plan." : "Define the details for the new subscription plan."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Plan Name</Label>
                        <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price_monthly">Monthly Price (₹)</Label>
                            <Input id="price_monthly" name="price_monthly" type="number" value={formData.price_monthly || 0} onChange={handleChange} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="price_yearly">Yearly Price (₹)</Label>
                            <Input id="price_yearly" name="price_yearly" type="number" value={formData.price_yearly || 0} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Type</Label>
                        <select id="type" name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={formData.type || 'reader'} onChange={handleChange}>
                            <option value="reader">Reader Subscription</option>
                            <option value="author">Author Plan</option>
                            <option value="submission">Submission Fee</option>
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="features">Features (One per line)</Label>
                        <Textarea id="features" rows={5} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="• Access to all content&#10;• Monthly newsletter" />
                    </div>
                    <DialogFooter>
                        <Button type="submit">{isEditing ? "Save Changes" : "Create Plan"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ReceiptsLog() {
    const [receipts, setReceipts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        getJSON('/admin/receipts?limit=50', token || undefined).then((res: any) => {
            if (res?.status === 'success') setReceipts(res.data.receipts);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Payment Receipts</CardTitle>
                <CardDescription>View all recent transactions including failed attempts.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <div className="p-4 text-center">Loading...</div> : (
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-4 font-medium">Date</th>
                                    <th className="p-4 font-medium">Order ID</th>
                                    <th className="p-4 font-medium">User</th>
                                    <th className="p-4 font-medium">Amount</th>
                                    <th className="p-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receipts.map((r) => (
                                    <tr key={r.id} className="border-b last:border-0">
                                        <td className="p-4 text-slate-500">{r.created_at ? format(new Date(r.created_at._seconds ? r.created_at._seconds * 1000 : r.created_at), 'dd MMM yyyy, HH:mm') : '-'}</td>
                                        <td className="p-4 font-mono text-xs">{r.id}</td>
                                        <td className="p-4">
                                            <div className="font-medium">{r.firstname}</div>
                                            <div className="text-xs text-slate-500">{r.email}</div>
                                        </td>
                                        <td className="p-4">₹{r.amount}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.status === 'success' || r.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                r.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {r.status?.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {receipts.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No receipts found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
