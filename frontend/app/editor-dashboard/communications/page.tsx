"use client";

import { useState, useEffect } from "react";
import { getJSON, postJSON } from "@/lib/api";
import { Mail, RefreshCw, Send, User } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EditorCommunicationsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [managers, setManagers] = useState<any[]>([]);

    // Form State
    const [selectedManager, setSelectedManager] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await getJSON("/editor/communications");
            if (res.status === "success") {
                setLogs(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch communications", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchManagers = async () => {
        try {
            const res = await getJSON("/editor/content-managers");
            if (res.status === 'success') {
                setManagers(res.data);
            }
        } catch (err) {
            console.error("Failed managers", err);
        }
    };

    useEffect(() => {
        fetchLogs();
        fetchManagers();
    }, []);

    const handleSend = async () => {
        if (!selectedManager || !message) {
            toast.error("Please select a recipient and enter a message.");
            return;
        }
        setSending(true);
        try {
            const res = await postJSON("/editor/send-message", {
                receiverId: selectedManager,
                subject,
                message
            });

            if (res.status === 'success') {
                toast.success("Message sent!");
                setMessage("");
                setSubject("");
                fetchLogs(); // refresh log
            } else {
                toast.error(res.message || "Failed to send");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error sending message");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-6 space-y-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto h-[calc(100vh-80px)]">

            {/* LEFT COLUMN: LOGS */}
            <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-semibold">Communications</h1>
                        <p className="text-slate-500 text-sm">
                            Message content managers and view system alerts.
                        </p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border rounded-lg hover:bg-slate-50"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No communication logs found.</div>
                    ) : (
                        <div className="divide-y relative">
                            {logs.map((log) => (
                                <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg shrink-0 ${log.type === 'message' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            <Mail size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-medium text-sm truncate pr-2">
                                                    {log.type === 'assignment' ? 'Assignment Notification' : 'Message'}
                                                </h4>
                                                <span className="text-xs text-slate-400 shrink-0">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 text-sm mb-2 whitespace-pre-wrap">{log.message}</p>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><User size={10} /> From: {log.sender_name || 'System'}</span>
                                                <span className="flex items-center gap-1"><User size={10} /> To: {log.receiver_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: SEND MESSAGE FORM */}
            <div className="space-y-6 h-full overflow-y-auto">
                <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm sticky top-0">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Send size={18} className="text-indigo-600" />
                        Send Message
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-500 uppercase">To: Content Manager</label>
                            <Select onValueChange={setSelectedManager} value={selectedManager}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Recipient..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {managers.map((u) => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.name} <span className="text-slate-400 text-xs">({u.role})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-500 uppercase">Subject</label>
                            <Input
                                placeholder="Subject..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-500 uppercase">Message</label>
                            <Textarea
                                placeholder="Type your message here..."
                                className="min-h-[150px]"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleSend} disabled={sending}>
                            {sending ? 'Sending...' : 'Send Message'}
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
}
