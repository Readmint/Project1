import { Button } from "@/components/ui/button";

export default function AdCTA({ onContactSales }: { onContactSales?: () => void }) {
  return (
    <section className="bg-muted py-20">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Let’s Build a Campaign That Works
        </h2>
        <p className="text-muted-foreground mb-8">
          Our sales and editorial teams collaborate closely with brands to
          deliver campaigns that feel authentic and perform exceptionally.
        </p>
        <Button size="lg" onClick={onContactSales}>
          Start Advertising
        </Button>
      </div>
    </section>
  );
}
