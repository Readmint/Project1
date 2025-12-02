"use client";

import { useState } from "react";
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
  Clock3,
  FileText,
  DollarSign,
  Eye,
} from "lucide-react";

const mockProfile = {
  photo: "/author.png",
  name: "Premium Author",
  email: "author@example.com",
  location: "San Francisco, CA",
  tags: ["Technology", "AI", "Healthcare"],
  stats: {
    articles: 45,
    views: 127000,
    certificates: 8,
    earnings: 12500,
  },
  legalName: "Sarah Chen",
  bio: "Technology writer and AI researcher with 10+ years of experience",
  qualifications: "PhD AI, MSc Computer Science",
  specialty: "AI, Healthcare Tech, Future Systems",
};

export default function AuthorProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(mockProfile);
  const [tab, setTab] = useState<"info" | "social" | "payout" | "membership">("info");
  const [isEditing, setIsEditing] = useState(false);

  const formatNumber = (n?: number) => {
    if (n == null) return "-";
    return n >= 1000 ? `${Math.round(n / 1000)}K` : n.toString();
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setTab("info");
  };

  const handleSaveProfile = () => {
    alert("✅ Profile updated!");
    setIsEditing(false);
  };

  const updateField = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    setProfile(prev => ({ ...prev, photo: url }));
  };

  return (
    <div className="space-y-7 p-3 md:p-4">

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-indigo-600" /> Author Profile
          </h1>
          <p className="text-sm text-slate-500">Manage your public profile and account settings</p>
        </div>

        {!isEditing ? (
          <Button onClick={handleEditProfile} className="bg-indigo-600 text-white rounded-full px-4 flex items-center gap-2">
            <Edit className="h-4 w-4"/> Edit Profile
          </Button>
        ) : (
          <Button onClick={handleSaveProfile} className="bg-green-600 text-white rounded-full px-4 flex items-center gap-2">
            💾 Save Profile
          </Button>
        )}
      </motion.div>

      {/* AUTHOR PREVIEW */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="rounded-2xl border">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">

            <div className="relative">
              <img src={profile.photo} alt="Author" className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-indigo-500/40"/>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full cursor-pointer">
                  <Upload size={12}/>
                  <input type="file" className="hidden" onChange={handlePhotoChange}/>
                </label>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <h2 className="font-semibold text-lg">{profile.name}</h2>
              <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm text-slate-600">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3"/> {profile.email}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {profile.location}</span>
              </div>
            </div>

          </CardContent>
        </Card>
      </motion.div>

      {/* STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<FileText className="h-5 w-5"/>} label="Articles Published" value={profile.stats.articles}/>
        <StatCard icon={<Eye className="h-5 w-5"/>} label="Total Views" value={formatNumber(profile.stats.views)}/>
        <StatCard icon={<Award className="h-5 w-5"/>} label="Certificates" value={profile.stats.certificates}/>
        <StatCard icon={<Banknote className="h-5 w-5"/>} label="Earnings" value={`$${formatNumber(profile.stats.earnings)}`}/>
      </div>

      {/* TAB SELECT */}
      <div className="flex flex-wrap border-b gap-4 text-sm justify-center sm:justify-start">
        <TabBtn active={tab==="info"} onClick={()=>setTab("info")} icon={<User size={14}/>}>Personal Info</TabBtn>
        <TabBtn active={tab==="social"} onClick={()=>setTab("social")} icon={<Link2 size={14}/>}>Social Links</TabBtn>
        <TabBtn active={tab==="payout"} onClick={()=>setTab("payout")} icon={<CreditCard size={14}/>}>Payout Details</TabBtn>
        <TabBtn active={tab==="membership"} onClick={()=>setTab("membership")} icon={<Crown size={14}/>}>Membership</TabBtn>
      </div>

      {/* TAB CONTENT */}
      {tab === "info" && <PersonalInfoSection profile={profile} isEditing={isEditing} onChange={updateField} onSave={handleSaveProfile}/>}
      {tab === "social" && <SocialLinksSection onSave={handleSaveProfile}/>}
      {tab === "payout" && <PayoutSection onSave={handleSaveProfile}/>}
      {tab === "membership" && <MembershipSection formatNumber={formatNumber}/>}

    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <motion.div whileHover={{ y: -2 }}>
      <Card className="rounded-2xl border">
        <CardContent className="p-4 flex justify-between items-center">
          <div className="text-right flex-1">
            <p className="text-[10px] text-slate-500">{label}</p>
            <p className="text-lg sm:text-xl font-semibold">{value}</p>
          </div>
          <div className="ml-2 p-2 rounded-full bg-indigo-50 text-indigo-600">
            {icon}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick:()=>void; icon:React.ReactNode; children:React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 pb-1 ${active ? "border-b-2 border-indigo-600 font-medium" : "text-slate-600"}`}
    >
      {icon} {children}
    </button>
  );
}

function Field({ icon, label, value, editable = false, onChange }: { icon: React.ReactNode; label: string; value: string; editable?: boolean; onChange?: (value: string) => void; }) {
  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm">
      <span className="text-indigo-600">{icon}</span>
      <label className="w-32 text-left font-medium text-slate-600 text-xs">{label}</label>
      {editable ? (
        <input className="flex-1 border px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900" value={value} onChange={e=>onChange?.(e.target.value)}/>
      ):(
        <span className="text-slate-800 text-xs">{value}</span>
      )}
    </div>
  );
}

function PersonalInfoSection({ profile, isEditing, onChange, onSave }: { profile: typeof mockProfile; isEditing: boolean; onChange: (field: string, value: string) => void; onSave: () => void }) {
  return (
    <Card className="rounded-2xl border">
      <CardContent className="p-5 grid gap-4">
        <h3 className="font-semibold text-base flex items-center gap-2"><User className="h-4 w-4 text-indigo-600"/> Personal Information</h3>

        <Field icon={<User size={14}/>} label="Display Name" value={profile.name} editable={isEditing} onChange={v=>onChange("name",v)}/>
        <Field icon={<User size={14}/>} label="Legal Name" value={profile.legalName} editable={isEditing} onChange={v=>onChange("legalName",v)}/>
        <Field icon={<Mail size={14}/>} label="Email Address" value={profile.email}/>
        <Field icon={<MapPin size={14}/>} label="Location" value={profile.location} editable={isEditing} onChange={v=>onChange("location",v)}/>
        <Field icon={<Tag size={14}/>} label="Specialty" value={profile.specialty} editable={isEditing} onChange={v=>onChange("specialty",v)}/>
        
        <div>
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1"><FileText size={12}/> Bio</p>
          <textarea className="w-full border rounded-xl p-3 text-xs bg-slate-50 dark:bg-slate-900 min-h-[70px]" value={profile.bio} disabled={!isEditing} onChange={e=>onChange("bio", e.target.value)}/>
        </div>

        {isEditing && <Button onClick={onSave} className="w-fit mx-auto text-xs rounded-full bg-indigo-600 text-white px-4">Save Changes</Button>}
      </CardContent>
    </Card>
  );
}

function SocialLinksSection({ onSave }: { onSave:()=>void }) {
  return (
    <Card className="rounded-2xl border">
      <CardContent className="p-4 grid gap-3">
        <h3 className="font-semibold text-center flex items-center justify-center gap-1">🌐 Social & Portfolio Links</h3>
        <input placeholder="Twitter URL" className="border px-3 py-2 rounded-xl text-xs"/>
        <input placeholder="LinkedIn URL" className="border px-3 py-2 rounded-xl text-xs"/>
        <input placeholder="Portfolio Website" className="border px-3 py-2 rounded-xl text-xs"/>
        <Button onClick={onSave} className="w-fit mx-auto mt-3 text-xs rounded-full bg-indigo-600 text-white">
          Save Links
        </Button>
      </CardContent>
    </Card>
  );
}

function PayoutSection({ onSave }: { onSave:()=>void }) {
  return (
    <Card className="rounded-2xl border">
      <CardContent className="p-4 grid gap-3">
        <h3 className="font-semibold text-center">💳 Payout Details</h3>
        <input placeholder="Bank Name" className="border px-3 py-2 rounded-xl text-xs"/>
        <input placeholder="Account Holder" className="border px-3 py-2 rounded-xl text-xs"/>
        <input placeholder="Account Number" className="border px-3 py-2 rounded-xl text-xs"/>
        <input placeholder="IFSC/SWIFT Code" className="border px-3 py-2 rounded-xl text-xs"/>
        <Button onClick={onSave} className="w-fit mx-auto text-xs rounded-full bg-emerald-600 text-white px-4 mt-2">Save Payout Info</Button>
      </CardContent>
    </Card>
  );
}

function MembershipSection({ formatNumber }:{ formatNumber:(n?:number)=>string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="rounded-2xl border bg-indigo-50 dark:bg-indigo-900/30">
        <CardContent className="p-4 grid gap-3 text-center">
          <h3 className="font-semibold flex justify-center items-center gap-1"><Crown size={16} className="text-indigo-600"/> Premium Author Plan</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Card className="rounded-xl p-3 border"><p className="text-xl font-semibold">$19.99</p><p className="text-[10px] text-slate-500">Monthly Price</p></Card>
            <Card className="rounded-xl p-3 border"><p className="text-sm font-semibold">Dec 15, 2025</p><p className="text-[10px] text-slate-500">Renewal Date</p></Card>
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