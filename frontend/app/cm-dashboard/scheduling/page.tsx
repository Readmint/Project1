"use client";

import { useState } from "react";
import { CalendarDays, Clock, Zap, Star } from "lucide-react";

interface ScheduledItem {
  id: number;
  mode: string;
  date?: string;
  time?: string;
  issue?: string;
  category?: string;
  featured?: boolean;
  visibility: string;
}

export default function SchedulingPage() {
  // Static options - replace with API later
  const issues = [
    "January Issue",
    "February Issue",
    "March Issue",
    "April Issue",
    "Special Edition",
  ];

  const categories = [
    "Technology",
    "Business",
    "Lifestyle",
    "Environment",
    "Politics",
    "Education",
  ];

  const visibilities = ["Free", "Premium", "Featured"];

  // States
  const [publishMode, setPublishMode] = useState("schedule");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");
  const [selectedIssue, setSelectedIssue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [featured, setFeatured] = useState(false);
  const [visibility, setVisibility] = useState("Free");

  const [history, setHistory] = useState<ScheduledItem[]>([]);

  // Handle scheduling
  const handleSubmit = () => {
    if (publishMode === "schedule" && (!publishDate || !publishTime)) {
      alert("Please select both a publish date and time.");
      return;
    }

    if (!selectedIssue) {
      alert("Please select a monthly issue.");
      return;
    }

    if (!selectedCategory) {
      alert("Please select a category.");
      return;
    }

    const newItem: ScheduledItem = {
      id: Date.now(),
      mode: publishMode,
      date: publishMode === "schedule" ? publishDate : undefined,
      time: publishMode === "schedule" ? publishTime : undefined,
      issue: selectedIssue,
      category: selectedCategory,
      featured,
      visibility,
    };

    setHistory((prev) => [newItem, ...prev]);

    // Reset fields
    setPublishDate("");
    setPublishTime("");
    setSelectedIssue("");
    setSelectedCategory("");
    setFeatured(false);
    setVisibility("Free");
    setPublishMode("schedule");
  };

  return (
    <main className="px-6 py-6 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Publication Scheduling</h1>
        <p className="text-sm text-slate-500">
          Manage publishing, issue placements, visibility, and featured status.
        </p>
      </div>

      {/* Publish Mode */}
      <div className="flex gap-4">
        <button
          onClick={() => setPublishMode("now")}
          className={`px-4 py-2 rounded-lg text-sm ${
            publishMode === "now"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200 dark:bg-slate-800"
          }`}
        >
          Publish Now
        </button>

        <button
          onClick={() => setPublishMode("schedule")}
          className={`px-4 py-2 rounded-lg text-sm ${
            publishMode === "schedule"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200 dark:bg-slate-800"
          }`}
        >
          Schedule Publish
        </button>
      </div>

      {/* Schedule Picker */}
      {publishMode === "schedule" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm flex gap-1 items-center">
              <CalendarDays size={14} /> Publish Date
            </label>
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-slate-800"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm flex gap-1 items-center">
              <Clock size={14} /> Publish Time
            </label>
            <input
              type="time"
              value={publishTime}
              onChange={(e) => setPublishTime(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-slate-800"
            />
          </div>
        </div>
      )}

      {/* Issue Placement */}
      <div className="flex flex-col gap-2">
        <label className="text-sm">Monthly Issue Placement</label>
        <select
          value={selectedIssue}
          onChange={(e) => setSelectedIssue(e.target.value)}
          className="border rounded-lg px-3 py-2 dark:bg-slate-800"
        >
          <option value="">-- Select Issue --</option>
          {issues.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>

      {/* Category Placement */}
      <div className="flex flex-col gap-2">
        <label className="text-sm">Category Placement</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 dark:bg-slate-800"
        >
          <option value="">-- Select Category --</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Featured Toggle */}
      <div className="flex items-center gap-3">
        <input
          id="featured"
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="featured" className="text-sm flex items-center gap-2">
          <Star size={14} className="text-yellow-500" /> Feature this article
        </label>
      </div>

      {/* Visibility Settings */}
      <div className="flex flex-col gap-2">
        <label className="text-sm">Visibility Access</label>
        <select
          className="border rounded-lg px-3 py-2 dark:bg-slate-800"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          {visibilities.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <button
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        onClick={handleSubmit}
      >
        <Zap size={16} /> Confirm Scheduling
      </button>

      {/* HISTORY TABLE */}
      {history.length > 0 && (
        <div className="mt-10 border rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
          <h2 className="text-lg font-semibold px-4 py-3 border-b">
            Scheduling History
          </h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b">
                <th className="py-2 px-3">Mode</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Issue</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Featured</th>
                <th className="py-2 px-3">Visibility</th>
              </tr>
            </thead>

            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2 px-3 capitalize">{item.mode}</td>
                  <td className="py-2 px-3">{item.date || "—"}</td>
                  <td className="py-2 px-3">{item.time || "—"}</td>
                  <td className="py-2 px-3">{item.issue}</td>
                  <td className="py-2 px-3">{item.category}</td>
                  <td className="py-2 px-3">
                    {item.featured ? (
                      <span className="text-yellow-600 font-medium">Yes</span>
                    ) : (
                      "No"
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-1 rounded-md text-xs ${
                        item.visibility === "Featured"
                          ? "bg-yellow-100 text-yellow-700"
                          : item.visibility === "Premium"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.visibility}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
