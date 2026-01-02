import { Card, CardContent } from "@/components/ui/card";

const stats = [
  { label: "Monthly Readers", value: "1.2M+" },
  { label: "Avg. Engagement Time", value: "6m 40s" },
  { label: "Newsletter Subscribers", value: "320K+" },
  { label: "Global Reach", value: "42 Countries" },
];

export default function AdStats() {
  return (
    <section className="max-w-6xl mx-auto px-6 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card">
            <CardContent className="p-6 text-center">
              <p className="text-2xl font-semibold text-foreground">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
