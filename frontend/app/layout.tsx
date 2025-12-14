import { CartProvider } from "@/context/CartContext";
import { Toaster } from "sonner";
import Navbar from "@/components/layout/Navbar";
import type { ReactNode } from "react";
import "./globals.css";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import Footer from "@/components/layout/Footer";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bubble-bg" suppressHydrationWarning>
      <body className="bubble-bg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        <CartProvider>
          <Navbar />
          {children}
          {/* Floating WhatsApp Support Button */}
          <WhatsAppButton />
          <Footer />
          <Toaster position="top-center" />
        </CartProvider>
      </body>
    </html>
  );
}