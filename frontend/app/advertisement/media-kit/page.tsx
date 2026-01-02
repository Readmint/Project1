import { Card, CardContent } from "@/components/ui/card";

export default function MediaKitPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-bold text-foreground mb-6">
        Media Kit
      </h1>

      <p className="text-muted-foreground mb-12 max-w-3xl">
        Our media kit provides detailed insights into our audience demographics,
        advertising formats, and partnership opportunities.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">Audience Reach</h3>
            <p className="text-muted-foreground text-sm">
              1.2M+ monthly readers across culture, design, technology, and
              lifestyle.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">Ad Formats</h3>
            <p className="text-muted-foreground text-sm">
              Display ads, native stories, newsletters, homepage takeovers.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">Plans & Pricing</h3>
            <p className="text-muted-foreground text-sm">
              Silver, Gold, and Platinum packages aligned with your growth goals.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
