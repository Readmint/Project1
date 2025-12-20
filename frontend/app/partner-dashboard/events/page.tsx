"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus, Loader2, Sparkles, Clock, Send } from "lucide-react";
import { useRouter } from "next/navigation";

// Types
type Event = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
};

// API Base normalization
const raw = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000").replace(/\/+$/, "");
const API_BASE = raw.endsWith("/api") ? raw.slice(0, -4) : raw;

export default function PartnerEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  // Fetch Events
  useEffect(() => {
    fetchEvents();
  }, []);

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("ACCESS_TOKEN") || localStorage.getItem("token") || localStorage.getItem("idToken");
  };

  const fetchEvents = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/partner/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.status === "success") {
        setEvents(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.start_date || !formData.end_date) {
      alert("Please fill in required fields");
      return;
    }

    try {
      setCreating(true);
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/partner/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.status === "success") {
        setShowForm(false);
        setFormData({ title: "", description: "", start_date: "", end_date: "" });
        fetchEvents(); // Refresh list
        alert("Event created and admin notified successfully! 🚀");
      } else {
        alert("Failed: " + json.message);
      }
    } catch (err) {
      console.error("Create error", err);
      alert("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen space-y-8">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Event Horizon
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Manage your academic gatherings and notify the admins in style.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
        >
          {showForm ? "Cancel Creation" : <><Plus className="mr-2 h-4 w-4" /> Create New Event</>}
        </Button>
      </div>

      {/* Creation Form - Animated entry */}
      {showForm && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <Card className="p-6 border-0 shadow-2xl bg-gradient-to-br from-white to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl overflow-hidden relative">
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Event Title</label>
                  <Input
                    placeholder="e.g. Annual Science Symposium 2025"
                    className="bg-white/80 dark:bg-slate-950/50 border-indigo-100 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Description</label>
                  <Textarea
                    placeholder="What's this event about?"
                    className="bg-white/80 dark:bg-slate-950/50 border-indigo-100 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all min-h-[120px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Start Date</label>
                    <Input
                      type="datetime-local"
                      className="bg-white/80 dark:bg-slate-950/50 border-indigo-100 dark:border-slate-700"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">End Date</label>
                    <Input
                      type="datetime-local"
                      className="bg-white/80 dark:bg-slate-950/50 border-indigo-100 dark:border-slate-700"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-8 flex justify-end">
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-6 rounded-xl shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02]"
                  >
                    {creating ? <Loader2 className="animate-spin" /> : <><Send className="mr-2 h-5 w-5" /> Launch Event</>}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Events Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="text-yellow-500" /> Upcoming Events
        </h2>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-indigo-500" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Calendar className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No events scheduled properly. Time to make history!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="group relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 rounded-2xl">
                {/* Gradient header */}
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />

                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xl line-clamp-2 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                      {event.status}
                    </div>
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 min-h-[3rem]">
                    {event.description || "No description provided."}
                  </p>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Start: {new Date(event.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>End: {new Date(event.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
