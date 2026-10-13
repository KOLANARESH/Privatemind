"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  MessageSquare,
  Plus,
  Trash2,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Loader2,
  ChevronRight,
  Filter,
  CheckCircle2,
  Sparkles,
  Bot,
  User as UserIcon,
} from "lucide-react";

interface CitationSource {
  id: string;
  type: "document" | "note" | "memory";
  title: string;
  pageNumber?: number;
  excerpt: string;
  relevanceScore: number;
  recordId: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: CitationSource[];
  evidenceQuality?: "HIGH" | "MODERATE" | "INSUFFICIENT";
  insufficientEvidence?: boolean;
  retrievalMode?: "VECTOR" | "KEYWORD_FALLBACK";
  providerUsed?: "lyzr-studio" | "local-deterministic";
  createdAt: string;
}

interface ConversationItem {
  id: string;
  title: string;
  updatedAt: string;
}

interface DocumentScopeItem {
  id: string;
  title: string;
}

interface ChatViewProps {
  onOpenDocumentModal: (id: string) => void;
}

export function ChatView({ onOpenDocumentModal }: ChatViewProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [documentsList, setDocumentsList] = useState<DocumentScopeItem[]>([]);

  // Scope filter state
  const [scopeType, setScopeType] = useState<"all" | "selected_docs" | "category">("all");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showScopeSelector, setShowScopeSelector] = useState(false);

  // Inspector modal for retrieved passage
  const [inspectSource, setInspectSource] = useState<CitationSource | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    "What were the key points in my last project report?",
    "Which document contains my university application requirements?",
    "Compare the notes I saved about vector search and architectures.",
    "What information have I saved about my upcoming assignments?",
  ];

  // Fetch conversations list & documents list
  const loadConversations = () => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        setConversations(data.conversations || []);
      })
      .catch((err) => console.error(err));
  };

  const loadDocuments = () => {
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        if (data.documents) {
          setDocumentsList(data.documents.map((d: { id: string; title: string }) => ({ id: d.id, title: d.title })));
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadConversations();
    loadDocuments();
  }, []);

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    fetch(`/api/conversations/${activeConversationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.conversation?.messages) {
          const parsed = data.conversation.messages.map((m: {
            id: string;
            role: "user" | "assistant";
            content: string;
            sourcesJson?: string;
            evidenceQuality?: "HIGH" | "MODERATE" | "INSUFFICIENT";
            insufficientEvidence?: boolean;
            retrievalMode?: "VECTOR" | "KEYWORD_FALLBACK";
            externalProviderUsed?: "lyzr-studio" | "local-deterministic";
            createdAt: string;
          }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            sources: m.sourcesJson ? JSON.parse(m.sourcesJson) : [],
            evidenceQuality: m.evidenceQuality,
            insufficientEvidence: m.insufficientEvidence,
            retrievalMode: m.retrievalMode,
            providerUsed: m.externalProviderUsed,
            createdAt: m.createdAt,
          }));
          setMessages(parsed);
        }
      })
      .catch((err) => console.error(err));
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSendMessage = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || sending) return;

    setInputQuery("");
    setSending(true);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: q,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          conversationId: activeConversationId || undefined,
          scopeType,
          scopeDocumentIds: scopeType === "selected_docs" ? selectedDocIds : [],
          scopeCategory: scopeType === "category" ? selectedCategory : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Chat query failed.");
      }

      if (!activeConversationId && data.conversationId) {
        setActiveConversationId(data.conversationId);
        loadConversations();
      }

      const assistantMsg: ChatMessage = {
        id: data.messageId || `res-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        evidenceQuality: data.evidenceQuality,
        insufficientEvidence: data.insufficientEvidence,
        retrievalMode: data.retrievalMode,
        providerUsed: data.providerUsed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Error retrieving grounded answer: ${msg}`,
        evidenceQuality: "INSUFFICIENT",
        insufficientEvidence: true,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/conversations/${convId}`, { method: "DELETE" });
      if (activeConversationId === convId) {
        setActiveConversationId(null);
        setMessages([]);
      }
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4 max-w-6xl mx-auto py-1">
      {/* Conversation Sidebar (Collapsible on Mobile) */}
      <div className="w-64 bg-slate-900/60 border border-slate-800 rounded-2xl flex-col hidden md:flex p-3">
        <button
          onClick={handleStartNewChat}
          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 mb-3 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>

        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
          Recent Chats
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 py-1">
          {conversations.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              No conversations yet.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConversationId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                    isActive
                      ? "bg-slate-800 text-emerald-300 font-medium border border-slate-700/80"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{conv.title}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 rounded transition-opacity"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden relative">
        {/* Scope Header */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">Knowledge Scope:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700/60">
              {scopeType === "all"
                ? "Entire Vault (Authorized Docs + Notes + Memories)"
                : scopeType === "selected_docs"
                ? `${selectedDocIds.length} Selected Documents`
                : `Category: ${selectedCategory}`}
            </span>
          </div>

          <button
            onClick={() => setShowScopeSelector(!showScopeSelector)}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
          >
            {showScopeSelector ? "Close Scope Filter" : "Adjust Scope"}
          </button>
        </div>

        {/* Collapsible Scope Filter Dropdown */}
        {showScopeSelector && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-3 text-xs animate-in slide-in-from-top-2">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="scope"
                  checked={scopeType === "all"}
                  onChange={() => setScopeType("all")}
                  className="text-emerald-500"
                />
                All Authorized Knowledge
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="scope"
                  checked={scopeType === "selected_docs"}
                  onChange={() => setScopeType("selected_docs")}
                  className="text-emerald-500"
                />
                Selected Documents Only
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="scope"
                  checked={scopeType === "category"}
                  onChange={() => setScopeType("category")}
                  className="text-emerald-500"
                />
                By Category
              </label>
            </div>

            {scopeType === "selected_docs" && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] text-slate-400 mb-2">Select documents to restrict retrieval:</div>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                  {documentsList.map((d) => {
                    const isSelected = selectedDocIds.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDocIds(selectedDocIds.filter((id) => id !== d.id));
                          } else {
                            setSelectedDocIds([...selectedDocIds, d.id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {d.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {scopeType === "category" && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                <span className="text-slate-400">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                >
                  <option value="Research">Research</option>
                  <option value="Study">Study</option>
                  <option value="Work">Work</option>
                  <option value="General">General</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
                <Bot className="w-7 h-7" />
              </div>

              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-slate-100">
                  Ask Your Private Knowledge Vault
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every response is grounded in your authorized documents and notes with verifiable page citations. If evidence is not found, the assistant will not invent answers.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 text-left text-xs text-slate-300 hover:text-emerald-300 transition-all flex items-start gap-2 group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-sm ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl space-y-3 rounded-2xl p-4 sm:p-5 ${
                      isUser
                        ? "bg-emerald-600 text-white ml-12"
                        : "bg-slate-950/80 border border-slate-800/90 text-slate-200 mr-12"
                    }`}
                  >
                    {/* Assistant Metadata Header */}
                    {!isUser && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80 text-[11px]">
                        <div className="flex items-center gap-2">
                          {/* Evidence Quality Indicator */}
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                              msg.evidenceQuality === "HIGH"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : msg.evidenceQuality === "MODERATE"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>{msg.evidenceQuality || "Grounded"} Evidence</span>
                          </span>

                          {msg.retrievalMode && (
                            <span className="text-slate-400">
                              Mode: {msg.retrievalMode}
                            </span>
                          )}
                        </div>

                        {msg.providerUsed && (
                          <span className="text-slate-400 font-mono text-[10px]">
                            {msg.providerUsed === "lyzr-studio" ? "Lyzr Studio Agent" : "Local Grounded Engine"}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                      {msg.content}
                    </div>

                    {/* Source Citations */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                          <FileText className="w-3 h-3 text-emerald-400" />
                          <span>Supporting Source Passages ({msg.sources.length})</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.sources.map((src, sIdx) => (
                            <div
                              key={sIdx}
                              onClick={() => setInspectSource(src)}
                              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-colors space-y-1 group"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-200 truncate group-hover:text-emerald-300">
                                  {src.title}
                                </span>
                                {src.pageNumber && (
                                  <span className="text-slate-400 text-[10px] shrink-0">
                                    p. {src.pageNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                                {src.excerpt}
                              </p>
                              <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 pt-0.5">
                                <span>Relevance: {Math.round(src.relevanceScore * 100)}%</span>
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex gap-3 text-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-slate-300 flex items-center gap-3 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Retrieving authorized evidence &amp; synthesizing grounded answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask a question about your documents, notes, or memories..."
              disabled={sending}
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || sending}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
          <div className="mt-2 text-[10px] text-slate-400 text-center">
            PrivateMind AI retrieves authorized records with cosine vector similarity before invoking the model.
          </div>
        </div>
      </div>

      {/* Inspect Source Passage Modal */}
      {inspectSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 relative">
            <button
              onClick={() => setInspectSource(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              &times;
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-base">{inspectSource.title}</h3>
                <p className="text-xs text-slate-400">
                  {inspectSource.pageNumber ? `Page ${inspectSource.pageNumber}` : "Record ID: " + inspectSource.recordId} &bull; Relevance Score: {Math.round(inspectSource.relevanceScore * 100)}%
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Full Retrieved Passage
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                {inspectSource.excerpt}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectSource(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
