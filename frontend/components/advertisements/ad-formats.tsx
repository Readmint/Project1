import { Card, CardContent } from "@/components/ui/card";
import { Monitor, Mail, LayoutGrid } from "lucide-react";

const formats = [
  {
    title: "Display Advertising",
    description:
      "High-impact banner placements seamlessly integrated within articles and category pages.",
    icon: Monitor,
  },
  {
    title: "Newsletter Sponsorships",
    description:
      "Direct access to a loyal subscriber base through premium newsletter sponsorships.",
    icon: Mail,
  },
  {
    title: "Native & Sponsored Content",
    description:
      "Story-driven branded content that matches our editorial quality and voice.",
    icon: LayoutGrid,
  },
];

export default function AdFormatsSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-24">
      <h2 className="text-3xl font-bold text-center text-foreground mb-12">
        Advertising Formats
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {formats.map((format) => (
          <Card key={format.title} className="bg-card">
            <CardContent className="p-8 text-center space-y-4">
              <format.icon className="h-10 w-10 mx-auto text-primary" />
              <h3 className="text-xl font-semibold text-foreground">
                {format.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {format.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
