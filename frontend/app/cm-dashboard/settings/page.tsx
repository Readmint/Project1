"use client";

import { useState } from "react";
import { Bell, Globe2, UserCog, Shield, User, Mail, MapPin, Tag, FileText, Link as LinkIcon, CreditCard, Crown, Pencil, X,} from "lucide-react";

export default function SettingsPage() {
  const [tab, setTab] = useState("personal");
  const [editModal, setEditModal] = useState(false);

  // Mock Data
  const [profile, setProfile] = useState({
    displayName: "Content Manager",
    legalName: "John Doe",
    email: "cm@readmint.example.com",
    location: "India",
    specialty: "Technology | Editorial Workflow",
    bio: "Experienced content manager maintaining workflow efficiency and editorial quality.",
  });

  const [editData, setEditData] = useState(profile);

  const rolePermissions = {
    canAssignReviewers: true,
    canAssignEditors: true,
    canPublish: true,
    canChangeRoles: false,
  };

  const handleSaveProfile = () => {
    setProfile(editData);
    setEditModal(false);
  };

  return (
    <main className="px-6 py-6 space-y-10">

      {/* Header */}
      <section>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-500">
          Manage profile details, preferences, and permissions.
        </p>
      </section>

      {/* Tabs (top section) */}
      <section>
        <div className="border-b border-slate-200 dark:border-slate-700 flex gap-6 text-sm">
          {[
            { id: "personal", label: "Personal Info", icon: User },
            { id: "social", label: "Social Links", icon: LinkIcon },
            { id: "payout", label: "Payout Details", icon: CreditCard },
            { id: "membership", label: "Membership", icon: Crown },
          ].map((t) => (
            <button
              key={t.id}
              className={`pb-2 border-b-2 flex items-center gap-1 ${
                tab === t.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500"
              }`}
              onClick={() => setTab(t.id)}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* -------------------------------------------------------------- */}
        {/* PERSONAL INFO */}
        {/* -------------------------------------------------------------- */}
        {tab === "personal" && (
          <section className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900 p-6 mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-600" />
                Personal Information
              </h2>

              <button
                className="flex items-center gap-1 text-indigo-600 hover:underline text-sm"
                onClick={() => {
                  setEditData(profile);
                  setEditModal(true);
                }}
              >
                <Pencil size={14} /> Edit
              </button>
            </div>

            <div className="space-y-4 text-sm">

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" />
                <span className="font-medium w-32">Display Name:</span>
                <span>{profile.displayName}</span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" />
                <span className="font-medium w-32">Legal Name:</span>
                <span>{profile.legalName}</span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-600" />
                <span className="font-medium w-32">Email Address:</span>
                <span>{profile.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-600" />
                <span className="font-medium w-32">Location:</span>
                <span>{profile.location}</span>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-indigo-600" />
                <span className="font-medium w-32">Specialty:</span>
                <span>{profile.specialty}</span>
              </div>

              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-indigo-600 mt-1" />
                <span className="font-medium w-32">Bio:</span>
                <p className="text-slate-700 dark:text-slate-300 max-w-xl">
                  {profile.bio}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* SOCIAL LINKS */}
        {/* -------------------------------------------------------------- */}
        {tab === "social" && (
          <section className="rounded-xl border bg-white dark:bg-slate-900 p-6 mt-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Social Links</h2>
            <p className="text-sm text-slate-500">Feature coming soon.</p>
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* PAYOUT DETAILS */}
        {/* -------------------------------------------------------------- */}
        {tab === "payout" && (
          <section className="rounded-xl border bg-white dark:bg-slate-900 p-6 mt-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Payout Details</h2>
            <p className="text-sm text-slate-500">Feature coming soon.</p>
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* MEMBERSHIP */}
        {/* -------------------------------------------------------------- */}
        {tab === "membership" && (
          <section className="rounded-xl border bg-white dark:bg-slate-900 p-6 mt-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Membership</h2>
            <p className="text-sm text-slate-500">Feature coming soon.</p>
          </section>
        )}
      </section>

      {/* -------------------------------------------------------------- */}
      {/* GLOBAL SETTINGS SECTION (Option C requirement) */}
      {/* These appear BELOW ALL TABS */}
      {/* -------------------------------------------------------------- */}

      <section className="space-y-6">

        {/* Notifications */}
        <div className="rounded-xl border bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Bell className="text-indigo-600 h-4 w-4" /> Notification Preferences
          </h2>

          <label className="flex justify-between items-center text-sm">
            <span>Email Alerts</span>
            <input type="checkbox" defaultChecked />
          </label>

          <label className="flex justify-between items-center text-sm">
            <span>In-app Alerts</span>
            <input type="checkbox" defaultChecked />
          </label>
        </div>

        {/* Language */}
        <div className="rounded-xl border bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Globe2 className="text-indigo-600 h-4 w-4" /> Language Settings
          </h2>
          <select className="border rounded-lg px-3 py-2 dark:bg-slate-800 w-full">
            <option>English</option>
            <option>Hindi</option>
            <option>Spanish</option>
          </select>
        </div>

        {/* Account Details */}
        <div className="rounded-xl border bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <UserCog className="text-indigo-600 h-4 w-4" /> Account Details
          </h2>
          <p className="text-sm">Email: {profile.email}</p>
        </div>

        {/* Role Permissions */}
        <div className="rounded-xl border bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Shield className="text-indigo-600 h-4 w-4" /> Role Permissions (Limited)
          </h2>
          <ul className="text-sm space-y-1">
            <li>Assign Reviewers: ✔ Yes</li>
            <li>Assign Editors: ✔ Yes</li>
            <li>Publish Content: ✔ Yes</li>
            <li>Modify User Roles: ❌ No (Admin only)</li>
          </ul>
        </div>

      </section>

      {/* -------------------------------------------------------------- */}
      {/* Edit Profile Modal */}
      {/* -------------------------------------------------------------- */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-5 relative">

            {/* Close */}
            <button className="absolute right-4 top-4" onClick={() => setEditModal(false)}>
              <X className="h-5 w-5 text-slate-500 hover:text-slate-700" />
            </button>

            <h2 className="text-lg font-semibold mb-2">Edit Personal Information</h2>

            {/* Form */}
            <div className="space-y-4 text-sm">

              <div>
                <label className="font-medium">Display Name</label>
                <input
                  className="border rounded-lg w-full px-3 py-2 mt-1 dark:bg-slate-800"
                  value={editData.displayName}
                  onChange={(e) =>
                    setEditData({ ...editData, displayName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="font-medium">Legal Name</label>
                <input
                  className="border rounded-lg w-full px-3 py-2 mt-1 dark:bg-slate-800"
                  value={editData.legalName}
                  onChange={(e) =>
                    setEditData({ ...editData, legalName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="font-medium">Email Address</label>
                <input
                  className="border rounded-lg w-full px-3 py-2 mt-1 dark:bg-slate-800"
                  value={editData.email}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="font-medium">Location</label>
                <input
                  className="border rounded-lg w-full px-3 py-2 mt-1 dark:bg-slate-800"
                  value={editData.location}
                  onChange={(e) =>
                    setEditData({ ...editData, location: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="font-medium">Specialty</label>
                <input
                  className="border rounded-lg w-full px-3 py-2 mt-1 dark:bg-slate-800"
                  value={editData.specialty}
                  onChange={(e) =>
                    setEditData({ ...editData, specialty: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="font-medium">Bio</label>
                <textarea
                  className="border rounded-lg w-full px-3 py-2 mt-1 h-28 dark:bg-slate-800"
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData({ ...editData, bio: e.target.value })
                  }
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm"
                onClick={() => setEditModal(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm"
                onClick={handleSaveProfile}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
