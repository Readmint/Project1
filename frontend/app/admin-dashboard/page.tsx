"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getJSON } from "@/lib/api";
import {
  Users,
  FileText,
  Activity,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Zap,
  BarChart3,
  CheckCircle
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea exists
import { postJSON } from "@/lib/api";
import { toast } from "sonner";

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Announcement Modal State
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.push("/admin/login");
        return;
      }

      try {
        // Pass token explicitly
        const res = await getJSON("/admin/health", token);
        if (res.status === "success") {
          setData(res.data);
        } else {
          if (res.status === 401 || res.status === 403) {
            router.push("/admin/login");
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSendAnnouncement = async () => {
    if (!announcementTitle || !announcementMsg) {
      toast.error("Please fill in both title and message");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await postJSON("/admin/announcements", {
        title: announcementTitle,
        message: announcementMsg,
        targetRole: "author" // Default per requirement
      }, token || undefined);

      if (res.status === "success") {
        toast.success(`Announcement sent to ${res.recipientCount} authors via Email & Notifications`);
        setIsAnnouncementOpen(false);
        setAnnouncementTitle("");
        setAnnouncementMsg("");
      } else {
        toast.error(res.message || "Failed to send");
      }
    } catch (err) {
      toast.error("Error sending announcement");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Safe checks for data
  const users = data?.users || {};
  const content = data?.content || {};
  const sessions = data?.sessions || {};

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Health</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time system metrics and operational status.</p>
        </header>

        {/* Top High-Level metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Total Users"
            value={users.total || 0}
            icon={Users}
            trend={`${users.readers || 0} Readers`}
            color="text-indigo-600"
            bg="bg-indigo-600/10"
          />
          <StatCard
            label="Active Sessions"
            value={sessions.active || 0}
            icon={Zap}
            trend={`~${sessions.daily_active || 0} DAU`}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
          <StatCard
            label="Submissions Today"
            value={content.submissions_today || 0}
            icon={FileText}
            trend="New Content"
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <StatCard
            label="System Alerts"
            value={data?.alerts || 0}
            icon={AlertTriangle}
            trend={data?.alerts > 0 ? "Action Required" : "All Systems Normal"}
            color={data?.alerts > 0 ? "text-red-500" : "text-slate-500"}
            bg={data?.alerts > 0 ? "bg-red-500/10" : "bg-slate-500/10"}
          />
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* User Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Users size={18} className="text-slate-500" />
              User Composition
            </h3>
            <div className="space-y-4">
              <Row label="Readers" value={users.readers || 0} total={users.total} color="bg-indigo-500" />
              <Row label="Authors" value={users.authors || 0} total={users.total} color="bg-emerald-500" />
              <Row label="Reviewers" value={users.reviewers || 0} total={users.total} color="bg-amber-500" />
              <Row label="Editors" value={users.editors || 0} total={users.total} color="bg-purple-500" />
              <Row label="Managers" value={users.content_managers || 0} total={users.total} color="bg-pink-500" />
            </div>
          </div>

          {/* Operational Queue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Activity size={18} className="text-slate-500" />
              Operational Queues
            </h3>
            <div className="space-y-4">
              <QueueItem label="Pending Reviews" value={content.pending_reviews || 0} status="warning" />
              <QueueItem label="In Editorial Review" value={content.in_review || 0} status="info" />
              <QueueItem label="Editor Assignment Queue" value={content.editor_queue || 0} status="neutral" />
              <QueueItem label="Published Today" value={content.published_today || 0} status="success" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Zap size={18} className="text-slate-500" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors">
                <span className="text-sm font-medium">Suspend User</span>
                <AlertTriangle size={16} className="text-red-500" />
              </button>
              <button
                onClick={() => setIsAnnouncementOpen(true)}
                className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
              >
                <span className="text-sm font-medium">Create Announcement</span>
                <CheckCircle size={16} className="text-blue-500" />
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors">
                <span className="text-sm font-medium">Run System Scan</span>
                <ShieldCheck size={16} className="text-emerald-500" />
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors">
                <span className="text-sm font-medium">View System Logs</span>
                <FileText size={16} className="text-slate-500" />
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Announcement Modal */}
      <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>
              Send an announcement to all authors via Email and Notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="e.g., Scheduled Maintenance"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message Body</label>
              <Textarea
                placeholder="Type your message here..."
                className="min-h-[100px]"
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnnouncementOpen(false)}>Cancel</Button>
            <Button onClick={handleSendAnnouncement} disabled={sending}>
              {sending ? "Sending..." : "Broadcast Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color, bg }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${bg} ${color}`}>
          <Icon size={20} />
        </div>
        {/* Decorative circle */}
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${bg} opacity-50`}></div>
      </div>
      <div className="space-y-1 relative z-10">
        <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h4>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <span className="text-xs font-medium text-slate-400">{trend}</span>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, total, color }: any) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-medium text-slate-900 dark:text-white">{value}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  )
}

function QueueItem({ label, value, status }: any) {
  let colorClass = "bg-slate-100 text-slate-600";
  if (status === 'warning') colorClass = "bg-amber-100 text-amber-700";
  if (status === 'info') colorClass = "bg-blue-100 text-blue-700";
  if (status === 'success') colorClass = "bg-emerald-100 text-emerald-700";

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <span className={`text-xs font-bold px-2 py-1 rounded-md ${colorClass}`}>
        {value}
      </span>
    </div>
  )
}
