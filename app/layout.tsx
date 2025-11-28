import Navbar from "@/src/components/layout/Navbar";
import type { ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bubble-bg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        <Navbar />
        {children}
      </body>
    </html>
  );
}