"use client";

import { useState } from "react";

type Contact = {
  id: number;
  name: string;
  role: "Author" | "Editor" | "Content Manager";
};

type Article = {
  id: string;
  title: string;
  author: Contact;
  editor: Contact;
  manager: Contact;
  revision: string;
};

/* MOCK DATA — represents real assignment relationships */
const MOCK_ARTICLES: Article[] = [
  {
    id: "ART-001",
    title: "AI in Healthcare",
    revision: "v2",
    author: { id: 1, name: "Jane Author", role: "Author" },
    editor: { id: 2, name: "Mark Editor", role: "Editor" },
    manager: { id: 3, name: "Lisa Manager", role: "Content Manager" },
  },
  {
    id: "ART-002",
    title: "Climate Change Policy",
    revision: "v1",
    author: { id: 4, name: "John Author", role: "Author" },
    editor: { id: 5, name: "Emily Editor", role: "Editor" },
    manager: { id: 6, name: "Ryan Manager", role: "Content Manager" },
  },
];

export default function MessagesPage() {
  /* ARTICLE CONTEXT */
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  /* CHAT STATE */
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<
    { from: string; text: string; tag: string }[]
  >([
    {
      from: "Jane Author",
      text: "Hi, do you have feedback on my article?",
      tag: "Question",
    },
    {
      from: "You",
      text: "Yes, I’ll share detailed notes shortly.",
      tag: "Info",
    },
  ]);

  const availableContacts: Contact[] = selectedArticle
    ? [
        selectedArticle.author,
        selectedArticle.editor,
        selectedArticle.manager,
      ]
    : [];

  const handleSendMessage = () => {
    if (!message.trim() || !activeContact || !selectedArticle) return;

    setMessages((prev) => [
      ...prev,
      { from: "You", text: message, tag: "Note" },
    ]);
    setMessage("");
  };

  const handleAttachFile = () => {
    if (!selectedArticle || !activeContact) return;
    alert("File attached (frontend only)");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
      {/* HEADER */}
      <section className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">
          Messages
        </h1>
        <p className="text-sm text-muted-foreground">
          Article-scoped communication with assigned stakeholders
        </p>
      </section>

      {/* ARTICLE SELECTION */}
      <section className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
        <h3 className="font-medium text-foreground">
          Select Article
        </h3>

        <select
          value={selectedArticle?.id ?? ""}
          onChange={(e) => {
            const article = MOCK_ARTICLES.find(
              (a) => a.id === e.target.value
            );
            setSelectedArticle(article ?? null);
            setActiveContact(null);
          }}
          className="w-full border border-border rounded-md p-2 bg-background"
        >
          <option value="">Choose an article…</option>
          {MOCK_ARTICLES.map((article) => (
            <option key={article.id} value={article.id}>
              {article.title}
            </option>
          ))}
        </select>

        {selectedArticle && (
          <div className="text-sm text-muted-foreground border border-border rounded-md p-3 space-y-1">
            <p>
              <span className="font-medium text-foreground">Title:</span>{" "}
              {selectedArticle.title}
            </p>
            <p>
              <span className="font-medium text-foreground">Revision:</span>{" "}
              {selectedArticle.revision}
            </p>
            <p>
              <span className="font-medium text-foreground">Article ID:</span>{" "}
              {selectedArticle.id}
            </p>
          </div>
        )}
      </section>

      {/* CHAT — ONLY AFTER ARTICLE IS SELECTED */}
      {selectedArticle && (
        <section className="grid md:grid-cols-4 gap-6">
          {/* CONTACT LIST (FILTERED BY ASSIGNMENT) */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-4 space-y-2">
            <h3 className="font-medium text-foreground">
              Assigned Contacts
            </h3>

            {availableContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setActiveContact(contact)}
                className={`w-full text-left p-2 rounded-md text-sm hover:bg-muted ${
                  activeContact?.id === contact.id ? "bg-muted" : ""
                }`}
              >
                <p className="font-medium">{contact.name}</p>
                <p className="text-xs text-muted-foreground">
                  {contact.role}
                </p>
              </button>
            ))}
          </div>

          {/* CHAT PANEL */}
          <div className="md:col-span-3 bg-card border border-border rounded-lg shadow-sm flex flex-col">
            <div className="border-b border-border p-4">
              {activeContact ? (
                <>
                  <p className="font-medium text-foreground">
                    Chat with {activeContact.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeContact.role} · Article:{" "}
                    <span className="font-medium">
                      {selectedArticle.title}
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a contact to start the conversation
                </p>
              )}
            </div>

            {/* MESSAGES */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {activeContact &&
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`max-w-md text-sm p-3 rounded-md ${
                      msg.from === "You"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      Tag: {msg.tag}
                    </p>
                  </div>
                ))}
            </div>

            {/* INPUT */}
            {activeContact && (
              <div className="border-t border-border p-4 space-y-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full min-h-[60px] border border-border rounded-md p-2 text-sm"
                />
                <div className="flex justify-between items-center">
                  <button
                    onClick={handleAttachFile}
                    className="text-sm underline"
                  >
                    Attach File
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
