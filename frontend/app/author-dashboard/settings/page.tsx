"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Type,
  Text,
  Ruler,
  Zap,
  RefreshCcw,
  Moon,
  Sun,
  Settings2,
  Sparkles,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";

type FontFamily = "Inter" | "Roboto" | "Merriweather" | "Poppins";

const defaultSettings = {
  fontSize: 16,
  fontFamily: "Inter" as FontFamily,
  theme: "light",
  lineHeight: 1.6,
  letterSpacing: 0,
  contentWidth: 700,
  disableAnimations: false,
};

export default function UISettingsPage() {
  const [fontSize, setFontSize] = useState(defaultSettings.fontSize);
  const [fontFamily, setFontFamily] = useState<FontFamily>(defaultSettings.fontFamily);
  const [theme, setTheme] = useState(defaultSettings.theme);
  const [lineHeight, setLineHeight] = useState(defaultSettings.lineHeight);
  const [letterSpacing, setLetterSpacing] = useState(defaultSettings.letterSpacing);
  const [contentWidth, setContentWidth] = useState(defaultSettings.contentWidth);
  const [disableAnimations, setDisableAnimations] = useState(defaultSettings.disableAnimations);
  const [saved, setSaved] = useState("");

  // Load settings
  useEffect(() => {
    const raw = localStorage.getItem("ui-settings");
    if (raw) {
      try {
        const s = JSON.parse(raw);
        setFontSize(s.fontSize ?? defaultSettings.fontSize);
        setFontFamily(s.fontFamily ?? defaultSettings.fontFamily);
        setTheme(s.theme ?? defaultSettings.theme);
        setLineHeight(s.lineHeight ?? defaultSettings.lineHeight);
        setLetterSpacing(s.letterSpacing ?? defaultSettings.letterSpacing);
        setContentWidth(s.contentWidth ?? defaultSettings.contentWidth);
        setDisableAnimations(s.disableAnimations ?? defaultSettings.disableAnimations);
      } catch {}
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Save
  const saveSettings = () => {
    const s = { fontSize, fontFamily, theme, lineHeight, letterSpacing, contentWidth, disableAnimations };
    localStorage.setItem("ui-settings", JSON.stringify(s));
    setSaved("✅ Preferences saved!");
    setTimeout(() => setSaved(""), 2000);
  };

  const reset = () => {
    localStorage.setItem("ui-settings", JSON.stringify(defaultSettings));
    setFontSize(defaultSettings.fontSize);
    setFontFamily(defaultSettings.fontFamily);
    setTheme(defaultSettings.theme);
    setLineHeight(defaultSettings.lineHeight);
    setLetterSpacing(defaultSettings.letterSpacing);
    setContentWidth(defaultSettings.contentWidth);
    setDisableAnimations(defaultSettings.disableAnimations);
    setSaved("🔁 Reset to defaults");
    setTimeout(() => setSaved(""), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: disableAnimations ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6"
    >
      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="h-5 text-indigo-600"/> UI Settings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Customize the reading and visual experience in your dashboard
          </p>
          {saved && <p className="text-xs text-indigo-600 mt-1">{saved}</p>}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} className="flex items-center gap-1 text-xs">
            <RefreshCcw size={14}/> Reset
          </Button>
          <Button onClick={saveSettings} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-1">
            <Palette size={14}/> Save
          </Button>
        </div>
      </div>

      {/* SETTINGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* FONT PREFERENCES */}
        <Card className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-800">
          <CardContent className="space-y-4 p-0">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Type size={16} className="text-indigo-600"/> Font Preferences
            </h3>

            {/* Font family */}
            <div>
              <label className="text-xs font-medium">Font Family</label>
              <select
                value={fontFamily}
                onChange={e => setFontFamily(e.target.value as FontFamily)}
                className="w-full mt-1 border bg-white dark:bg-slate-900 text-xs p-3 rounded-xl"
              >
                <option>Inter</option>
                <option>Roboto</option>
                <option>Merriweather</option>
                <option>Poppins</option>
              </select>
            </div>

            {/* Font size */}
            <div>
              <label className="text-xs font-medium flex items-center gap-1">
                <Text size={13}/> Font Size ({fontSize}px)
              </label>
              <input
                type="range"
                min={12}
                max={24}
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>12px</span>
                <span>24px</span>
              </div>
            </div>

            {/* Line Height */}
            <div>
              <label className="text-xs font-medium flex items-center gap-1">
                <Ruler size={13}/> Line Spacing ({lineHeight})
              </label>
              <input
                type="range"
                min={1}
                max={2}
                step={0.1}
                value={lineHeight}
                onChange={e => setLineHeight(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            {/* Letter spacing */}
            <div>
              <label className="text-xs font-medium">Letter Spacing ({letterSpacing}px)</label>
              <input
                type="range"
                min={-1}
                max={2}
                step={0.2}
                value={letterSpacing}
                onChange={e => setLetterSpacing(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* APPEARANCE */}
        <Card className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-800">
          <CardContent className="space-y-4 p-0">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Palette size={16} className="text-indigo-600"/> Appearance
            </h3>

            {/* Theme */}
            <div>
              <label className="text-xs font-medium flex items-center gap-1">
                <Moon size={12}/> Theme
              </label>
              <div className="flex gap-2 mt-1">
                <Button
                  onClick={() => setTheme("light")}
                  variant={theme === "light" ? "default" : "outline"}
                  className={theme === "light" ? "bg-indigo-600 text-white text-xs" : "text-xs"}
                >
                  <Sun size={14}/> Light
                </Button>
                <Button
                  onClick={() => setTheme("dark")}
                  variant={theme === "dark" ? "default" : "outline"}
                  className={theme === "dark" ? "bg-indigo-600 text-white text-xs" : "text-xs"}
                >
                  <Moon size={14}/> Dark
                </Button>
              </div>
            </div>

            {/* Content width */}
            <div>
              <label className="text-xs font-medium">Reader Mode Width ({contentWidth}px)</label>
              <input
                type="range"
                min={500}
                max={900}
                step={50}
                value={contentWidth}
                onChange={e => setContentWidth(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            {/* Toggle Animations */}
            <div className="flex items-center justify-between border rounded-xl bg-white dark:bg-slate-900 text-xs p-3">
              <div className="flex items-center gap-1">
                <Sparkles size={14}/> Smooth Animations
              </div>
              <button onClick={() => setDisableAnimations(!disableAnimations)}>
                <XCircle size={18} className={disableAnimations ? "text-red-600" : "text-indigo-600"} />
              </button>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* LIVE PREVIEW CARD */}
      <Card className="p-5 rounded-2xl shadow-sm border text-center">
        <h3 className="text-sm font-semibold mb-2 flex justify-center items-center gap-1">
          <Zap size={14}/> Live Preview
        </h3>
        <div
          style={{ fontSize: fontSize+"px", fontFamily, lineHeight, letterSpacing: letterSpacing+"px", maxWidth: contentWidth }}
          className="mx-auto bg-white dark:bg-slate-800 border p-4 rounded-xl shadow-sm"
        >
          <h1 className="font-bold">This is how your article text will appear</h1>
          <p className="mt-2">Digital magazine readers prefer clean typography and spacing for comfortable reading.</p>
        </div>
      </Card>

    </motion.div>
  );
}
