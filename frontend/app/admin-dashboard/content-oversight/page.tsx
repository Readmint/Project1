// app/admin-dashboard/content-oversight/page.tsx
"use client";

export default function ContentOversightPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Content Oversight & Moderation</h2>
        <p className="text-muted-foreground text-sm">Browse all content with rich filters and admin actions.</p>
      </section>

      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <input placeholder="Title" className="px-3 py-2 bg-muted border border-border rounded-lg" />
          <input placeholder="Author" className="px-3 py-2 bg-muted border border-border rounded-lg" />
          <select className="px-3 py-2 bg-muted border border-border rounded-lg">
            <option>All categories</option>
          </select>
          <select className="px-3 py-2 bg-muted border border-border rounded-lg">
            <option>Status</option>
            <option>Pending</option>
            <option>Published</option>
            <option>Flagged</option>
          </select>
          <button className="px-3 py-2 rounded-lg border border-border bg-card">Filter</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-sm text-muted-foreground">
              <tr>
                <th className="py-2">Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Plagiarism Flag</th>
                <th>Reviewer</th>
                <th>Editor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="py-3">Sample Article</td>
                <td>John Smith</td>
                <td>Pending</td>
                <td>No</td>
                <td>Reviewer A</td>
                <td>Editor X</td>
                <td>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 rounded border border-border bg-card">Preview</button>
                    <button className="px-2 py-1 rounded border border-border bg-card">Reassign</button>
                    <button className="px-2 py-1 rounded border border-border bg-card">Override</button>
                    <button className="px-2 py-1 rounded border border-border bg-card">Takedown</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-muted-foreground text-sm">Use the inline preview to inspect content and reassign reviewers/editors as necessary.</p>
      </div>
    </div>
  );
}
