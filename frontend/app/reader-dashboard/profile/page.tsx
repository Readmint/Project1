"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Upload,
  Edit2,
  Save,
  Clock,
  CreditCard,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

interface ReaderProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  bio: string;
}

const defaultProfile: ReaderProfile = {
  name: "Aditya Sharma",
  email: "aditya@example.com",
  phone: "+91 870 888 6307",
  location: "Delhi, India",
  avatar: "/images/user-avatar.jpg",
  bio: "Passionate reader exploring technology, culture, and world affairs.",
};

export default function ReaderProfilePage() {
  const [profile, setProfile] = useState(defaultProfile);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultProfile);
  const [readingHours, setReadingHours] = useState("12 hrs");

  const [subscriptionModal, setSubscriptionModal] = useState(false);

  const [subscription, setSubscription] = useState({
    plan: "Premium Monthly",
    price: "₹199/month",
    nextBilling: "March 21, 2025",
    cardLast4: "7823",
    status: "Active",
  });

  const billingHistory = [
    { id: 1, date: "Feb 21, 2025", amount: "₹199", status: "Paid" },
    { id: 2, date: "Jan 21, 2025", amount: "₹199", status: "Paid" },
    { id: 3, date: "Dec 21, 2024", amount: "₹199", status: "Paid" },
  ];

  useEffect(() => {
    const stored = localStorage.getItem("reader_profile");
    if (stored) {
      const parsed = JSON.parse(stored);
      setProfile(parsed);
      setForm(parsed);
    }

    const hours = localStorage.getItem("reader_reading_hours");
    if (hours) setReadingHours(hours);
  }, []);

  const handleInput = (key: keyof ReaderProfile, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const saveProfile = () => {
    setProfile(form);
    setEditMode(false);
    localStorage.setItem("reader_profile", JSON.stringify(form));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = event.target?.result as string;
      const updated = { ...form, avatar: img };
      setForm(updated);
      setProfile(updated);
      localStorage.setItem("reader_profile", JSON.stringify(updated));
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-6 py-16">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 flex justify-center items-center gap-2"
          >
            <User size={28} /> Reader Profile
          </motion.h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Manage your personal information and reading identity.
          </p>
        </div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <Card className="bg-white dark:bg-slate-800 shadow-lg rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <CardContent className="p-8 space-y-6">

              {/* Avatar */}
              <div className="flex flex-col items-center pb-2">
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-indigo-600 dark:border-indigo-400">
                  <Image src={profile.avatar} alt={profile.name} fill className="object-cover" />
                </div>

                {/* Upload button ONLY in edit mode */}
                {editMode && (
                  <div className="mt-3">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <div className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-full shadow">
                        <Upload size={13} /> Change Photo
                      </div>
                    </label>
                  </div>
                )}

                {!editMode ? (
                  <>
                    <h2 className="text-2xl font-bold mt-4">{profile.name}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin size={11} /> {profile.location}
                    </p>
                  </>
                ) : (
                  <input
                    className="mt-5 text-center bg-slate-100 dark:bg-slate-900 border border-indigo-600 dark:border-indigo-400 rounded-full text-sm py-1.5 px-3 w-52"
                    value={form.name}
                    onChange={e => handleInput("name", e.target.value)}
                  />
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                {!editMode ? (
                  <>
                    <ProfileRow icon={<Mail size={15} />} label="Email" value={profile.email} />
                    <ProfileRow icon={<Phone size={15} />} label="Phone" value={profile.phone} />
                    <ProfileRow icon={<MapPin size={15} />} label="Location" value={profile.location} />
                  </>
                ) : (
                  <>
                    <EditableRow label="Email" value={form.email} onChange={(v: string) => handleInput("email", v)} />
                    <EditableRow label="Phone" value={form.phone} onChange={(v: string) => handleInput("phone", v)} />
                    <EditableRow label="Location" value={form.location} onChange={(v: string) => handleInput("location", v)} />
                  </>
                )}
              </div>

              {/* Reading Hours */}
              {!editMode && (
                <div className="flex justify-between items-center text-sm px-4 bg-slate-100 dark:bg-slate-900 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 text-xs">
                    <Clock size={13} />
                    <span className="font-medium">Reading Time</span>
                  </div>
                  <span className="text-xs font-semibold">{readingHours}</span>
                </div>
              )}

              {/* Bio */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-5 text-center">
                {!editMode ? (
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {profile.bio}
                  </p>
                ) : (
                  <textarea
                    className="w-full text-xs bg-slate-100 dark:bg-slate-900 border p-3 rounded-2xl min-h-[90px]"
                    value={form.bio}
                    onChange={e => handleInput("bio", e.target.value)}
                  />
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col items-center gap-3 pt-3">
                {!editMode ? (
                  <Button
                    onClick={() => setEditMode(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-6 flex items-center gap-2"
                  >
                    <Edit2 size={14} /> Edit Profile
                  </Button>
                ) : (
                  <Button
                    onClick={saveProfile}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full text-xs px-6 flex items-center gap-2"
                  >
                    <Save size={14} /> Save Changes
                  </Button>
                )}

                <Button
                  onClick={() => setSubscriptionModal(true)}
                  className="bg-slate-900 hover:bg-slate-700 text-white rounded-full text-xs px-6 flex items-center gap-2"
                >
                  <CreditCard size={14} /> Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* SUBSCRIPTION MODAL */}
      <SubscriptionModal
        open={subscriptionModal}
        onClose={() => setSubscriptionModal(false)}
        subscription={subscription}
        billing={billingHistory}
      />
    </div>
  );
}

/* ------------------------- COMPONENTS ------------------------- */

function ProfileRow({ icon, label, value }: any) {
  return (
    <div className="flex justify-between items-center text-sm px-4 bg-slate-100 dark:bg-slate-900 py-2 rounded-full border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 text-xs">
        {icon} <span className="font-medium">{label}</span>
      </div>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

function EditableRow({ label, value, onChange }: any) {
  return (
    <div className="flex justify-between items-center text-sm px-5 py-2 rounded-full border border-indigo-600 dark:border-indigo-400 bg-slate-100 dark:bg-slate-900">
      <span className="text-indigo-600 dark:text-indigo-300 font-medium text-xs">{label}</span>
      <input
        className="text-right bg-transparent outline-none text-xs font-semibold w-40"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* ------------------------- SUBSCRIPTION MODAL ------------------------- */

function SubscriptionModal({ open, onClose, subscription, billing }: any) {
  if (!open) return null;

  return (
    <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <motion.div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl border border-slate-300 dark:border-slate-700 p-6 space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CreditCard size={16} /> Subscription & Billing
          </h2>
          <button onClick={onClose}>
            <X size={18} className="text-slate-500 hover:text-red-500" />
          </button>
        </div>

        {/* Plan */}
        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold">{subscription.plan}</p>
          <p className="text-xs text-slate-500">{subscription.price}</p>

          <div className="flex justify-between items-center mt-3 text-xs">
            <span className="flex items-center gap-1">
              <Clock size={12} /> Next Billing:
            </span>
            <span>{subscription.nextBilling}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Payment Method</h3>

          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CreditCard size={18} className="text-indigo-600" />
              <span className="text-xs">•••• •••• •••• {subscription.cardLast4}</span>
            </div>

            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] rounded-full px-3 py-1">
              Update Card
            </Button>
          </div>
        </div>

        {/* Billing History */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Billing History</h3>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {billing.map((b: any) => (
                  <tr key={b.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-2">{b.date}</td>
                    <td className="p-2">{b.amount}</td>
                    <td className="p-2">{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <Button className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-full px-4 py-1.5">
            Cancel Subscription
          </Button>

          <Button className="bg-green-600 hover:bg-green-700 text-white text-xs rounded-full px-4 py-1.5">
            Renew / Change Plan
          </Button>
        </div>

      </motion.div>
    </motion.div>
  );
}
