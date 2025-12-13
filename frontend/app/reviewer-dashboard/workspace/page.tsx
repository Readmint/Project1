"use client";

import { useState } from "react";

export default function ReviewWorkspacePage() {
  // Dummy content data
  const content = {
    title: "The Future of Artificial Intelligence",
    body: `Artificial Intelligence (AI) is transforming industries worldwide.

From healthcare to finance, AI-driven systems are improving efficiency, accuracy, and decision-making. However, ethical concerns, data privacy, and bias remain critical challenges that must be addressed as adoption grows.`,
    category: "Technology",
  };

  // Review tool dummy scores / notes
  const [tools, setTools] = useState({
    grammar: 85,
    structure: "Well-organized",
    readability: 78,
    factCheck: "No major issues found",
    categoryFit: "Aligned",
  });

  const [comments, setComments] = useState("");
  const [suggestions, setSuggestions] = useState("");

  // Button handlers (frontend only)
  const handleAccept = () => {
    alert("Submission accepted (frontend only)");
  };

  const handleRequestChanges = () => {
    alert("Changes requested from author (frontend only)");
  };

  const handleReject = () => {
    alert("Submission rejected (frontend only)");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* HEADER */}
      <section className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">
          Review Workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Evaluate content quality, structure, and compliance
        </p>
      </section>

      <section className="grid lg:grid-cols-4 gap-6">
        {/* CONTENT PREVIEW */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
          <h3 className="font-medium text-foreground">Content Preview</h3>
          <h2 className="text-lg font-semibold">{content.title}</h2>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {content.body}
          </div>

          {/* HIGHLIGHTING TOOL (mock) */}
          <button
            onClick={() => alert("Highlight mode enabled (mock)")}
            className="text-sm underline text-primary"
          >
            Enable Highlighting Tool
          </button>
        </div>

        {/* REVIEW TOOLS */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-foreground">Review Tools</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Grammar Evaluation: {tools.grammar}%</li>
            <li>Structure Assessment: {tools.structure}</li>
            <li>Readability Score: {tools.readability}</li>
            <li>Fact-check Notes: {tools.factCheck}</li>
            <li>Category Alignment: {tools.categoryFit}</li>
          </ul>
        </div>

        {/* GUIDELINES */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-foreground">Reviewer Guidelines</h3>
          <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
            <li>Check originality and plagiarism</li>
            <li>Verify logical structure and flow</li>
            <li>Assess grammar and clarity</li>
            <li>Confirm category alignment</li>
            <li>Provide actionable feedback</li>
          </ul>
        </div>
      </section>

      {/* COMMENTS & SUGGESTIONS */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-foreground">Comments</h3>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add reviewer comments..."
            className="w-full min-h-[120px] border border-border rounded-md p-2 text-sm"
          />
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-foreground">Suggestion Notes</h3>
          <textarea
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            placeholder="Provide improvement suggestions..."
            className="w-full min-h-[120px] border border-border rounded-md p-2 text-sm"
          />
        </div>
      </section>

      {/* ACTION BUTTONS */}
      <section className="flex justify-end gap-4">
        <button
          onClick={handleReject}
          className="px-4 py-2 rounded-md border border-destructive text-destructive"
        >
          Reject
        </button>
        <button
          onClick={handleRequestChanges}
          className="px-4 py-2 rounded-md border border-border"
        >
          Request Changes
        </button>
        <button
          onClick={handleAccept}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          Accept
        </button>
      </section>
    </div>
  );
}
