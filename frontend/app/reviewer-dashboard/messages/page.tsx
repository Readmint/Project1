"use client";

import { useState, useEffect, useRef } from "react";
import { getJSON, postJSON } from "@/lib/api";
import { Loader2, Send, Paperclip, CheckCircle } from "lucide-react";

type Contact = {
  id: string;
  name: string;
  role: string;
};

type ArticleContext = {
  id: string; // Assignment ID? Or Article ID
  articleId: string;
  title: string;
  author: Contact;
  manager: Contact | null;
  editor: Contact | null;
};

type Message = {
  id: string;
  text: string;
  from: string;
  tag: string | null;
  timestamp: string;
};

export default function MessagesPage() {
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articles, setArticles] = useState<ArticleContext[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleContext | null>(null);

  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAssignedArticles();
  }, []);

  useEffect(() => {
    if (selectedArticle) {
      // Default to "Manager" or "Author"? Or none.
      setActiveContact(null);
      // Fetch all messages for this article context? Or only when contact selected?
      // Our backend fetches ALL messages for the user. So maybe we fetch once and filter?
      // Or we fetch per article.
      // Let's fetch all messages for the current user and filter by article client side or server side.
      // Backend supports ?articleId=...
      fetchMessages(selectedArticle.articleId);
    }
  }, [selectedArticle]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeContact]);

  const fetchAssignedArticles = async () => {
    try {
      const res = await getJSON('/reviewer/assignments');
      if (res.data) {
        setArticles(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch articles", error);
    } finally {
      setLoadingArticles(false);
    }
  };

  const fetchMessages = async (articleId: string) => {
    setLoadingMessages(true);
    try {
      const res = await getJSON(`/reviewer/messages?articleId=${articleId}`);
      if (res.data) {
        setMessages(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeContact || !selectedArticle) return;

    setSending(true);
    try {
      await postJSON('/reviewer/message', {
        receiverId: activeContact.id,
        message: inputText,
        articleId: selectedArticle.articleId
      });

      // Optimistic update
      setMessages(prev => [...prev, {
        id: 'temp-' + Date.now(),
        text: inputText,
        from: 'You',
        tag: 'Reviewer',
        timestamp: new Date().toISOString()
      }]);
      setInputText("");

      // Refresh to get real ID/timestamp?
      // fetchMessages(selectedArticle.articleId);

    } catch (error) {
      console.error("Failed to send message", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const availableContacts = selectedArticle ? [
    selectedArticle.author,
    selectedArticle.manager,
    selectedArticle.editor
  ].filter(Boolean) as Contact[] : [];

  // Filter messages displayed? 
  // Backend returns generic "sender_name" or "receiver_name".
  // If we want a 1-on-1 chat view, we must filter messages where (from=Contact OR to=Contact).
  // But backend response format is simplified: { text, from: 'You' | 'Name', tag, timestamp ... }
  // This simplistic format makes it hard to distinguish distinct conversations if multiple people talk.
  // Ideally, the "from" field is the name. If "You", we assume it was sent TO someone.
  // For now, simpliest view: Show ALL messages for this article in one timeline (Group Chat style) 
  // OR try filter.
  // Let's try "Article Channel" style where everyone sees everything, 
  // but if user explicitly selects a contact, we default the "Send" to that contact.

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Messages</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Communicate with authors and editors regarding your assignments.</p>
      </div>

      <div className="grid md:grid-cols-12 gap-6 flex-1 min-h-0">

        {/* LEFT COLUMN: Select Article & Context */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">

          {/* Article Picker */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
              Review Assignment
            </label>
            {loadingArticles ? (
              <div className="animate-pulse h-10 bg-slate-100 rounded"></div>
            ) : (
              <select
                value={selectedArticle?.articleId || ""}
                onChange={(e) => {
                  const found = articles.find(a => a.articleId === e.target.value);
                  setSelectedArticle(found || null);
                }}
                className="w-full text-sm border-slate-300 dark:border-slate-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800"
              >
                <option value="">Select Article...</option>
                {articles.map(a => (
                  <option key={a.articleId} value={a.articleId}>
                    {a.title.substring(0, 30)}{a.title.length > 30 ? "..." : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Participants List */}
          {selectedArticle && (
            <div className="flex-1 overflow-y-auto p-2">
              <p className="px-2 text-xs font-semibold text-slate-400 mb-2 mt-2">PARTICIPANTS</p>
              <div className="space-y-1">
                {availableContacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveContact(c)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                                ${activeContact?.id === c.id
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent"}
                            `}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                ${activeContact?.id === c.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}
                            `}>
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${activeContact?.id === c.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                        {c.name}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase">{c.role}</p>
                    </div>
                    {activeContact?.id === c.id && <CheckCircle size={14} className="text-indigo-600 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Chat Area */}
        <div className="md:col-span-8 lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col overflow-hidden">
          {!selectedArticle ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Send size={48} className="mb-4 opacity-20" />
              <p>Select an assignment to view messages</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-slate-100 dark:border-slate-700 flex items-center px-6 justify-between bg-slate-50/50">
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-white">
                    {activeContact ? `Message ${activeContact.name}` : "Project Discussion"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedArticle.title}
                  </p>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-slate-800/20">
                {loadingMessages ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-indigo-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-10">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.from === 'You';
                    return (
                      <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm
                                            ${isMe
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}
                                        `}>
                          <p>{msg.text}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {isMe ? 'You' : msg.from}
                          </span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] text-slate-300">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
                {!activeContact ? (
                  <div className="text-center text-sm text-slate-500 py-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Please select a recipient from the left list to send a private message.
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                      <Paperclip size={20} />
                    </button>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={`Message ${activeContact.name}...`}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border-0 rounded-lg px-4 focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !inputText.trim()}
                      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
