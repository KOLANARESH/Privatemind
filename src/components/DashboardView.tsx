"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  StickyNote,
  Brain,
  MessageSquare,
  Upload,
  Plus,
  ArrowUpRight,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";
import { NavTab } from "./Sidebar";

interface DashboardData {
  stats: {
    documentsCount: number;
    notesCount: number;
    memoriesCount: number;
    conversationsCount: number;
    totalStorageBytes: number;
    processingStatus: {
      completed: number;
      processing: number;
      failed: number;
    };
  };
  recentDocuments: {
    id: string;
    title: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    status: string;
    pageCount: number;
    createdAt: string;
  }[];
  recentNotes: {
    id: string;
    title: string;
    category: string;
    updatedAt: string;
  }[];
  recentConversations: {
    id: string;
    title: string;
    updatedAt: string;
    messages: { content: string; createdAt: string }[];
  }[];
  recentSearches: {
    id: string;
    detailsJson: string;
    createdAt: string;
  }[];
}

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenUpload: () => void;
  onOpenCreateNote: () => void;
}

export function DashboardView({
  onNavigate,
  onOpenUpload,
  onOpenCreateNote,
}: DashboardViewProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
        <p className="text-sm text-slate-400">Loading vault metrics...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    documentsCount: 0,
    notesCount: 0,
    memoriesCount: 0,
    conversationsCount: 0,
    totalStorageBytes: 0,
    processingStatus: { completed: 0, processing: 0, failed: 0 },
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Knowledge Vault Status</h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry and indexed records strictly isolated to your account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
          <button
            onClick={onOpenCreateNote}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Note
          </button>
          <button
            onClick={() => onNavigate("chat")}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Ask Assistant
          </button>
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stored Documents */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Stored Documents</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.documentsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{stats.processingStatus.completed} indexed &bull; {stats.processingStatus.failed} failed</span>
          </div>
        </div>

        {/* Saved Notes */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Personal Notes</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <StickyNote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.notesCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Offline &bull; Zero AI key required
          </div>
        </div>

        {/* Persistent Memories */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Persistent Memories</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.memoriesCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Explicitly user-retained facts
          </div>
        </div>

        {/* Storage Volume */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Vault Storage</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {(stats.totalStorageBytes / 1024).toFixed(1)} KB
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Private local storage directory
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Documents & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200">Recent Documents</h3>
            </div>
            <button
              onClick={() => onNavigate("documents")}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              View All ({stats.documentsCount}) <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {data?.recentDocuments && data.recentDocuments.length > 0 ? (
              data.recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onNavigate("documents")}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {doc.fileType.toUpperCase()}
                    </span>
                    <div className="truncate">
                      <div className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                        {doc.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {(doc.fileSize / 1024).toFixed(1)} KB &bull; {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      doc.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : doc.status === "FAILED"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No documents uploaded yet. Click Upload to start.
              </div>
            )}
          </div>
        </div>

        {/* Recent Personal Notes */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-200">Recent Notes</h3>
            </div>
            <button
              onClick={() => onNavigate("notes")}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              View All ({stats.notesCount}) <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {data?.recentNotes && data.recentNotes.length > 0 ? (
              data.recentNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onNavigate("notes")}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="truncate">
                    <div className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                      {note.title}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {note.category}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No personal notes created yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Conversations & Audit Searches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200">Recent Conversations</h3>
            </div>
            <button
              onClick={() => onNavigate("chat")}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              Open Assistant <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {data?.recentConversations && data.recentConversations.length > 0 ? (
              data.recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onNavigate("chat")}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
                >
                  <div className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                    {conv.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-1">
                    {conv.messages[0]?.content || "No messages yet"}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No conversations recorded.
              </div>
            )}
          </div>
        </div>

        {/* Audit Trail Preview */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-semibold text-slate-200">Recent Retrieval Audits</h3>
            </div>
            <button
              onClick={() => onNavigate("settings")}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium"
            >
              Audit Log <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {data?.recentSearches && data.recentSearches.length > 0 ? (
              data.recentSearches.map((s) => {
                let parsed: { evidenceQuality?: string; sourcesCount?: number } = {};
                try {
                  parsed = JSON.parse(s.detailsJson || "{}");
                } catch {}
                return (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-slate-300 font-mono text-[11px]">
                        RAG Query &bull; {parsed.sourcesCount ?? 0} sources evaluated
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(s.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No retrieval events logged yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
