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
  MessageSquare,
  BookOpen,
  ScrollText,
  Layers
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

  // ✅ NEW READING PREFERENCES DEFAULTS
  inlineComments: true,
  statusBar: true,
  readingMode: "scrolling" as "scrolling" | "paging",
  readingStyle: "vertical" as "vertical" | "horizontal"
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

  // ✅ Preferential State
  const [inlineComments, setInlineComments] = useState(defaultSettings.inlineComments);
  const [statusBar, setStatusBar] = useState(defaultSettings.statusBar);
  const [readingMode, setReadingMode] = useState<"scrolling" | "paging">(defaultSettings.readingMode);
  const [readingStyle, setReadingStyle] = useState<"vertical" | "horizontal">(defaultSettings.readingStyle);

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

        // ✅ Load reading preferences too
        setInlineComments(s.inlineComments ?? inlineComments);
        setStatusBar(s.statusBar ?? statusBar);
        setReadingMode(s.readingMode ?? readingMode);
        setReadingStyle(s.readingStyle ?? readingStyle);
      } catch {}
    }
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Save settings
  const saveSettings = () => {
    const s = { 
      fontSize, fontFamily, theme, lineHeight, letterSpacing, contentWidth, disableAnimations,

      // ✅ Include new reading preferences
      inlineComments, statusBar, readingMode, readingStyle 
    };
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

    // ✅ Reset reading preferences
    setInlineComments(defaultSettings.inlineComments);
    setStatusBar(defaultSettings.statusBar);
    setReadingMode(defaultSettings.readingMode);
    setReadingStyle(defaultSettings.readingStyle);

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

        {/* FONT */}
        <Card className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-800">
          <CardContent className="space-y-4 p-0">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Type size={16} className="text-indigo-600"/> Font Preferences
            </h3>

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
            </div>

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

        {/* READING PREFERENCES ✅ NEW SECTION */}
        <Card className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-800">
          <CardContent className="space-y-5 p-0">
            <h3 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <BookOpen size={16}/> Reading Preferences
            </h3>

            {/* Inline Comments */}
            <label className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-xs font-medium cursor-pointer">
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-300">
                <MessageSquare size={14}/> Inline Comments
              </span>
              <input type="checkbox" checked={inlineComments} onChange={() => setInlineComments(!inlineComments)} />
            </label>

            {/* Status Bar */}
            <label className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-xs font-medium cursor-pointer">
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-300">
                <Layers size={14}/> Show Progress Bar
              </span>
              <input type="checkbox" checked={statusBar} onChange={e => setStatusBar(e.target.checked)} />
            </label>

            {/* Reading Mode */}
            <div>
              <p className="text-xs font-medium mb-1 flex items-center gap-1 text-indigo-600 dark:text-indigo-300">
                <ScrollText size={14}/> Reading Mode
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={() => setReadingMode("scrolling")}
                  variant={readingMode === "scrolling" ? "default" : "outline"}
                  className={readingMode === "scrolling" ? "bg-indigo-600 text-white text-xs flex items-center gap-1" : "text-xs flex items-center gap-1"}
                >
                  <ScrollText size={14}/> Scrolling
                </Button>

                <Button
                  onClick={() => setReadingMode("paging")}
                  variant={readingMode === "paging" ? "default" : "outline"}
                  className={readingMode === "paging" ? "bg-indigo-600 text-white text-xs flex items-center gap-1" : "text-xs flex items-center gap-1"}
                >
                  <Layers size={14}/> Paging
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card className="p-6 rounded-2xl border text-center">
        <h3 className="text-sm font-semibold mb-3 flex justify-center items-center gap-1 text-indigo-600">
          <Sparkles size={14}/> Live Preview
        </h3>
        <div
          style={{
            fontSize: fontSize + "px",
            fontFamily,
            lineHeight,
            letterSpacing: letterSpacing + "px",
            maxWidth: contentWidth,
          }}
          className="mx-auto bg-white dark:bg-slate-800 border p-5 rounded-xl shadow-sm"
        >
          <h4 className="text-xl font-bold mb-2">Sample Heading</h4>
          <p className="text-xs leading-relaxed">
            This preview reflects how magazine content text will appear based on your selected typography preferences.
          </p>

          {/* ✅ Conditional progress bar preview */}
          {statusBar && (
            <div className="w-full bg-slate-300 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
              <motion.div
                animate={{ width: `${fontSize * 4}%` }}
                className="bg-indigo-600 h-full"
                transition={{duration:0.5}}
              />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
