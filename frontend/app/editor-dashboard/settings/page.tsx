"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Bell,
  Globe,
  Lock,
  Wrench,
  Sparkles,
  RefreshCcw,
  ShieldCheck,
  CheckCircle2,
  Zap,
  XCircle,
} from "lucide-react";

const defaultSettings = {
  emailAlerts: true,
  assignmentUpdates: true,
  messageAlerts: false,

  language: "English",
  autosave: true,

  aiSuggestions: true,
  grammarEnhancer: true,
  autoFormatting: true,
  seoHelper: false,

  twoFactorAuth: false,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [savedMessage, setSavedMessage] = useState("");

  /* LOAD SETTINGS */
  useEffect(() => {
    const raw = localStorage.getItem("editor-settings");
    if (raw) {
      try {
        setSettings(JSON.parse(raw));
      } catch {}
    }
  }, []);

  /* SAVE SETTINGS */
  const saveSettings = () => {
    localStorage.setItem("editor-settings", JSON.stringify(settings));
    setSavedMessage("Settings saved!");
    setTimeout(() => setSavedMessage(""), 2000);
  };

  /* RESET SETTINGS */
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem("editor-settings", JSON.stringify(defaultSettings));
    setSavedMessage("Reset to defaults");
    setTimeout(() => setSavedMessage(""), 2000);
  };

  /* HANDLER */
  const update = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-6 max-w-5xl mx-auto text-slate-900 dark:text-slate-100"
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="text-indigo-600 h-6" /> Editor Settings
          </h1>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Manage notifications, tools, preferences, and security.
          </p>
          {savedMessage && (
            <p className="text-xs text-indigo-600 font-medium mt-1">
              {savedMessage}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetSettings}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCcw size={13} /> Reset
          </Button>
          <Button
            onClick={saveSettings}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs rounded-xl flex items-center gap-2"
          >
            <CheckCircle2 size={14} /> Save Changes
          </Button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ------------------------------------------- */}
        {/* NOTIFICATIONS */}
        {/* ------------------------------------------- */}
        <Card className="rounded-2xl border bg-slate-50 dark:bg-slate-800 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Bell size={14} className="text-indigo-600" /> Notifications
            </h3>

            <ToggleItem
              label="Email Alerts"
              value={settings.emailAlerts}
              onChange={(v) => update("emailAlerts", v)}
            />

            <ToggleItem
              label="Assignment Updates"
              value={settings.assignmentUpdates}
              onChange={(v) => update("assignmentUpdates", v)}
            />

            <ToggleItem
              label="New Message Alerts"
              value={settings.messageAlerts}
              onChange={(v) => update("messageAlerts", v)}
            />

            <ToggleItem
              label="Autosave Drafts"
              value={settings.autosave}
              onChange={(v) => update("autosave", v)}
            />
          </CardContent>
        </Card>

        {/* ------------------------------------------- */}
        {/* LANGUAGE + PERSONALIZATION */}
        {/* ------------------------------------------- */}
        <Card className="rounded-2xl border bg-slate-50 dark:bg-slate-800 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Globe size={14} className="text-indigo-600" /> Language & Locale
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-medium">Language</label>
              <select
                value={settings.language}
                onChange={(e) => update("language", e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border rounded-xl p-3 text-xs"
              >
                <option>English</option>
                <option>Spanish</option>
                <option>German</option>
                <option>French</option>
                <option>Japanese</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 mt-2">
              Your dashboard and editor tools will adjust to your preferred
              language.
            </div>
          </CardContent>
        </Card>

        {/* ------------------------------------------- */}
        {/* EDITOR TOOLS */}
        {/* ------------------------------------------- */}
        <Card className="rounded-2xl border bg-slate-50 dark:bg-slate-800 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Wrench size={14} className="text-indigo-600" /> Editing Tools
            </h3>

            <ToggleItem
              label="AI Suggestions"
              value={settings.aiSuggestions}
              onChange={(v) => update("aiSuggestions", v)}
            />

            <ToggleItem
              label="Grammar Enhancer"
              value={settings.grammarEnhancer}
              onChange={(v) => update("grammarEnhancer", v)}
            />

            <ToggleItem
              label="Auto Formatting"
              value={settings.autoFormatting}
              onChange={(v) => update("autoFormatting", v)}
            />

            <ToggleItem
              label="SEO Helper"
              value={settings.seoHelper}
              onChange={(v) => update("seoHelper", v)}
            />
          </CardContent>
        </Card>

        {/* ------------------------------------------- */}
        {/* SECURITY SETTINGS */}
        {/* ------------------------------------------- */}
        <Card className="rounded-2xl border bg-slate-50 dark:bg-slate-800 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck size={14} className="text-indigo-600" /> Security
            </h3>

            <ToggleItem
              label="Two-Factor Authentication"
              value={settings.twoFactorAuth}
              onChange={(v) => update("twoFactorAuth", v)}
            />

            <div className="space-y-2">
              <label className="text-xs font-medium">Change Password</label>
              <input
                type="password"
                placeholder="Current password"
                className="w-full bg-white dark:bg-slate-900 border rounded-xl p-2 text-xs"
              />
              <input
                type="password"
                placeholder="New password"
                className="w-full bg-white dark:bg-slate-900 border rounded-xl p-2 text-xs"
              />
            </div>

            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-full mt-2 px-4 py-1.5">
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------- */}
      {/* PREVIEW */}
      {/* ------------------------------------------- */}
      <Card className="rounded-2xl border shadow-sm p-5 mt-8 text-center">
        <h3 className="text-sm font-semibold flex justify-center gap-1 items-center">
          <Zap size={14} /> Live Preview (Tools Enabled)
        </h3>

        <div className="mt-3 bg-white dark:bg-slate-800 border p-4 rounded-xl shadow-sm text-xs">
          <p>🔧 AI Suggestions: {settings.aiSuggestions ? "Enabled" : "Disabled"}</p>
          <p>📝 Auto Formatting: {settings.autoFormatting ? "Enabled" : "Disabled"}</p>
          <p>✔ Grammar Enhancer: {settings.grammarEnhancer ? "Enabled" : "Disabled"}</p>
          <p>📈 SEO Helper: {settings.seoHelper ? "Enabled" : "Disabled"}</p>
        </div>
      </Card>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------
   REUSABLE COMPONENT
--------------------------------------------------------------------- */
function ToggleItem({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border bg-white dark:bg-slate-900 rounded-xl p-3 text-xs">
      <span>{label}</span>
      <button onClick={() => onChange(!value)}>
        {value ? (
          <CheckCircle2 size={18} className="text-green-600" />
        ) : (
          <XCircle size={18} className="text-red-600" />
        )}
      </button>
    </div>
  );
}
