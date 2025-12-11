"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PagingMode({ params }: { params?: { issueId?: string; chapterId?: string } }) {
  const pages = [
    `Page 1\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Donec non arcu sed justo tincidunt fermentum.`,
    `Page 2\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.`,
    `Page 3\n\nAt vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium.`,
    `Page 4\n\nNeque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.`,
  ];

  const issueKey = params?.issueId ? `reader_progress_issue_${params.issueId}` : "reader_progress_temp";

  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1); // For animation direction
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ---------------------------------------
  // LOAD LAST SAVED PAGE
  // ---------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem(issueKey);
    if (saved) setPageIndex(Number(saved));
  }, [issueKey]);

  // ---------------------------------------
  // SAVE PROGRESS
  // ---------------------------------------
  useEffect(() => {
    localStorage.setItem(issueKey, String(pageIndex));
  }, [pageIndex, issueKey]);

  // ---------------------------------------
  // PAGE TURN CONTROLS
  // ---------------------------------------
  const nextPage = () => {
    setDirection(1);
    setPageIndex((idx) => (idx < pages.length - 1 ? idx + 1 : idx));
  };

  const prevPage = () => {
    setDirection(-1);
    setPageIndex((idx) => (idx > 0 ? idx - 1 : idx));
  };

  // ---------------------------------------
  // KEYBOARD SUPPORT
  // ---------------------------------------
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ---------------------------------------
  // TOUCH SWIPE SUPPORT
  // ---------------------------------------
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;

    const diff = touchStartX.current - e.changedTouches[0].clientX;

    if (diff > 50) nextPage();
    if (diff < -50) prevPage();

    touchStartX.current = null;
  };

  // ---------------------------------------
  // CLICK ON PAGE EDGES
  // ---------------------------------------
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const width = e.currentTarget.clientWidth;
    const x = e.clientX;

    if (x < width * 0.25) prevPage();
    else if (x > width * 0.75) nextPage();
  };

  // ---------------------------------------
  // PAGE TURN ANIMATION
  // ---------------------------------------
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 200 : -200,
      opacity: 0,
      position: "absolute",
    }),
    center: {
      x: 0,
      opacity: 1,
      position: "relative",
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -200 : 200,
      opacity: 0,
      position: "absolute",
    }),
  };

  return (
    <div className="p-6 max-w-2xl mx-auto select-none">

      <h1 className="text-xl font-bold mb-4 text-center">Paging Mode</h1>

      {/* PAGE SELECTOR */}
      <div className="flex justify-center mb-3">
        <select
          value={pageIndex}
          onChange={(e) => setPageIndex(Number(e.target.value))}
          className="border rounded p-1 bg-white dark:bg-slate-900"
        >
          {pages.map((_, i) => (
            <option key={i} value={i}>
              Page {i + 1}
            </option>
          ))}
        </select>
      </div>

      {/* PAGE CONTAINER */}
      <div
        ref={containerRef}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="
          relative min-h-[350px] shadow border
          rounded-xl p-6 text-lg leading-relaxed
          whitespace-pre-line bg-white dark:bg-slate-900
          cursor-pointer overflow-hidden
        "
      >
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.div
            key={pageIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35 }}
          >
            {pages[pageIndex]}
          </motion.div>
        </AnimatePresence>

        {/* LEFT CLICK HINT */}
        <div className="absolute left-0 top-0 h-full w-1/4 opacity-0 hover:opacity-10 bg-black" />

        {/* RIGHT CLICK HINT */}
        <div className="absolute right-0 top-0 h-full w-1/4 opacity-0 hover:opacity-10 bg-black" />
      </div>

      {/* PROGRESS BAR */}
      <div className="mt-4">
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
          <div
            className="h-2 bg-indigo-600 rounded-full transition-all"
            style={{ width: `${((pageIndex + 1) / pages.length) * 100}%` }}
          ></div>
        </div>

        <p className="text-center text-sm mt-1">
          Page {pageIndex + 1} of {pages.length}
        </p>
      </div>

      {/* BUTTON CONTROLS */}
      <div className="flex justify-between mt-6">
        <button
          onClick={prevPage}
          disabled={pageIndex === 0}
          className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-700 disabled:opacity-40"
        >
          Previous
        </button>

        <button
          onClick={nextPage}
          disabled={pageIndex === pages.length - 1}
          className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
