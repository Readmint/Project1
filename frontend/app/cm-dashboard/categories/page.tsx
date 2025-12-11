"use client";

import { useState } from "react";
import { Tags, X, Plus, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";

interface Category {
  name: string;
  level: number; // 0 = main, 1 = subcategory
}

export default function CategoriesPage() {
  // CATEGORY STATES
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([
    { name: "Tech", level: 0 },
    { name: "Science", level: 0 },
    { name: "Lifestyle", level: 0 },
    { name: "AI", level: 1 },
    { name: "Health", level: 1 },
  ]);

  // TAG STATES
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState(["AI", "Productivity", "Design"]);

  /* -----------------------------
        CATEGORY CRUD
  ------------------------------ */

  function addCategory() {
    if (!newCategory.trim()) return;
    setCategories([...categories, { name: newCategory, level: 0 }]);
    setNewCategory("");
  }

  function deleteCategory(catName: string) {
    setCategories(categories.filter((c) => c.name !== catName));
  }

  /* -----------------------------
      CATEGORY REORGANIZATION
  ------------------------------ */

  function moveCategory(index: number, direction: "up" | "down") {
    const newList = [...categories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    setCategories(newList);
  }

  function toggleLevel(index: number) {
    const newList = [...categories];
    newList[index].level = newList[index].level === 0 ? 1 : 0;
    setCategories(newList);
  }

  /* -----------------------------
            TAG CRUD
  ------------------------------ */

  function addTag() {
    if (!newTag.trim()) return;
    setTags([...tags, newTag]);
    setNewTag("");
  }

  function deleteTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  return (
    <main className="bubble-bg px-6 py-6 space-y-8 bg-background text-foreground">
      <h1 className="text-3xl font-semibold tracking-tight">Categories & Tags</h1>
      <p className="text-sm text-muted-foreground max-w-xl">
        Manage category hierarchy, reorganize structure, and maintain your editorial tag system.
      </p>

      {/* ------------------------- CATEGORY MANAGEMENT -------------------------- */}
      <section className="space-y-6 p-6 rounded-xl border bg-card shadow-sm">
        <h2 className="text-xl font-semibold">Category Levels</h2>

        {/* ADD CATEGORY INPUT */}
        <div className="flex gap-3">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="border bg-background rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-primary outline-none"
            placeholder="New Category (e.g., Tech)"
          />
          <button
            className="bg-primary text-primary-foreground px-4 rounded-lg shadow-sm hover:opacity-90"
            onClick={addCategory}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* CATEGORY LIST */}
        <div className="space-y-3">
          {categories.map((cat, index) => (
            <div
              key={cat.name}
              className="flex items-center justify-between border rounded-lg px-4 py-2 bg-card shadow-sm"
            >
              <div className="flex items-center gap-3">
                {cat.level === 1 && (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
                <span className="font-medium">{cat.name}</span>

                {/* LEVEL BADGE */}
                <span
                  className={`text-xs px-2 py-1 rounded-md border ${{
                    0: "bg-secondary text-secondary-foreground",
                    1: "bg-accent text-accent-foreground",
                  }[cat.level]}`}
                >
                  {cat.level === 0 ? "Main Category" : "Subcategory"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveCategory(index, "up")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowUp size={16} />
                </button>

                <button
                  onClick={() => moveCategory(index, "down")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowDown size={16} />
                </button>

                <button
                  className="text-primary text-xs border px-2 py-1 rounded-md hover:bg-primary hover:text-primary-foreground transition"
                  onClick={() => toggleLevel(index)}
                >
                  {cat.level === 0 ? "Make Sub" : "Make Main"}
                </button>

                <button
                  className="text-destructive hover:opacity-80"
                  onClick={() => deleteCategory(cat.name)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------- TAG MANAGEMENT -------------------------- */}
      <section className="space-y-6 p-6 rounded-xl border bg-card shadow-sm">
        <h2 className="text-xl font-semibold">Tag Management</h2>
        <p className="text-sm text-muted-foreground max-w-xl">
          Manage the keywords associated with articles for discovery.
        </p>

        {/* ADD TAG INPUT */}
        <div className="flex gap-3">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="border bg-background rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-primary outline-none"
            placeholder="New Tag (e.g., AI)"
          />
          <button
            className="bg-muted text-foreground px-4 rounded-lg shadow-sm hover:opacity-90"
            onClick={addTag}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* TAG LIST */}
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-2 bg-card border px-3 py-1.5 rounded-lg text-sm shadow-sm"
            >
              {tag}
              <button
                className="text-destructive hover:opacity-80"
                onClick={() => deleteTag(tag)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
