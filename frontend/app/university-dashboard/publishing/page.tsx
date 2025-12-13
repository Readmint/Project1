"use client";

import { Globe, UploadCloud } from "lucide-react";

export default function PublishingPage() {
  return (
    <div className="max-w-7xl mx-auto px-2 py-2 space-y-8">

      <div>
        <h1 className="text-xl font-semibold text-foreground">Publishing Options</h1>
        <p className="text-muted-foreground text-sm">Publish your special issue or proceedings.</p>
      </div>

      {/* ADMIN PUBLISH */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
        <h2 className="font-medium text-foreground flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-primary" /> Internal Publish
        </h2>
        <p className="text-sm text-muted-foreground">
          Make your issue available to university stakeholders.
        </p>
        <button className="px-4 py-2 bg-muted rounded-lg hover:bg-border transition-all text-sm">
          Publish Internally
        </button>
      </div>

      {/* MARKETPLACE */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
        <h2 className="font-medium text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" /> ReadMint Marketplace
        </h2>
        <p className="text-sm text-muted-foreground">
          Publish the issue publicly for broader research visibility.
        </p>
        <button className="px-4 py-2 bg-muted rounded-lg hover:bg-border transition-all text-sm">
          Publish to Marketplace
        </button>
      </div>

    </div>
  );
}
