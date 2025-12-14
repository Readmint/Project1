"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getJSON, postJSON } from "@/lib/api";
import { Save, Settings, Shield, Key } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";

export default function SystemSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>({});

    // Local state for form
    const [plagThresholdHigh, setPlagThresholdHigh] = useState("40");
    const [plagThresholdMedium, setPlagThresholdMedium] = useState("20");
    const [plagProvider, setPlagProvider] = useState("google-sr");
    const [apiKey, setApiKey] = useState("");
    const [publicationFee, setPublicationFee] = useState("0");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem("adminToken");
                if (!token) {
                    router.push("/admin/login");
                    return;
                }

                const res = await getJSON("/admin/settings", token);
                if (res.status === "success") {
                    setSettings(res.data);
                    // Hydrate form
                    if (res.data.plagiarism_threshold_high) setPlagThresholdHigh(res.data.plagiarism_threshold_high);
                    if (res.data.plagiarism_threshold_medium) setPlagThresholdMedium(res.data.plagiarism_threshold_medium);
                    if (res.data.plagiarism_provider) setPlagProvider(res.data.plagiarism_provider);
                    if (res.data.article_publication_fee) setPublicationFee(res.data.article_publication_fee);
                    // API Key is usually hidden, but allowed to overwrite
                } else {
                    if (res.status === 401 || res.status === 403) router.push("/admin/login");
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        const toastId = toast.loading("Saving settings...");
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const payload = {
                plagiarism_threshold_high: plagThresholdHigh,
                plagiarism_threshold_medium: plagThresholdMedium,
                plagiarism_provider: plagProvider,
                article_publication_fee: publicationFee,
                ...(apiKey ? { plagiarism_api_key: apiKey } : {}) // Only send if changed
            };

            const res = await postJSON("/admin/settings", { settings: payload }, token);
            if (res.status === "success") {
                toast.success("Settings saved successfully", { id: toastId });
            } else {
                toast.error(res.message, { id: toastId });
            }
        } catch (error) {
            toast.error("System error saving settings", { id: toastId });
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>
                    <p className="text-slate-500 text-sm mt-1">Configure global platform parameters.</p>
                </header>

                <div className="max-w-4xl space-y-6">

                    {/* Plagiarism Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="text-indigo-500" size={20} />
                                Plagiarism Detection Rules
                            </CardTitle>
                            <CardDescription>
                                Set thresholds for automatic flagging and provider settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">High Risk Threshold (%)</label>
                                    <Input
                                        type="number"
                                        value={plagThresholdHigh}
                                        onChange={(e) => setPlagThresholdHigh(e.target.value)}
                                        min="0" max="100"
                                    />
                                    <p className="text-xs text-slate-500">Submissions above this Score are auto-flagged as Critical.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Medium Risk Threshold (%)</label>
                                    <Input
                                        type="number"
                                        value={plagThresholdMedium}
                                        onChange={(e) => setPlagThresholdMedium(e.target.value)}
                                        min="0" max="100"
                                    />
                                    <p className="text-xs text-slate-500">Submissions above this Score are flagged for review.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Detection Provider</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-background text-sm"
                                    value={plagProvider}
                                    onChange={(e) => setPlagProvider(e.target.value)}
                                >
                                    <option value="google-sr">Google Search Results (Default)</option>
                                    <option value="copyscape">Copyscape Premium</option>
                                    <option value="turnitin">Turnitin (Enterprise)</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="text-emerald-500" size={20} />
                                Publication Finances
                            </CardTitle>
                            <CardDescription>
                                Set fees and payment thresholds.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Free Tier Article Publication Fee ($)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={publicationFee}
                                    onChange={(e) => setPublicationFee(e.target.value)}
                                />
                                <p className="text-xs text-slate-500">Amount charged to Free Tier authors to publish one article.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* API Keys */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="text-amber-500" size={20} />
                                API Keys & Secrets
                            </CardTitle>
                            <CardDescription>
                                Manage external service connections.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Plagiarism Service API Key</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••••••••••"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <p className="text-xs text-slate-500">Leave blank to keep existing key.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Save size={16} className="mr-2" /> Save Configuration
                        </Button>
                    </div>

                </div>
            </main>
        </div>
    );
}
