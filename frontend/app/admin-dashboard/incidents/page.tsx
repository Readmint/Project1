"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getJSON, postJSON } from "@/lib/api";
import {
  AlertTriangle, Search, Filter, Plus,
  CheckCircle, Clock, XCircle, MoreVertical,
  Shield, User
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function IncidentManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Create Incident State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newIncident, setNewIncident] = useState({ title: "", description: "", priority: "medium", relatedSubmissionId: "" });

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const query = new URLSearchParams({
        limit: "20",
        status: statusFilter,
        priority: priorityFilter
      });

      const res = await getJSON(`/admin/incidents?${query.toString()}`, token);
      if (res.status === "success") {
        setIncidents(res.data.incidents);
      } else {
        if (res.status === 401 || res.status === 403) router.push("/admin/login");
        else toast.error("Failed to load incidents");
      }
    } catch (error) {
      console.error(error);
      toast.error("System error fetching incidents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, priorityFilter]);

  const handleCreateIncident = async () => {
    const toastId = toast.loading("Creating incident...");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const res = await postJSON("/admin/incidents", newIncident, token);
      if (res.status === "success") {
        toast.success("Incident created", { id: toastId });
        setIsCreateOpen(false);
        setNewIncident({ title: "", description: "", priority: "medium", relatedSubmissionId: "" });
        fetchIncidents();
      } else {
        toast.error(res.message, { id: toastId });
      }
    } catch (err) {
      toast.error("System error", { id: toastId });
    }
  };

  const handleUpdateStatus = async (incidentId: string, status: string) => {
    const toastId = toast.loading("Updating status...");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const res = await postJSON("/admin/incidents/update", { incidentId, status }, token);
      if (res.status === "success") {
        toast.success("Status updated", { id: toastId });
        fetchIncidents();
      } else {
        toast.error(res.message, { id: toastId });
      }
    } catch (err) {
      toast.error("System error", { id: toastId });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="flex-1 p-8 overflow-y-auto">

        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Incident Management</h1>
            <p className="text-slate-500 text-sm mt-1">Track and resolve critical platform issues and escalations.</p>
          </div>

          <div className="flex gap-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus size={16} className="mr-2" /> New Incident
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Incident</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      placeholder="Incident Subject"
                      value={newIncident.title}
                      onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Detailed description of the issue..."
                      value={newIncident.description}
                      onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newIncident.priority}
                        onChange={(e) => setNewIncident({ ...newIncident, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Related Submission ID (Opt)</label>
                      <Input
                        placeholder="UUID..."
                        value={newIncident.relatedSubmissionId}
                        onChange={(e) => setNewIncident({ ...newIncident, relatedSubmissionId: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateIncident}>Create Ticket</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Ticket</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading incidents...</td></tr>
                ) : incidents.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No active incidents found.</td></tr>
                ) : (
                  incidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{incident.title}</div>
                        <div className="text-xs text-slate-500 mt-1 max-w-md truncate">{incident.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={incident.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={incident.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          {incident.assignee_name || "Unassigned"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(incident.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg outline-none">
                            <MoreVertical size={16} className="text-slate-400" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(incident.id, 'investigating')}>
                              Mark Investigating
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(incident.id, 'resolved')}>
                              Mark Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Delete (Coming Soon)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: any = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700 font-bold animate-pulse"
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${colors[priority]}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    open: "text-blue-600 bg-blue-50 border-blue-100",
    investigating: "text-purple-600 bg-purple-50 border-purple-100",
    resolved: "text-emerald-600 bg-emerald-50 border-emerald-100",
    dismissed: "text-slate-500 bg-slate-50 border-slate-100"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${colors[status]}`}>
      {status}
    </span>
  );
}
