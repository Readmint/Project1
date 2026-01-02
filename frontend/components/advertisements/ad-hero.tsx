"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdHero({
  onContactSales,
}: {
  onContactSales: () => void;
}) {
  const router = useRouter();

  return (
    <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-bold text-foreground mb-4"
      >
        Advertise With Us
      </motion.h1>

      <p className="max-w-2xl mx-auto text-muted-foreground text-lg mb-10">
        Partner with a premium editorial platform to tell your brand story with
        authenticity, reach, and cultural relevance.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        <Button size="lg" onClick={() => router.push("/advertisement/media-kit")}>
          Request Media Kit
        </Button>

        <Button size="lg" variant="outline" onClick={onContactSales}>
          Contact Sales
        </Button>
      </div>
    </section>
  );
}
