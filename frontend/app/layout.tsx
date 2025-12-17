import { CartProvider } from "@/context/CartContext";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/context/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import type { ReactNode } from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import Script from "next/script";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import Footer from "@/components/layout/Footer";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        <LanguageProvider>
          <CartProvider>
            <Navbar />
            <div id="google_translate_element" className="fixed bottom-4 right-4 z-50 opacity-0 pointer-events-none h-0 w-0 overflow-hidden"></div>
            <Script
              id="google-translate-script"
              strategy="afterInteractive"
              src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
            />
            <Script id="google-translate-init" strategy="afterInteractive">
              {`
                function googleTranslateElementInit() {
                  new google.translate.TranslateElement({
                    pageLanguage: 'en',
                    autoDisplay: false,
                  }, 'google_translate_element');
                }
              `}
            </Script>
            <main className="min-h-screen pb-20">{children}</main>
            <WhatsAppButton />
            <Toaster richColors position="top-center" />
            <Footer />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}