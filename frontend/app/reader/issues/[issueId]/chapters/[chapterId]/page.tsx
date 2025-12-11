"use client";

import ScrollMode from "./ScrollMode";
import PagingMode from "./PagingMode";

interface ChapterReaderPageProps {
  params: {
    issueId: string;
    chapterId: string;
  };
  searchParams: {
    mode?: "scroll" | "paging";
  };
}

export default function ChapterReaderPage({ params, searchParams }: ChapterReaderPageProps) {
  const mode = searchParams.mode || "scroll";

  return mode === "paging" ? (
    <PagingMode /> // <-- FIXED
  ) : (
    <ScrollMode params={params} />
  );
}
