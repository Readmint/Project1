"use client";

import React, { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

export type Issue = {
  id: string;
  title: string;
  answer: string;
  moreLink?: string;
  category?: "writing" | "payment" | "technical" | "general" | "account";
};

const DEFAULT_ISSUES: Issue[] = [
  { id: "autosave", title: "Draft auto-save / lost changes", answer: "If your draft isn't saved: check network connectivity and try a manual Save Draft. Heavy images or unstable connections can interrupt auto-save. Re-upload media and re-save. If issue persists, export your draft and contact support.", category: "technical" },
  { id: "submission-failure", title: "Can't submit for review / backend errors", answer: "Verify all required fields are completed (title, category, tags). If API returns 400/500, try again after a few seconds. If persistent, copy the error message and attach it to a support ticket.", category: "technical" },
  { id: "plagiarism-flag", title: "Content flagged by plagiarism checker", answer: "Review the similarity report, rewrite flagged content, and re-run. For suspected false positives, attach external references and request manual review.", category: "writing" },
  { id: "image-upload", title: "Image/media upload failing or slow", answer: "Use optimized JPG/PNG below 5MB. Try stable connection or incognito mode. Clear browser cache if uploads fail repeatedly.", category: "technical" },
  { id: "certificate", title: "Certificate not generated after approval", answer: "Certificates generate asynchronously. Check back in a few minutes. If missing, report with submission ID.", category: "general" },
  { id: "permissions", title: "Cannot edit / view submission status", answer: "Ensure you're logged in with the correct author account and role. If mismatch persists, request admin to update permissions.", category: "general" },
  { id: "formatting", title: "Formatting/SEO fields not saved", answer: "Save drafts after editing SEO fields. If formatting resets, paste plain text and restyle manually.", category: "writing" },
  { id: "payment-not-received", title: "Payment not received", answer: "Verify that your content is approved and meets the payment cycle timeline. Ensure your payout details (UPI/Bank) are correct. If the cycle has passed and payment is still missing, create a ticket.", category: "payment" },
  { id: "wrong-payment-amount", title: "Wrong payment amount credited", answer: "Check your earnings breakdown for deductions (tax, platform fee). Cross-verify approved content count. If the amount is still incorrect, attach screenshots and create a ticket.", category: "payment" },
  { id: "payment-method-error", title: "UPI/Bank account verification failed", answer: "Ensure your UPI ID or account number and IFSC are correct. Retry verification. For repeated failure, upload proof of correct details and request admin verification.", category: "payment" },
  { id: "invoice-download-issue", title: "Cannot download invoice/payment receipt", answer: "Check pop-up blockers or try downloading from a different browser. If the file is broken or not generated, create a ticket so admin can regenerate it.", category: "payment" },
  { id: "payment-schedule", title: "Payment schedule and timelines", answer: "Payments are processed on the 5th of every month for content approved in the previous month. Please ensure your bank details are verified before the payment cycle.", category: "payment" },
  { id: "payment-methods", title: "Available payment methods", answer: "We support UPI, Bank Transfer, and PayPal. You can update your payment method in the Payment Settings section of your dashboard.", category: "payment" },
  { id: "payment-taxes", title: "Tax deductions and invoices", answer: "10% TDS is deducted as per government regulations. You can download tax certificates and invoices from the Payments section. For international authors, tax treaties may apply.", category: "payment" },
  { id: "account-details", title: "Update account/profile information", answer: "You can update your profile, contact details, and payment information from the Account Settings page. Changes may take up to 24 hours to reflect.", category: "account" },
  { id: "password-reset", title: "Reset password or account access", answer: "Use the 'Forgot Password' link on the login page. If you're still having issues, contact support with your registered email for manual reset.", category: "account" },
];

type Message = { id: string; sender: "user" | "bot"; text: string; time?: string; isTyping?: boolean; emotion?: "happy" | "thinking" | "helping" };

const categoryIcons = {
  writing: "📝",
  payment: "💰",
  technical: "🔧",
  general: "💡",
  account: "👤"
};

const categoryColors = {
  writing: "bg-gradient-to-r from-emerald-500 to-teal-600",
  payment: "bg-gradient-to-r from-amber-500 to-orange-600",
  technical: "bg-gradient-to-r from-blue-500 to-indigo-600",
  general: "bg-gradient-to-r from-purple-500 to-pink-600",
  account: "bg-gradient-to-r from-gray-600 to-gray-800"
};

const categoryDescriptions = {
  writing: "Content creation, formatting, plagiarism",
  payment: "Earnings, invoices, payment methods",
  technical: "Uploads, saving, submission errors",
  general: "Certificates, permissions, general help",
  account: "Profile, login, account settings"
};

export default function ChatbotAuthor({
  issues = DEFAULT_ISSUES,
  className = "",
}: {
  issues?: Issue[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filtered, setFiltered] = useState<Issue[]>(issues);
  const [query, setQuery] = useState("");
  const [input, setInput] = useState("");
  const [botMood, setBotMood] = useState<"idle" | "listening" | "thinking">("idle");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [hasLoadedUser, setHasLoadedUser] = useState(false);

  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user from localStorage (matching Navbar approach)
  useEffect(() => {
    const loadUser = () => {
      try {
        const userDataString = localStorage.getItem("user");

        if (userDataString) {
          const parsedUser = JSON.parse(userDataString);

          // Validate user object has required fields
          if (parsedUser && (parsedUser.uid || parsedUser.email)) {
            // Only update if user has changed
            if (!user || user.uid !== parsedUser.uid) {
              console.log("Chatbot: User found in localStorage:", parsedUser);
              setUser(parsedUser);

              // Only fetch Firestore details if we have a uid
              if (parsedUser.uid) {
                fetchUserDetails(parsedUser.uid);
              } else {
                setUserData(parsedUser); // Use localStorage data directly
                setIsLoadingUser(false);
              }
              setHasLoadedUser(true);
            }
          } else {
            console.warn("Chatbot: User data incomplete:", parsedUser);
            if (user !== null) {
              setUser(null);
              setUserData(null);
              setIsLoadingUser(false);
              setHasLoadedUser(true);
            }
          }
        } else {
          console.log("Chatbot: No user found in localStorage");
          if (user !== null) {
            setUser(null);
            setUserData(null);
            setIsLoadingUser(false);
            setHasLoadedUser(true);
          }
        }
      } catch (error) {
        console.error("Chatbot: Error loading user:", error);
        if (user !== null) {
          setUser(null);
          setUserData(null);
          setIsLoadingUser(false);
          setHasLoadedUser(true);
        }
      }
    };

    // Load user initially
    loadUser();

    // Listen for storage changes (login/logout from other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        console.log("Chatbot: Storage changed for user key");
        loadUser();
      }
    };

    // Listen for custom login/logout events
    const handleLoginEvent = () => {
      console.log("Chatbot: Received userLogin event");
      loadUser();
    };

    const handleLogoutEvent = () => {
      console.log("Chatbot: Received userLogout event");
      setUser(null);
      setUserData(null);
      setIsLoadingUser(false);
      setHasLoadedUser(true);
    };

    // Only set up interval if we haven't loaded user yet
    if (!hasLoadedUser) {
      checkIntervalRef.current = setInterval(() => {
        console.log("Chatbot: Checking for user...");
        loadUser();
      }, 2000);
    }

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userLogin", handleLoginEvent);
    window.addEventListener("userLogout", handleLogoutEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userLogin", handleLoginEvent);
      window.removeEventListener("userLogout", handleLogoutEvent);

      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [hasLoadedUser]); // Only depend on hasLoadedUser

  // Fetch additional user details from Firestore
  const fetchUserDetails = async (userId: string) => {
    // Validate userId before making Firestore call
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.warn("Chatbot: Invalid userId provided to fetchUserDetails:", userId);
      setIsLoadingUser(false);
      return;
    }

    try {
      setIsLoadingUser(true);
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("Chatbot: Firestore user data:", data);
        setUserData(data);
      } else {
        console.log("Chatbot: No user document found in Firestore for ID:", userId);
        // Keep the localStorage user data
        setUserData(user || {});
      }
      setIsLoadingUser(false);
    } catch (error) {
      console.error("Chatbot: Error fetching user details:", error);
      // Fallback to localStorage data
      setUserData(user || {});
      setIsLoadingUser(false);
    }
  };

  // Initialize with animated welcome - only once
  useEffect(() => {
    if (messages.length > 0) return;

    // Only show welcome message after we've attempted to load user
    if (hasLoadedUser) {
      const welcomeMessage = user
        ? `👋 Welcome back${user.name ? ` ${user.name}` : user.displayName ? ` ${user.displayName}` : ''}! I'm your Author Assistant.\n\nI can help you with:\n\n📝 **Writing Issues** - Content, formatting, plagiarism\n💰 **Payment Questions** - Earnings, invoices, payment methods\n🔧 **Technical Problems** - Uploads, saving, submissions\n💡 **General Help** - Certificates, permissions\n👤 **Account Support** - Profile, login issues\n\nAsk me anything or select a topic below!`
        : `👋 Hello! I'm your Author Assistant.\n\nI can help you with:\n\n📝 **Writing Issues** - Content, formatting, plagiarism\n💰 **Payment Questions** - Earnings, invoices, payment methods\n🔧 **Technical Problems** - Uploads, saving, submissions\n💡 **General Help** - Certificates, permissions\n👤 **Account Support** - Profile, login issues\n\n${!user ? '⚠️ **Note:** Please log in to create support tickets.\n\n' : ''}Ask me anything or select a topic below!`;

      setMessages([
        {
          id: "b-welcome",
          sender: "bot",
          text: welcomeMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          emotion: "happy"
        },
      ]);
    }
  }, [messages.length, user, hasLoadedUser]);

  // Filter issues by category and search
  useEffect(() => {
    const q = query.trim().toLowerCase();
    let result = issues;

    if (activeCategory !== "all") {
      result = result.filter(i => i.category === activeCategory);
    }

    if (q) {
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.answer.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [query, issues, activeCategory]);

  // Animated scroll
  useEffect(() => {
    if (!transcriptRef.current) return;
    const scrollHeight = transcriptRef.current.scrollHeight;
    const height = transcriptRef.current.clientHeight;
    const maxScrollTop = scrollHeight - height;
    transcriptRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  }, [messages]);

  // Mood changes based on user action
  useEffect(() => {
    if (botMood === "thinking") {
      const timer = setTimeout(() => setBotMood("idle"), 2000);
      return () => clearTimeout(timer);
    }
  }, [botMood]);

  function pushMessage(m: Message) {
    setMessages(prev => [...prev, m]);
    setBotMood(m.sender === "user" ? "thinking" : "idle");
  }

  function simulateBotTyping(finalText: string, emotion: "happy" | "thinking" | "helping" = "helping") {
    const botId = `b-${Date.now()}`;
    pushMessage({
      id: botId,
      sender: "bot",
      text: "",
      isTyping: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion
    });

    // Typing effect with varying speeds
    let idx = 0;
    const charSpeed = () => 15 + Math.random() * 25;
    const pauseAt = ['.', ',', '!', '?'];

    function typeNext() {
      if (idx < finalText.length) {
        const char = finalText[idx];
        idx++;

        setMessages(prev =>
          prev.map(m =>
            m.id === botId
              ? { ...m, text: finalText.slice(0, idx), isTyping: idx < finalText.length }
              : m
          )
        );

        const delay = pauseAt.includes(char) ? 250 : charSpeed();
        typingTimerRef.current = window.setTimeout(typeNext, delay);
      } else if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
    }

    typingTimerRef.current = window.setTimeout(typeNext, 100);
  }

  function handleQuickQuestion(it: Issue) {
    pushMessage({
      id: `u-${it.id}-${Date.now()}`,
      sender: "user",
      text: it.title,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion: "thinking"
    });

    // Add creative prefixes based on category
    const prefixes = {
      writing: "📝 **Writing Support:** ",
      payment: "💰 **Payment Assistance:** ",
      technical: "🔧 **Technical Help:** ",
      general: "💡 **General Guidance:** ",
      account: "👤 **Account Support:** "
    };

    const prefix = prefixes[it.category || "general"];
    simulateBotTyping(`${prefix}\n\n${it.answer}\n\n${it.moreLink ? `📚 Learn more: ${it.moreLink}` : ''}`, "helping");

    setTimeout(() => inputRef.current?.focus(), 300);
  }

  function handleSendCustom() {
    const text = input.trim();
    if (!text) return;

    pushMessage({
      id: `u-custom-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion: "thinking"
    });
    setInput("");

    const match = issues.find(i =>
      i.title.toLowerCase().includes(text.toLowerCase()) ||
      i.answer.toLowerCase().includes(text.toLowerCase())
    );

    if (match) {
      simulateBotTyping(`✅ **Found a match!**\n\n**${match.title}**\n\n${match.answer}\n\n${match.moreLink ? `📚 More info: ${match.moreLink}` : 'Need more help? Try searching by category below.'}`, "happy");
    } else {
      const isLoggedIn = user && (user.uid || user.email);
      simulateBotTyping(`❓ **I couldn't find an exact match for your question.**\n\nHere are your options:\n\n1️⃣ **Search by category** - Select a category above to narrow down\n2️⃣ **Create a support ticket** - I'll help you raise this to our team\n3️⃣ **Try rephrasing** - Use different keywords\n\n${isLoggedIn ? 'Would you like to create a ticket for this issue?' : '⚠️ **Please log in to create support tickets.**'}`, "thinking");

      // Auto-fill ticket form with user's query if logged in
      if (isLoggedIn) {
        setTimeout(() => {
          setTicketSubject(text.length > 50 ? text.substring(0, 50) + "..." : text);
          setTicketDescription(text);
        }, 1000);
      }
    }

    setTimeout(() => inputRef.current?.focus(), 400);
  }

  async function createTicketFromLatest() {
    const isLoggedIn = user && (user.uid || user.email);

    if (!isLoggedIn) {
      pushMessage({
        id: `b-login-required-${Date.now()}`,
        sender: "bot",
        text: "🔒 **Login Required**\n\nYou need to be logged in to create support tickets.\n\nPlease log in to your account first, then try creating the ticket again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: "thinking"
      });
      return;
    }

    const lastUser = [...messages].reverse().find(m => m.sender === "user");
    if (!lastUser) {
      pushMessage({
        id: `b-ticket-err-${Date.now()}`,
        sender: "bot",
        text: "❌ Please ask a question first before creating a ticket.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: "thinking"
      });
      return;
    }

    // Show ticket modal for user confirmation
    setTicketSubject(lastUser.text.length > 50 ? lastUser.text.substring(0, 50) + "..." : lastUser.text);
    setTicketDescription(lastUser.text);
    setShowTicketModal(true);
  }

  async function handleCreateTicket() {
    const isLoggedIn = user && (user.uid || user.email);

    if (!isLoggedIn) {
      pushMessage({
        id: `b-ticket-err-${Date.now()}`,
        sender: "bot",
        text: "❌ Please log in to create a support ticket.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: "thinking"
      });
      setShowTicketModal(false);
      return;
    }

    // Get user data from localStorage or Firestore
    const currentUser = user || userData;
    if (!currentUser) {
      pushMessage({
        id: `b-ticket-err-${Date.now()}`,
        sender: "bot",
        text: "❌ Invalid user data. Please log in again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: "thinking"
      });
      setShowTicketModal(false);
      return;
    }

    setIsCreatingTicket(true);

    try {
      // Prepare user data with fallbacks
      const userEmail = currentUser.email || currentUser.userEmail || "No email provided";
      const userName = currentUser.name || currentUser.displayName || userData?.name || "Unknown Author";
      const userRole = currentUser.role || userData?.role || "author";
      const userId = currentUser.uid || currentUser.id || `local-${Date.now()}`;

      const ticketData = {
        subject: ticketSubject || "Author assistance request",
        description: ticketDescription || "No description provided",
        authorId: userId,
        authorEmail: userEmail,
        authorName: userName,
        authorRole: userRole,
        timestamp: new Date().toISOString(),
        source: "chatbot-author",
        status: "open",
        priority: "medium",
        category: activeCategory !== "all" ? activeCategory : "general",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Include additional user data
        authorLastLogin: new Date().toISOString(),
        // Additional metadata
        userAgent: navigator.userAgent,
        resolution: `${window.screen.width}x${window.screen.height}`,
        browserLanguage: navigator.language,
        // Source information
        fromChatbot: true,
        chatbotSession: messages.length
      };

      await addDoc(collection(db, "author_tickets"), ticketData);

      // Close modal and show success
      setShowTicketModal(false);
      setIsCreatingTicket(false);

      pushMessage({
        id: `b-ticket-ok-${Date.now()}`,
        sender: "bot",
        text: `✅ **Support Ticket Created Successfully!**\n\n📋 **Ticket Details:**\n• Subject: ${ticketSubject}\n• Category: ${activeCategory !== "all" ? activeCategory : "General"}\n• Status: Open\n• Priority: Medium\n\n📧 **Notification sent to:** ${userEmail}\n\nOur support team will review your request and respond within 24 hours. You'll receive email updates on your ticket status. Thank you for your patience!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: "happy"
      });

      // Reset form
      setTicketSubject("");
      setTicketDescription("");
    } catch (err) {
      console.error("Firestore ticket error:", err);
      pushMessage({
        id: `b-ticket-err-${Date.now()}`,
        sender: "bot",
        text: "❌ **Unable to create ticket.** Please try again in a few minutes or contact info.mindradix@gmail.com directly.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: "thinking"
      });
      setIsCreatingTicket(false);
    }

    setTimeout(() => inputRef.current?.focus(), 200);
  }

  const categories = [
    { id: "all", label: "✨ All Topics", color: "bg-gradient-to-r from-violet-600 to-purple-600", description: "Browse all help topics" },
    { id: "writing", label: "📝 Writing", color: categoryColors.writing, description: categoryDescriptions.writing },
    { id: "payment", label: "💰 Payment", color: categoryColors.payment, description: categoryDescriptions.payment },
    { id: "technical", label: "🔧 Technical", color: categoryColors.technical, description: categoryDescriptions.technical },
    { id: "general", label: "💡 General", color: categoryColors.general, description: categoryDescriptions.general },
    { id: "account", label: "👤 Account", color: categoryColors.account, description: categoryDescriptions.account },
  ];

  // Format user role for display
  const getUserRoleDisplay = () => {
    const currentUser = user || userData;
    if (!currentUser) return "";

    const role = currentUser.role || "";
    switch (role) {
      case 'author':
        return 'Author';
      case 'reader':
        return 'Reader';
      case 'reviewer':
        return 'Reviewer';
      case 'editor':
        return 'Editor';
      case 'content_manager':
        return 'Content Manager';
      case 'admin':
        return 'Administrator';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    const currentUser = user || userData;
    if (!currentUser) return "";

    return currentUser.name ||
      currentUser.displayName ||
      currentUser.userName ||
      (currentUser.email ? currentUser.email.split("@")[0] : "") ||
      "User";
  };

  // Get user email
  const getUserEmail = () => {
    const currentUser = user || userData;
    return currentUser?.email || currentUser?.userEmail || "No email";
  };

  // Check if user is logged in (more flexible check)
  const isLoggedIn = user && (user.uid || user.email);

  return (
    <div className={`fixed right-6 bottom-6 z-50 ${className}`}>
      {/* Chat panel */}
      {open && (
        <div className="absolute bottom-24 right-0 w-[500px] max-h-[700px] flex flex-col animate-slide-up">
          {/* Main container */}
          <div className="relative bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="relative p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600">
              <div className="relative flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-indigo-100 flex items-center justify-center shadow-lg">
                    <div className="text-3xl">🤖</div>
                  </div>
                  {/* Status indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${botMood === "idle" ? "bg-emerald-500" : botMood === "thinking" ? "bg-amber-500 animate-pulse" : "bg-blue-500"}`} />
                </div>

                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">
                    Author Support Assistant
                  </h2>
                  <p className="text-sm text-indigo-200 mt-1">
                    {isLoggedIn ? `${getUserDisplayName()} • ${getUserRoleDisplay()}` : "Get help with writing, payments, and technical issues"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-xs text-indigo-300">
                      <span>Status:</span>
                      <span className="font-medium">
                        {botMood === "idle" ? "Ready" : botMood === "thinking" ? "Processing" : "Listening"}
                      </span>
                      {isLoadingUser && <span className="ml-2">• Loading user data...</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-all duration-300"
                >
                  <span className="text-white text-xl">✕</span>
                </button>
              </div>
            </div>

            {/* Category filter chips */}
            <div className="px-6 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Browse by Category:</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 flex flex-col items-center min-w-[100px] ${activeCategory === cat.id
                          ? `${cat.color} text-white shadow-lg`
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 shadow"
                        }`}
                      title={cat.description}
                    >
                      <span>{cat.label.split(' ')[0]}</span>
                      <span className="text-xs opacity-80 mt-1">{cat.label.split(' ').slice(1).join(' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="🔍 Search help topics (e.g., 'payment', 'upload', 'certificate')..."
                  className="w-full px-4 py-3 pl-12 rounded-xl bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-800 dark:text-gray-200"
                />
                <div className="absolute left-4 top-3.5 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Chat transcript */}
            <div
              ref={transcriptRef}
              className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[300px] bg-white dark:bg-gray-900"
            >
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                  <div className={`max-w-[85%] ${m.sender === "user"
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-sm shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-bl-sm shadow'
                    } p-4 transition-all duration-300`}>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                    <div className={`flex items-center justify-between mt-2 text-xs ${m.sender === "user" ? 'text-blue-200' : 'text-gray-500'}`}>
                      <span>{m.time}</span>
                      {m.sender === "bot" && m.emotion && (
                        <span className="ml-2">{m.emotion === "happy" ? "😊" : m.emotion === "thinking" ? "🤔" : "🛠️"}</span>
                      )}
                    </div>
                    {m.isTyping && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-xs opacity-70">Assistant is typing...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick questions grid */}
            {filtered.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="text-lg">🚀</span> Quick Help Topics
                  <span className="ml-auto text-xs font-normal text-gray-500 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                    {filtered.length} available
                  </span>
                </h3>

                <div className="grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto pr-2">
                  {filtered.slice(0, 5).map(it => (
                    <button
                      key={it.id}
                      onClick={() => handleQuickQuestion(it)}
                      className="group text-left p-3 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{categoryIcons[it.category || "general"]}</span>
                        <div className="flex-1">
                          <span className="font-medium text-sm text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block">
                            {it.title}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                            {it.category ? categoryDescriptions[it.category] : "General help"}
                          </span>
                        </div>
                        <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="relative flex gap-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendCustom();
                      }
                    }}
                    placeholder="💬 Type your question here... (Press Enter to send)"
                    className="w-full px-5 py-4 pl-14 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <div className="absolute left-5 top-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSendCustom}
                    className="px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium hover:from-indigo-700 hover:to-blue-700 transform hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!input.trim()}
                  >
                    <span>Send</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={createTicketFromLatest}
                    className="px-5 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transform hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Create Support Ticket"
                    disabled={!isLoggedIn}
                  >
                    {isLoggedIn ? "🎫" : "🔒"}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  {isLoggedIn ? (
                    <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Logged in as: {getUserEmail()}
                    </span>
                  ) : (
                    <button
                      onClick={() => window.location.href = "/login"}
                      className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Log in to create tickets
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setMessages([])}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Clear chat
                  </button>
                  <button
                    onClick={() => window.open('/help', '_blank')}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Help Center →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Creation Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Create Support Ticket</h3>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  disabled={isCreatingTicket}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Brief description of your issue"
                    disabled={isCreatingTicket}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Please provide detailed information about your issue..."
                    disabled={isCreatingTicket}
                  />
                </div>

                {isLoggedIn && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Ticket will be created for:</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      <span className="font-medium">Name:</span> {getUserDisplayName()}<br />
                      <span className="font-medium">Email:</span> {getUserEmail()}<br />
                      <span className="font-medium">Role:</span> {getUserRoleDisplay()}<br />
                      <span className="font-medium">User ID:</span> {(user?.uid || userData?.uid) ? `${(user?.uid || userData?.uid).substring(0, 8)}...` : "Local User"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isCreatingTicket}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTicket}
                  disabled={isCreatingTicket || !ticketSubject.trim() || !ticketDescription.trim()}
                  className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingTicket ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Ticket'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating action button */}
      <button
        onClick={() => {
          setOpen(s => !s);
          setTimeout(() => inputRef.current?.focus(), 200);
        }}
        className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-500 hover:scale-110 ${open
            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 rotate-45'
            : 'bg-gradient-to-br from-indigo-600 to-blue-600 hover:rotate-12'
          }`}
        title="Author Support Assistant"
      >
        <div className="relative text-white text-2xl">
          {open ? '✕' : '💬'}
        </div>

        {/* Notification badge */}
        {!open && messages.length > 1 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs flex items-center justify-center animate-pulse">
            {messages.length - 1}
          </div>
        )}
      </button>

      {/* Enhanced styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4f46e5, #7c3aed);
        }
        
        @media (prefers-color-scheme: dark) {
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          }
        }
      `}</style>
    </div>
  );
}