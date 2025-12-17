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
  XCircle,
  Languages,
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
  resumeUrl?: string | null;
  experience_months?: number;
  fields?: string[]; // editor expertise
  languages?: string[]; // editor languages
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

/** Helper to read token consistently from localStorage */
function getTokenFromStorage(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const tKeys = ["ACCESS_TOKEN", "token", "idToken", "accessToken"];
    for (const k of tKeys) {
      const t = localStorage.getItem(k);
      if (t && t.trim()) return t.trim();
    }
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        if (u?.token) return String(u.token);
        if (u?.accessToken) return String(u.accessToken);
      } catch { }
    }
    return null;
  } catch (err) {
    console.warn("getTokenFromStorage error", err);
    return null;
  }
}

/** Build headers for JSON requests; include Authorization only if token exists */
const buildJsonHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getTokenFromStorage();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  else {
    // fallback: x-user-id if available in localStorage.user
    try {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u?.id) headers["x-user-id"] = u.id;
        else if (u?.uid) headers["x-user-id"] = u.uid;
      }
    } catch { }
  }
  return headers;
};

export default function AuthorProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tab, setTab] = useState<"info" | "social" | "payout" | "membership">("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAuthHeaders = (): Record<string, string> => buildJsonHeaders();

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);

    const headers = getAuthHeaders();

    try {
      const res = await fetch(`${API_BASE}/editor/profile`, {
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

      const data = await res.json().catch(() => null);
      if (data?.status === "success" && data.data) {
        // Parse fields (legacy array vs new object)
        let expertise: string[] = [];
        let langs: string[] = [];
        const rawFields = data.data.fields;

        if (Array.isArray(rawFields)) {
          expertise = rawFields;
        } else if (rawFields && typeof rawFields === 'object') {
          expertise = rawFields.expertise || [];
          langs = rawFields.languages || [];
        }

        const p: Profile = {
          id: data.data.user_id || data.data.user_id,
          email: data.data.email,
          role: data.data.role,
          name: data.data.display_name || data.data.name,
          photo: data.data.profile_photo_url || data.data.photo,
          location: data.data.location,
          legalName: data.data.legalName,
          qualifications: data.data.qualifications,
          specialty: data.data.specialty,
          tags: data.data.tags || [],
          socialLinks: data.data.socialLinks || {},
          payoutDetails: data.data.payoutDetails || {},
          isVerified: data.data.is_verified || false,
          joinedDate: data.data.joined_date,
          stats: data.data.stats || {
            articles: 0,
            views: 0,
            certificates: 0,
            earnings: 0,
          },
          membership: data.data.membership || null,
          resumeUrl: data.data.resume_url || null,
          experience_months: data.data.experience_months || 0,
          fields: expertise,
          languages: langs,
        };
        setProfile(p);
        setResumeFileName(p.resumeUrl ? extractFileName(p.resumeUrl) : null);
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

  const extractFileName = (url?: string | null) => {
    if (!url) return null;
    try {
      const parts = url.split("/");
      return parts[parts.length - 1].split("?")[0];
    } catch {
      return url;
    }
  };

  const formatNumber = (n?: number) => {
    if (n == null) return "-";
    return typeof n === "number" && n >= 1000 ? `${Math.round(n / 1000)}K` : String(n);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setTab("info");
  };

  /**
   * Updated handleSaveProfile:
   * - Build minimal payload with only non-empty fields
   * - Convert experience_months to integer if present
   * - Only include fields if they are non-empty (prevents accidental validation errors)
   * - If server returns validation error object (body.errors), show it in UI
   */
  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);

    try {
      // Build a minimal payload: send only keys that are present and non-empty
      const updates: any = {};

      const pushIf = (key: string, val: any) => {
        if (val === undefined || val === null) return;
        if (typeof val === "string") {
          if (val.trim() === "") return;
          updates[key] = val.trim();
        } else if (Array.isArray(val)) {
          if (val.length === 0) return;
          updates[key] = val;
        } else if (typeof val === "number") {
          // include numbers (could be 0)
          updates[key] = Number(val);
        } else {
          updates[key] = val;
        }
      };

      pushIf("display_name", profile.name);
      pushIf("email", profile.email);
      pushIf("location", profile.location);
      pushIf("legalName", profile.legalName);
      pushIf("qualifications", profile.qualifications);
      pushIf("specialty", profile.specialty);

      // fields: Save as structured object { expertise, languages }
      const fieldsObj = {
        expertise: Array.isArray(profile.fields) ? profile.fields : [],
        languages: Array.isArray(profile.languages) ? profile.languages : [],
      };
      // Only add if not empty? Or always add to allow clearing?
      // Let's always add if we are in this profile page, as it manages both.
      updates["fields"] = fieldsObj;

      if (profile.experience_months !== undefined && profile.experience_months !== null) {
        const num = Number(profile.experience_months);
        if (!Number.isNaN(num)) updates["experience_months"] = Math.floor(num);
      }

      if (profile.resumeUrl) pushIf("resume_url", profile.resumeUrl);

      // If updates is empty, nothing to save
      if (Object.keys(updates).length === 0) {
        setError("No changes to save.");
        setSaving(false);
        return;
      }

      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE}/editor/profile`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(updates),
      });

      const body = await res.json().catch(() => null);

      if (res.status === 401) {
        setUnauthorized(true);
        setError("Unauthorized. Please sign in to update profile.");
        setSaving(false);
        return;
      }

      if (!res.ok) {
        // If backend provides structured validation errors, surface them
        if (body?.errors && typeof body.errors === "object") {
          const parts: string[] = [];
          for (const [k, v] of Object.entries(body.errors)) {
            if (Array.isArray(v)) parts.push(`${k}: ${v.join(", ")}`);
            else parts.push(`${k}: ${String(v)}`);
          }
          const msg = `Validation failed: ${parts.join(" ; ")}`;
          console.warn("Profile save validation failed:", body);
          setError(msg);
          setSaving(false);
          return;
        }

        // fallback: a message string from the server
        const errMsg = body?.message || body?.error || `Failed to update profile (${res.status})`;
        console.warn("Profile save failed response:", body);
        setError(errMsg);
        setSaving(false);
        return;
      }

      // success
      if (body?.status === "success") {
        await fetchProfile();
        setIsEditing(false);
      } else {
        if (body?.message) setError(body.message);
        else setError("Failed to update profile: unexpected response");
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

    // client-side preview
    const url = URL.createObjectURL(file);
    setProfile((p) => (p ? { ...p, photo: url } : p));

    try {
      const token = getTokenFromStorage();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/author/profile/photo`, {
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

      const body = await res.json().catch(() => null);
      if (body?.success && body.photoUrl) {
        setProfile((p) => (p ? { ...p, photo: body.photoUrl } : p));
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
      setError("Error uploading photo");
    }
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setResumeFileName(file.name);
    setUploadingResume(true);
    setError(null);

    try {
      const token = getTokenFromStorage();
      const form = new FormData();
      form.append("resume", file);

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/editor/profile/resume`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: form,
      });

      if (res.status === 401) {
        setUnauthorized(true);
        setError("Unauthorized. Please sign in to upload resume.");
        setUploadingResume(false);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || "Failed to upload resume");
        setUploadingResume(false);
        return;
      }

      const body = await res.json().catch(() => null);
      if (body?.status === "success" && body.data?.resume_url) {
        setProfile((p) => (p ? { ...p, resumeUrl: body.data.resume_url } : p));
      } else {
        setError("Unexpected response from server");
      }
    } catch (err: any) {
      console.error("Error uploading resume:", err);
      setError(err?.message || "Network error when uploading resume");
    } finally {
      setUploadingResume(false);
    }
  };

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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-indigo-600" /> Editor Profile
          </h1>
          <p className="text-sm text-slate-500">
            Manage your public profile and account settings
          </p>
        </div>

        {!isEditing ? (
          <Button
            onClick={handleEditProfile}
            className="bg-indigo-600 text-white rounded-full px-4 flex items-center gap-2"
          >
            <Edit className="h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleSaveProfile}
              className="bg-green-600 text-white rounded-full px-4 flex items-center gap-2"
              disabled={saving}
            >
              💾 {saving ? "Saving..." : "Save Profile"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditing(false);
                fetchProfile();
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </motion.div>

      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded">
          {error}
        </div>
      )}

      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="rounded-2xl border">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative">
              <img
                src={profile?.photo || "/author.png"}
                alt="Editor"
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-indigo-500/40"
              />
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<FileText className="h-5 w-5" />} label="Articles Published" value={profile?.stats?.articles ?? 0} />
        <StatCard icon={<Eye className="h-5 w-5" />} label="Total Views" value={formatNumber(profile?.stats?.views)} />
        <StatCard icon={<Award className="h-5 w-5" />} label="Certificates" value={profile?.stats?.certificates ?? 0} />
        <StatCard icon={<Banknote className="h-5 w-5" />} label="Earnings" value={`$${formatNumber(profile?.stats?.earnings as any as number)}`} />
      </div>

      <div className="flex flex-wrap border-b gap-4 text-sm justify-center sm:justify-start">
        <TabBtn active={tab === "info"} onClick={() => setTab("info")} icon={<User size={14} />}>
          Personal Info
        </TabBtn>
        <TabBtn active={tab === "social"} onClick={() => setTab("social")} icon={<Link2 size={14} />}>
          Social Links
        </TabBtn>
        <TabBtn active={tab === "payout"} onClick={() => setTab("payout")} icon={<CreditCard size={14} />}>
          Payout Details
        </TabBtn>
        <TabBtn active={tab === "membership"} onClick={() => setTab("membership")} icon={<Crown size={14} />}>
          Membership
        </TabBtn>
      </div>

      {tab === "info" && (
        <PersonalInfoSection
          profile={profile ?? ({} as Profile)}
          isEditing={isEditing}
          onChange={(f, v) => updateField(f as any, v)}
          onSave={handleSaveProfile}
          onResumeChange={handleResumeChange}
          uploadingResume={uploadingResume}
          resumeFileName={resumeFileName}
        />
      )}
      {tab === "social" && <SocialLinksSection profile={profile ?? {}} isEditing={isEditing} onChange={(k, v) => {
        setProfile((p) => (p ? { ...p, socialLinks: { ...p.socialLinks, [k]: v } } : p));
      }} onSave={handleSaveProfile} />}
      {tab === "payout" && <PayoutSection profile={profile ?? {}} isEditing={isEditing} onChange={(k, v) => {
        setProfile((p) => (p ? { ...p, payoutDetails: { ...p.payoutDetails, [k]: v } } : p));
      }} onSave={handleSaveProfile} />}
      {tab === "membership" && <MembershipSection formatNumber={formatNumber} membership={profile?.membership} />}

      {unauthorized && (
        <div className="text-xs text-slate-600 mt-2">
          You are not signed in — some actions (edit/save) require signing in.
        </div>
      )}
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

function TagInput({ label, tags, disabled, onChange }: { label: string | React.ReactNode, tags: string[], disabled: boolean, onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput("");
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <div className={`w-full border rounded-xl px-2 py-2 text-xs flex flex-wrap gap-2 ${disabled ? "bg-slate-50 opacity-70" : "bg-white"}`}>
        {tags.map((tag, i) => (
          <span key={i} className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
            {tag}
            {!disabled && (
              <button onClick={() => removeTag(i)} className="hover:text-indigo-900"><XCircle size={12} /></button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            className="flex-1 outline-none min-w-[80px] bg-transparent"
            placeholder={tags.length === 0 ? "Type & press Enter..." : ""}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addTag}
          />
        )}
      </div>
    </div>
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

function PersonalInfoSection({ profile, isEditing, onChange, onSave, onResumeChange, uploadingResume, resumeFileName }:
  { profile: Profile; isEditing: boolean; onChange: (field: string, value: any) => void; onSave: () => void; onResumeChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; uploadingResume?: boolean; resumeFileName?: string | null }) {
  return (
    <Card className="rounded-2xl border">
      <CardContent className="p-5 grid gap-4">
        <h3 className="font-semibold text-base flex items-center gap-2"><User className="h-4 w-4 text-indigo-600" /> Personal Information</h3>

        <Field icon={<User size={14} />} label="Display Name" value={profile?.name || ""} editable={isEditing} onChange={v => onChange("name", v)} />
        <Field icon={<User size={14} />} label="Legal Name" value={profile?.legalName || ""} editable={isEditing} onChange={v => onChange("legalName", v)} />
        <Field icon={<Mail size={14} />} label="Email Address" value={profile?.email || ""} editable={isEditing} onChange={(v) => onChange("email", v)} />
        <Field icon={<MapPin size={14} />} label="Location" value={profile?.location || ""} editable={isEditing} onChange={v => onChange("location", v)} />
        <Field icon={<Tag size={14} />} label="Specialty" value={profile?.specialty || ""} editable={isEditing} onChange={v => onChange("specialty", v)} />

        {/* fields (comma separated) */}
        <div className="grid sm:grid-cols-2 gap-2">
          <div>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1"><BarChart3 size={12} /> Experience (months)</p>
            <input type="number" min={0} className="w-full border px-3 py-2 rounded-xl text-xs" value={profile?.experience_months ?? 0} disabled={!isEditing} onChange={e => onChange("experience_months", Number(e.target.value))} />
          </div>
          <div>
            <TagInput
              label={<span className="flex items-center gap-1"><Tag size={12} /> Expertise Fields</span>}
              tags={profile?.fields || []}
              disabled={!isEditing}
              onChange={(newTags) => onChange("fields", newTags)}
            />
          </div>
          <div className="col-span-2">
            <TagInput
              label={<span className="flex items-center gap-1"><Languages size={12} /> Languages Known</span>}
              tags={profile?.languages || []}
              disabled={!isEditing}
              onChange={(newTags) => onChange("languages", newTags)}
            />
          </div>
        </div>

        {/* Resume */}
        <div>
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1"><FileText size={12} /> Resume</p>
          <div className="flex items-center gap-2">
            {profile.resumeUrl ? (
              <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="text-xs underline">
                {resumeFileName ?? "View uploaded resume"}
              </a>
            ) : (
              <span className="text-xs text-slate-600">No resume uploaded</span>
            )}
            {isEditing && (
              <label className="ml-auto inline-flex items-center gap-2 cursor-pointer bg-indigo-600 text-white px-3 py-1 rounded-full text-xs">
                <Upload size={12} /> {uploadingResume ? "Uploading..." : "Upload Resume"}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onResumeChange} />
              </label>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Supported: PDF, DOC, DOCX — maximum size depends on backend limits.</p>
        </div>

        {isEditing && <Button onClick={onSave} className="w-fit mx-auto text-xs rounded-full bg-indigo-600 text-white px-4">Save Changes</Button>}
      </CardContent>
    </Card >
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
