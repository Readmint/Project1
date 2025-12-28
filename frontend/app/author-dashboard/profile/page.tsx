"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  MapPin,
  Tag,
  BarChart3,
  Award,
  Banknote,
  Crown,
  Link2,
  CreditCard,
  Edit,
  Upload,
  FileText,
  Eye,
} from "lucide-react";

type Stats = {
  articles: number;
  views: number;
  certificates: number;
  earnings: number;
  monthlyEarnings?: number;
  rank?: number;
};

type Profile = {
  id?: string;
  email?: string;
  role?: string;
  name?: string;
  photo?: string;
  location?: string;
  bio?: string;
  legalName?: string;
  qualifications?: string;
  specialty?: string;
  tags?: string[];
  socialLinks?: Record<string, string>;
  payoutDetails?: Record<string, string>;
  isVerified?: boolean;
  joinedDate?: string | null;
  stats?: Stats;
  membership?: any;
};

// Normalize NEXT_PUBLIC_API_BASE to API_ROOT (works with values like "http://localhost:5000" or ".../api")
// Falls back to "/api" when env not provided
const rawApi = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");
const API_BASE = rawApi.endsWith("/api") ? rawApi.replace(/\/api$/, "") : rawApi;
const API_ROOT = `${API_BASE || ""}/api`.replace(/\/+$/, ""); // e.g. "http://localhost:5000/api" or "/api"

export default function AuthorProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tab, setTab] = useState<"info" | "social" | "payout" | "membership">("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Robust getToken(): checks multiple keys and trims
  const getToken = (): string | null => {
    try {
      if (typeof window === "undefined") return null;
      const keys = ["ACCESS_TOKEN", "token", "idToken"];
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v && v.trim()) return v.trim();
      }
      return null;
    } catch (err) {
      console.warn("getToken error", err);
      return null;
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    try {
      const token = getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        // fallback: if you stored user object with id in localStorage during dev login
        const userRaw = localStorage.getItem("user");
        if (userRaw) {
          try {
            const u = JSON.parse(userRaw);
            if (u?.id) {
              headers["x-user-id"] = u.id;
            } else if (u?.uid) {
              // Firebase uid saved as uid
              headers["x-user-id"] = u.uid;
            }
          } catch { }
        }
      }
    } catch { }
    return headers;
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);

    const headers = getAuthHeaders();

    try {
      const res = await fetch(`${API_ROOT}/authors/profile`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (res.status === 401) {
        setUnauthorized(true);
        setProfile(null);
        setError("Unauthorized. Please sign in.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || `Error fetching profile: ${res.statusText}`);
        setProfile(null);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data?.success && data.profile) {
        // ensure shape
        const p: Profile = {
          id: data.profile.id,
          email: data.profile.email,
          role: data.profile.role,
          name: data.profile.name,
          photo: data.profile.photo,
          location: data.profile.location,
          bio: data.profile.bio,
          legalName: data.profile.legalName,
          qualifications: data.profile.qualifications,
          specialty: data.profile.specialty,
          tags: data.profile.tags || [],
          socialLinks: data.profile.socialLinks || {},
          payoutDetails: data.profile.payoutDetails || {},
          isVerified: data.profile.isVerified || false,
          joinedDate: data.profile.joinedDate,
          stats: data.profile.stats || {
            articles: 0,
            views: 0,
            certificates: 0,
            earnings: 0,
          },
          membership: data.profile.membership || null,
        };
        setProfile(p);
      } else {
        setError("Unexpected response from server");
        setProfile(null);
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err?.message || "Network error");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (n?: number) => {
    if (n == null) return "-";
    return n >= 1000 ? `${Math.round(n / 1000)}K` : n.toString();
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setTab("info");
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);

    const updates: any = {
      name: profile.name,
      location: profile.location,
      bio: profile.bio,
      legalName: profile.legalName,
      qualifications: profile.qualifications,
      specialty: profile.specialty,
      tags: profile.tags,
      socialLinks: profile.socialLinks,
      payoutDetails: profile.payoutDetails,
    };

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_ROOT}/authors/profile`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (res.status === 401) {
        setUnauthorized(true);
        setError("Unauthorized. Please sign in to update profile.");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || "Failed to update profile");
        return;
      }

      const body = await res.json();
      if (body?.success) {
        // re-fetch profile to get canonical data (and created timestamps)
        await fetchProfile();
        setIsEditing(false);
      } else {
        setError(body?.message || "Failed to update profile");
      }
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err?.message || "Network error when saving");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    // quick client-side preview
    const url = URL.createObjectURL(file);
    setProfile((p) => (p ? { ...p, photo: url } : p));

    // If you have nowhere to upload the file (S3/Cloudinary/Firebase Storage),
    // send the temp URL to backend which will accept a URL. In production you should
    // upload the file to storage and send the final public URL.
    try {
      // Here we pretend we've uploaded and obtained 'url' - send to backend to store
      const headers = getAuthHeaders();
      const res = await fetch(`${API_ROOT}/authors/profile/photo`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ photoUrl: url }),
      });

      if (res.status === 401) {
        setUnauthorized(true);
        setError("Unauthorized. Please sign in to update photo.");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || "Failed to update profile photo");
        return;
      }

      const body = await res.json();
      if (body?.success && body.photoUrl) {
        // use server-canonical photo URL when available
        setProfile((p) => (p ? { ...p, photo: body.photoUrl } : p));
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
      setError("Error uploading photo");
    }
  };

  // helper to update simple fields locally while editing
  const updateField = (field: keyof Profile, value: any) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-slate-200 rounded" />
          <div className="h-48 bg-white rounded shadow" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 p-3 md:p-4">
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-indigo-600" /> Author Profile
          </h1>
          <p className="text-sm text-slate-500">Manage your public profile and account settings</p>
        </div>

        {!isEditing ? (
          <Button onClick={handleEditProfile} className="bg-indigo-600 text-white rounded-full px-4 flex items-center gap-2">
            <Edit className="h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSaveProfile} className="bg-green-600 text-white rounded-full px-4 flex items-center gap-2" disabled={saving}>
              💾 {saving ? "Saving..." : "Save Profile"}
            </Button>
            <Button variant="ghost" onClick={() => { setIsEditing(false); fetchProfile(); }}>
              Cancel
            </Button>
          </div>
        )}
      </motion.div>

      {/* ERROR */}
      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded">
          {error}
        </div>
      )}

      {/* AUTHOR PREVIEW */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="rounded-2xl border">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative">
              <img src={profile?.photo || "/author.png"} alt="Author" className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-indigo-500/40" />
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full cursor-pointer">
                  <Upload size={12} />
                  <input type="file" className="hidden" onChange={handlePhotoChange} />
                </label>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <h2 className="font-semibold text-lg">{profile?.name || "Unknown"}</h2>
              <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {profile?.email || "-"}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {profile?.location || "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<FileText className="h-5 w-5" />} label="Articles Published" value={profile?.stats?.articles ?? 0} />
        <StatCard icon={<Eye className="h-5 w-5" />} label="Total Views" value={formatNumber(profile?.stats?.views)} />
        <StatCard icon={<Award className="h-5 w-5" />} label="Certificates" value={profile?.stats?.certificates ?? 0} />
        <StatCard icon={<Banknote className="h-5 w-5" />} label="Earnings" value={`$${formatNumber(profile?.stats?.earnings)}`} />
      </div>

      {/* TAB SELECT */}
      <div className="flex flex-wrap border-b gap-4 text-sm justify-center sm:justify-start">
        <TabBtn active={tab === "info"} onClick={() => setTab("info")} icon={<User size={14} />}>Personal Info</TabBtn>
        <TabBtn active={tab === "social"} onClick={() => setTab("social")} icon={<Link2 size={14} />}>Social Links</TabBtn>
        <TabBtn active={tab === "payout"} onClick={() => setTab("payout")} icon={<CreditCard size={14} />}>Payout Details</TabBtn>
        <TabBtn active={tab === "membership"} onClick={() => setTab("membership")} icon={<Crown size={14} />}>Membership</TabBtn>
      </div>

      {/* TAB CONTENT */}
      {tab === "info" && (
        <PersonalInfoSection profile={profile ?? {}} isEditing={isEditing} onChange={(f, v) => updateField(f as any, v)} onSave={handleSaveProfile} />
      )}
      {tab === "social" && (
        <SocialLinksSection
          profile={profile ?? {}}
          isEditing={isEditing}
          onChange={(k, v) => {
            setProfile((p) => (p ? { ...p, socialLinks: { ...p.socialLinks, [k]: v } } : p));
          }}
          onSave={handleSaveProfile}
        />
      )}
      {tab === "payout" && (
        <PayoutSection
          profile={profile ?? {}}
          isEditing={isEditing}
          onChange={(k, v) => {
            setProfile((p) => (p ? { ...p, payoutDetails: { ...p.payoutDetails, [k]: v } } : p));
          }}
          onSave={handleSaveProfile}
        />
      )}
      {tab === "membership" && <MembershipSection formatNumber={formatNumber} membership={profile?.membership} />}

      {/* Unauthorized hint */}
      {unauthorized && <div className="text-xs text-slate-600 mt-2">You are not signed in — some actions (edit/save) require signing in.</div>}
    </div>
  );
}

/* ---------- small subcomponents below ---------- */

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <motion.div whileHover={{ y: -2 }}>
      <Card className="rounded-2xl border">
        <CardContent className="p-4 flex justify-between items-center">
          <div className="text-right flex-1">
            <p className="text-[10px] text-slate-500">{label}</p>
            <p className="text-lg sm:text-xl font-semibold">{value}</p>
          </div>
          <div className="ml-2 p-2 rounded-full bg-indigo-50 text-indigo-600">{icon}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1 pb-1 ${active ? "border-b-2 border-indigo-600 font-medium" : "text-slate-600"}`}>
      {icon} {children}
    </button>
  );
}

function Field({ icon, label, value, editable = false, onChange }: { icon: React.ReactNode; label: string; value: string | any; editable?: boolean; onChange?: (value: string) => void; }) {
  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm">
      <span className="text-indigo-600">{icon}</span>
      <label className="w-32 text-left font-medium text-slate-600 text-xs">{label}</label>
      {editable ? (
        <input className="flex-1 border px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900" value={value ?? ""} onChange={e => onChange?.(e.target.value)} />
      ) : (
        <span className="text-slate-800 text-xs">{value ?? "-"}</span>
      )}
    </div>
  );
}

function PersonalInfoSection({ profile, isEditing, onChange, onSave }: { profile: Profile; isEditing: boolean; onChange: (field: string, value: any) => void; onSave: () => void; }) {
  return (
    <Card className="rounded-2xl border">
      <CardContent className="p-5 grid gap-4">
        <h3 className="font-semibold text-base flex items-center gap-2"><User className="h-4 w-4 text-indigo-600" /> Personal Information</h3>

        <Field icon={<User size={14} />} label="Display Name" value={profile?.name || ""} editable={isEditing} onChange={v => onChange("name", v)} />
        <Field icon={<User size={14} />} label="Legal Name" value={profile?.legalName || ""} editable={isEditing} onChange={v => onChange("legalName", v)} />
        <Field icon={<Mail size={14} />} label="Email Address" value={profile?.email || ""} />
        <Field icon={<MapPin size={14} />} label="Location" value={profile?.location || ""} editable={isEditing} onChange={v => onChange("location", v)} />
        <Field icon={<Tag size={14} />} label="Specialty" value={profile?.specialty || ""} editable={isEditing} onChange={v => onChange("specialty", v)} />

        <div>
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1"><FileText size={12} /> Bio</p>
          <textarea className="w-full border rounded-xl p-3 text-xs bg-slate-50 dark:bg-slate-900 min-h-[70px]" value={profile?.bio || ""} disabled={!isEditing} onChange={e => onChange("bio", e.target.value)} />
        </div>

        {isEditing && <Button onClick={onSave} className="w-fit mx-auto text-xs rounded-full bg-indigo-600 text-white px-4">Save Changes</Button>}
      </CardContent>
    </Card>
  );
}

function SocialLinksSection({ profile, isEditing, onChange, onSave }: { profile: Profile; isEditing: boolean; onChange: (key: string, value: string) => void; onSave: () => void; }) {
  return (
    <Card className="rounded-2xl border">
      <CardContent className="p-4 grid gap-3">
        <h3 className="font-semibold text-center flex items-center justify-center gap-1">🌐 Social & Portfolio Links</h3>
        <input placeholder="Twitter URL" className="border px-3 py-2 rounded-xl text-xs" value={profile.socialLinks?.twitter || ""} disabled={!isEditing} onChange={e => onChange("twitter", e.target.value)} />
        <input placeholder="LinkedIn URL" className="border px-3 py-2 rounded-xl text-xs" value={profile.socialLinks?.linkedin || ""} disabled={!isEditing} onChange={e => onChange("linkedin", e.target.value)} />
        <input placeholder="Portfolio Website" className="border px-3 py-2 rounded-xl text-xs" value={profile.socialLinks?.website || ""} disabled={!isEditing} onChange={e => onChange("website", e.target.value)} />
        {isEditing && <Button onClick={onSave} className="w-fit mx-auto mt-3 text-xs rounded-full bg-indigo-600 text-white">Save Links</Button>}
      </CardContent>
    </Card>
  );
}

function PayoutSection({ profile, isEditing, onChange, onSave }: { profile: Profile; isEditing: boolean; onChange: (key: string, value: string) => void; onSave: () => void; }) {
  return (
    <Card className="rounded-2xl border">
      <CardContent className="p-4 grid gap-3">
        <h3 className="font-semibold text-center">💳 Payout Details</h3>
        <input placeholder="Bank Name" className="border px-3 py-2 rounded-xl text-xs" value={profile.payoutDetails?.bankName || ""} disabled={!isEditing} onChange={e => onChange("bankName", e.target.value)} />
        <input placeholder="Account Holder" className="border px-3 py-2 rounded-xl text-xs" value={profile.payoutDetails?.accountHolder || ""} disabled={!isEditing} onChange={e => onChange("accountHolder", e.target.value)} />
        <input placeholder="Account Number" className="border px-3 py-2 rounded-xl text-xs" value={profile.payoutDetails?.accountNumber || ""} disabled={!isEditing} onChange={e => onChange("accountNumber", e.target.value)} />
        <input placeholder="IFSC/SWIFT Code" className="border px-3 py-2 rounded-xl text-xs" value={profile.payoutDetails?.ifsc || ""} disabled={!isEditing} onChange={e => onChange("ifsc", e.target.value)} />
        {isEditing && <Button onClick={onSave} className="w-fit mx-auto text-xs rounded-full bg-emerald-600 text-white px-4 mt-2">Save Payout Info</Button>}
      </CardContent>
    </Card>
  );
}

function MembershipSection({ formatNumber, membership }: { formatNumber: (n?: number) => string; membership: any }) {
  const price = membership?.priceMonthly ?? 19.99;
  const renew = membership?.endDate ?? "N/A";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="rounded-2xl border bg-indigo-50 dark:bg-indigo-900/30">
        <CardContent className="p-4 grid gap-3 text-center">
          <h3 className="font-semibold flex justify-center items-center gap-1"><Crown size={16} className="text-indigo-600" /> Premium Author Plan</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Card className="rounded-xl p-3 border"><p className="text-xl font-semibold">${price}</p><p className="text-[10px] text-slate-500">Monthly Price</p></Card>
            <Card className="rounded-xl p-3 border"><p className="text-sm font-semibold">{renew}</p><p className="text-[10px] text-slate-500">Renewal Date</p></Card>
          </div>
          <ul className="text-[10px] space-y-1">
            <li>✨ Unlimited article submissions</li>
            <li>🚀 Priority review queue</li>
            <li>📊 Advanced analytics</li>
            <li>🎓 Certificate eligibility</li>
          </ul>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" className="text-[10px] rounded-full">Change Plan</Button>
            <Button size="sm" className="bg-rose-600 text-white text-[10px] rounded-full">Cancel Subscription</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
