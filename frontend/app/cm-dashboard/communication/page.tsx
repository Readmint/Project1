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
import { toast } from "sonner"; // Assuming sonner is installed, or use quick alert

export default function CommunicationPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]); // Editors + Reviewers

  // Form State
  const [selectedUser, setSelectedUser] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getJSON("/content-manager/communications");
      if (res.status === "success") {
        setLogs(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch communications", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch editors and reviewers to populate dropdown
      // We can reuse getEditors and getReviewers or make a dedicated 'getContactableUsers'
      // For now, let's just fetch editors for demo (reviewers endpoint returns strings, need IDs)
      // Ideally we need an endpoint that gives {id, name, role} for all targetable users.

      // Using a temporary workaround or we need to update backend to get IDs for reviewers too.
      // Let's rely on getEditors which returns {id, name}.
      const editorsRes = await getJSON("/content-manager/editors");
      if (editorsRes.status === 'success') {
        setUsers(editorsRes.data.map((e: any) => ({ ...e, role: 'Editor' })));
      }
    } catch (err) {
      console.error("Failed users", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  const handleSend = async () => {
    if (!selectedUser || !message) {
      alert("Please select a user and enter a message.");
      return;
    }
    setSending(true);
    try {
      const res = await postJSON("/content-manager/send-message", {
        receiverId: selectedUser, // This needs to be the USER ID, not editor ID. 
        // Wait, getEditors returns 'editor_id'. We might need user_id. 
        // The backend `getEditors` currently returns `id` as `editor_id`.
        // We need to fix backend `getEditors` to return `user_id` or `sendMessage` to accept `editor_id`.
        // Let's assume for now we need valid user_id.
        // Actually, looking at `getEditors` in controller: it returns `id: e.editor_id`.
        // But `sendMessage` expects `receiverId` which is looked up in `users` table. 
        // `editor_id` != `user_id`.
        // FIX: I will update `getEditors` in the next step to return `user_id` as well.
        receiverId: selectedUser,
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
    <div className="p-6 space-y-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* LEFT COLUMN: LOGS */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Communications</h1>
            <p className="text-slate-500 text-sm">
              Log of automated emails and system messages.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border rounded-lg hover:bg-slate-50"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No communication logs found.</div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${log.type === 'message' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      <Mail size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">
                          {log.type === 'assignment' ? 'Assignment Notification' : 'Direct Message'}
                        </h4>
                        <span className="text-xs text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-2">{log.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Sender: {log.sender_name || 'System'}</span>
                        <span>To: {log.receiver_name}</span>
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
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm sticky top-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Send size={18} className="text-indigo-600" />
            Send Message
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase">Recipient</label>
              <Select onValueChange={setSelectedUser} value={selectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.user_id || u.editor_id} value={u.user_id || u.editor_id}>
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
