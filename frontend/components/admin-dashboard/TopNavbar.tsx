// components/admin-dashboard/TopNavbar.tsx
"use client";

export default function TopNavbar() {
  return (
    <div className="flex items-center justify-between h-full px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview & controls</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          aria-label="Search"
          placeholder="Search users, content, reports..."
          className="px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none text-sm"
        />
        <button className="px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted transition-all text-sm">New</button>
        <div className="w-8 h-8 rounded-full bg-muted" />
      </div>
    </div>
  );
}
