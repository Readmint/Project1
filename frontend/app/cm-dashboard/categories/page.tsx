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
    <main className="px-6 py-6 space-y-8">
      <h1 className="text-2xl font-semibold">Categories & Tags</h1>
      <p className="text-sm text-slate-500">
        Manage category hierarchy, reorganize structure, and maintain tag library.
      </p>

      {/* -------------------------
        CATEGORY MANAGEMENT
      -------------------------- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Category Levels</h2>

        {/* ADD CATEGORY INPUT */}
        <div className="flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="border rounded-lg px-3 py-2 flex-1 dark:bg-slate-800"
            placeholder="New Category (e.g., Tech)"
          />
          <button
            className="bg-indigo-600 text-white px-4 rounded-lg"
            onClick={addCategory}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* CATEGORY LIST */}
        <div className="space-y-2">
          {categories.map((cat, index) => (
            <div
              key={cat.name}
              className="flex items-center justify-between border rounded-lg px-4 py-2 bg-white dark:bg-slate-900"
            >
              <div className="flex items-center gap-2">
                {cat.level === 1 && (
                  <ChevronRight size={16} className="text-slate-400" />
                )}
                <span>{cat.name}</span>

                {/* LEVEL BADGE */}
                <span
                  className={`text-xs px-2 py-1 rounded-md ${
                    cat.level === 0
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {cat.level === 0 ? "Main Category" : "Subcategory"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* MOVE UP */}
                <button
                  onClick={() => moveCategory(index, "up")}
                  className="text-slate-500"
                >
                  <ArrowUp size={16} />
                </button>

                {/* MOVE DOWN */}
                <button
                  onClick={() => moveCategory(index, "down")}
                  className="text-slate-500"
                >
                  <ArrowDown size={16} />
                </button>

                {/* TOGGLE LEVEL */}
                <button
                  className="text-indigo-600 text-xs border px-2 py-1 rounded-md"
                  onClick={() => toggleLevel(index)}
                >
                  {cat.level === 0 ? "Make Sub" : "Make Main"}
                </button>

                {/* DELETE CATEGORY */}
                <button
                  className="text-rose-600"
                  onClick={() => deleteCategory(cat.name)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------
        TAG MANAGEMENT
      -------------------------- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Tag Management</h2>
        <p className="text-sm text-slate-500">
          Manage the keywords associated with articles for discovery.
        </p>

        {/* ADD TAG INPUT */}
        <div className="flex gap-2">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="border rounded-lg px-3 py-2 flex-1 dark:bg-slate-800"
            placeholder="New Tag (e.g., AI)"
          />
          <button
            className="bg-slate-700 text-white px-4 rounded-lg"
            onClick={addTag}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* TAG LIST */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border px-3 py-1.5 rounded-lg text-sm shadow-sm"
            >
              {tag}
              <button
                className="text-rose-600"
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
