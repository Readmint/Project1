"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  MapPin,
  FileText,
  Tag,
  Link2,
  CreditCard,
  Crown,
  Edit,
  Upload,
  Award,
  BarChart3,
  FileTextIcon,
  Clock,
  TrendingUp,
  Layers,
} from "lucide-react";

/* ----------------------------------------------------
   Mock Editor Profile (Replace with real backend later)
---------------------------------------------------- */
const mockEditorProfile = {
  id: "editor_001",
  name: "Alicia Reed",
  email: "alicia.reed@readmint.com",
  role: "Senior Editor",
  photo: "/default-avatar.png",
  location: "New York, USA",
  bio: "Senior editor specializing in technology, cybersecurity, and enterprise workflows.",
  specializations: ["Technology", "Cybersecurity", "Startups"],
  socialLinks: {
    twitter: "https://twitter.com/aliciareed",
    linkedin: "https://linkedin.com/in/aliciareed",
    website: "https://aliciareed.me",
  },
  payout: {
    method: "bank",
    bankName: "Chase Bank",
    accountHolder: "Alicia Reed",
    accountNumber: "123456789",
    ifsc: "CHASUS33XXX",
    paypal: "alicia.paypal@readmint.com",
    upi: "alicia@upi",
    taxId: "TAXP12345Z",
  },
  stats: {
    totalEdits: 248,
    avgTime: "3.4 hours",
    certificates: 5,
    qualityScore: 94,
    revisionCycles: 28,
    assigned: 42,
    completed: 38,
    pending: 4,
  },
  joinedDate: "Jan 2023",
};

/* ----------------------------------------------------
   Component
---------------------------------------------------- */

export default function EditorProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [tab, setTab] = useState("info");

  useEffect(() => {
    setTimeout(() => {
      setProfile(mockEditorProfile);
      setLoading(false);
    }, 400);
  }, []);

  const handleSave = () => {
    setIsEditing(false);
    console.log("Saved Profile:", profile);
  };

  const handlePhotoChange = (e: any) => {
    if (!e.target.files?.[0]) return;
    const url = URL.createObjectURL(e.target.files[0]);
    setProfile((p: any) => ({ ...p, photo: url }));
  };

  if (loading) {
    return <div className="p-6 animate-pulse text-slate-600">Loading...</div>;
  }

  /* ----------------------------------------------------
        MAIN UI
  ---------------------------------------------------- */

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto text-slate-800 dark:text-slate-100">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <User className="text-indigo-600" /> Editor Profile
          </h1>
          <p className="text-[10px] text-slate-500">Manage your editorial identity & account</p>
        </div>

        {!isEditing ? (
          <Button
            className="bg-indigo-600 text-white rounded-full px-4 flex items-center gap-2"
            onClick={() => setIsEditing(true)}
          >
            <Edit size={14} /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              className="bg-green-600 text-white rounded-full px-3 text-xs"
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              className="text-xs"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* PROFILE CARD */}
      <Card className="rounded-xl border bg-white dark:bg-slate-800 shadow-sm mb-8">
        <CardContent className="p-5 flex items-center gap-6">

          {/* IMAGE */}
          <div className="relative">
            <img
              src={profile.photo}
              className="h-20 w-20 rounded-full object-cover border"
            />

            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full cursor-pointer">
                <Upload size={12} />
                <input type="file" className="hidden" onChange={handlePhotoChange} />
              </label>
            )}
          </div>

          {/* TEXT */}
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-lg">{profile.name}</p>
            <p className="text-[10px] flex gap-1 items-center text-slate-500">
              <Mail size={12}/> {profile.email}
            </p>
            <p className="text-[10px] flex gap-1 items-center text-slate-500">
              <MapPin size={12}/> {profile.location}
            </p>
            <p className="text-[10px] text-indigo-500">{profile.role}</p>
            <p className="text-[10px] text-slate-400">Joined: {profile.joinedDate}</p>
          </div>
        </CardContent>
      </Card>

      {/* CAROUSEL MENU (Author-style) */}
      <div className="flex overflow-x-auto gap-6 pb-3 border-b mb-6 text-sm hide-scrollbar">
        <CarouselTab label="Personal Info" active={tab === "info"} icon={<User size={14} />} onClick={() => setTab("info")} />
        <CarouselTab label="Social Links" active={tab === "social"} icon={<Link2 size={14} />} onClick={() => setTab("social")} />
        <CarouselTab label="Payout Details" active={tab === "payout"} icon={<CreditCard size={14} />} onClick={() => setTab("payout")} />
        <CarouselTab label="Membership" active={tab === "membership"} icon={<Crown size={14} />} onClick={() => setTab("membership")} />
      </div>

      {/* TABS CONTENT */}
      {tab === "info" && <InfoSection profile={profile} isEditing={isEditing} setProfile={setProfile} />}
      {tab === "social" && <SocialSection profile={profile} isEditing={isEditing} setProfile={setProfile} />}
      {tab === "payout" && <PayoutSection profile={profile} isEditing={isEditing} setProfile={setProfile} />}
      {tab === "membership" && <MembershipSection profile={profile} />}

    </div>
  );
}

/* ----------------------------------------------------
   COMPONENTS
---------------------------------------------------- */

function CarouselTab({ label, active, icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 pb-2 whitespace-nowrap ${
        active ? "text-indigo-600 border-b-2 border-indigo-600 font-medium" : "text-slate-500"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function InfoSection({ profile, isEditing, setProfile }: any) {
  return (
    <Card className="rounded-xl border bg-white dark:bg-slate-800 mb-10">
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-semibold flex gap-1 items-center mb-3">
          <User size={14}/> Personal Information
        </h3>

        <Field label="Display Name" value={profile.name} editable={isEditing}
          onChange={(v: string) => setProfile((p: any) => ({ ...p, name: v }))} />

        <Field label="Email Address" value={profile.email} editable={false} />

        <Field label="Location" value={profile.location} editable={isEditing}
          onChange={(v: string) => setProfile((p: any) => ({ ...p, location: v }))} />

        {/* BIO */}
        <div>
          <label className="text-xs text-slate-500 flex gap-1 items-center mb-1">
            <FileTextIcon size={12}/> Bio
          </label>
          <textarea
            className="w-full rounded-xl border bg-slate-100 dark:bg-slate-900 text-xs p-3"
            disabled={!isEditing}
            value={profile.bio}
            rows={4}
            onChange={e => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
          />
        </div>

        {/* SPECIALIZATIONS */}
        <div>
          <label className="text-xs text-slate-500 flex gap-1 items-center">
            <Tag size={12}/> Specializations
          </label>

          {isEditing ? (
            <input
              className="border rounded-lg p-2 text-xs bg-slate-100 dark:bg-slate-900 mt-1"
              value={profile.specializations.join(", ")}
              onChange={(e) =>
                setProfile((p: any) => ({
                  ...p,
                  specializations: e.target.value.split(",").map((s) => s.trim()),
                }))
              }
            />
          ) : (
            <div className="mt-1 flex gap-2 flex-wrap">
              {profile.specializations.map((s: string, i: number) => (
                <span key={i} className="px-2 py-1 text-[10px] bg-indigo-100 text-indigo-700 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SocialSection({ profile, isEditing, setProfile }: any) {
  return (
    <Card className="rounded-xl border bg-white dark:bg-slate-800 mb-10">
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-semibold flex gap-1 items-center mb-2">
          <Link2 size={14}/> Social Links
        </h3>

        {["twitter", "linkedin", "website"].map((key) => (
          <Field
            key={key}
            label={key.charAt(0).toUpperCase() + key.slice(1)}
            value={profile.socialLinks[key]}
            editable={isEditing}
            onChange={(v: string) =>
              setProfile((p: any) => ({
                ...p,
                socialLinks: { ...p.socialLinks, [key]: v },
              }))
            }
          />
        ))}
      </CardContent>
    </Card>
  );
}

function PayoutSection({ profile, isEditing, setProfile }: any) {
  const payout = profile.payout;

  return (
    <Card className="rounded-xl border bg-white dark:bg-slate-800 mb-10">
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-semibold flex gap-1 items-center mb-3">
          <CreditCard size={14}/> Payment & Payout Details
        </h3>

        {/* Payment Method */}
        <Field label="Preferred Method" value={payout.method} editable={isEditing}
          onChange={(v: string) => setProfile((p: any) => ({ ...p, payout: { ...payout, method: v } }))} />

        {/* BANK DETAILS */}
        {(payout.method === "bank" || isEditing) && (
          <>
            <Field label="Bank Name" value={payout.bankName} editable={isEditing}
              onChange={(v: string) => setProfile((p: any) => ({ ...p, payout: { ...payout, bankName: v } }))} />

            <Field label="Account Holder" value={payout.accountHolder} editable={isEditing}
              onChange={(v: string) => setProfile((p: any) => ({ ...p, payout: { ...payout, accountHolder: v } }))} />

            <Field label="Account Number" value={payout.accountNumber} editable={isEditing}
              onChange={(v: string) => setProfile((p: any) => ({ ...p, payout: { ...payout, accountNumber: v } }))} />

            <Field label="IFSC / SWIFT" value={payout.ifsc} editable={isEditing}
              onChange={(v: string) => setProfile((p: any) => ({ ...p, payout: { ...payout, ifsc: v } }))} />
          </>
        )}

        {/* PAYPAL */}
        {(payout.method === "paypal" || isEditing) && (
          <Field label="PayPal Email" value={payout.paypal} editable={isEditing}
            onChange={(v: string) => setProfile((p: any) => ({ ...p, payout: { ...payout, paypal: v } }))} />
        )}

        {/* UPI */}
        {(payout.method === "upi" || isEditing) && (
          <Field label="UPI ID" value={payout.upi} editable={isEditing}
            onChange={(v: string) => setProfile((p: any) => ({ ...p, payout: { ...payout, upi: v } }))} />
        )}

        {/* TAX ID */}
        <Field label="Tax ID / PAN" value={payout.taxId} editable={isEditing}
          onChange={(v: string) => setProfile((p: any) => ({ ...p, payout: { ...payout, taxId: v } }))} />
      </CardContent>
    </Card>
  );
}

function MembershipSection({ profile }: any) {
  return (
    <Card className="rounded-xl border bg-indigo-50 dark:bg-indigo-900/30 mb-10">
      <CardContent className="p-5 space-y-3 text-center">
        <h3 className="text-sm font-semibold flex justify-center gap-1 items-center">
          <Crown size={14}/> Editor Premium Status
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          Premium editor benefits activated automatically based on performance.
        </p>

        <ul className="text-[11px] space-y-1 text-left mx-auto w-fit">
          <li>✨ Priority assignment queue</li>
          <li>📊 Advanced editing analytics</li>
          <li>🎓 Certificate eligibility</li>
          <li>🚀 Faster review cycles</li>
        </ul>

        <Button className="rounded-full px-4 text-xs bg-indigo-600 text-white mt-2">
          View Achievements
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, editable, onChange }: any) {
  return (
    <div className="flex flex-col text-xs">
      <label className="text-slate-500 text-[11px] mb-1">{label}</label>

      {editable ? (
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="border rounded-lg p-2 bg-slate-100 dark:bg-slate-900"
        />
      ) : (
        <p className="text-slate-300 dark:text-slate-200 text-xs">{value || "-"}</p>
      )}
    </div>
  );
}
