"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  FileText,
  MessageSquare,
  Lock,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface MemoryItem {
  id: string;
  content: string;
  category: string;
  isPersistent: boolean;
  retentionPolicy: string;
  confidence: number;
  sourceSummary?: string | null;
  createdAt: string;
  updatedAt: string;
  sources?: {
    id: string;
    document?: { title: string } | null;
    note?: { title: string } | null;
  }[];
}

interface MemoryViewProps {
  onOpenCreate: () => void;
  onOpenEdit: (id: string) => void;
  onConfirmDelete: (id: string, label: string) => void;
  onConfirmBulkClear: () => void;
}

export function MemoryView({
  onOpenCreate,
  onOpenEdit,
  onConfirmDelete,
  onConfirmBulkClear,
}: MemoryViewProps) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [persistentMemoryEnabled, setPersistentMemoryEnabled] = useState(true);
  const [togglingPolicy, setTogglingPolicy] = useState(false);

  const fetchMemories = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (selectedCategory !== "ALL") params.set("category", selectedCategory);

    fetch(`/api/memories?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setMemories(data.memories || []);
        if (typeof data.persistentMemoryEnabled === "boolean") {
          setPersistentMemoryEnabled(data.persistentMemoryEnabled);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch memories error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMemories();
  }, [search, selectedCategory]);

  const handleTogglePersistentMemory = async () => {
    setTogglingPolicy(true);
    try {
      const nextState = !persistentMemoryEnabled;
      const res = await fetch("/api/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persistentMemoryEnabled: nextState }),
      });
      if (res.ok) {
        setPersistentMemoryEnabled(nextState);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingPolicy(false);
    }
  };

  const categories = ["ALL", "preference", "fact", "personal", "goal", "instruction"];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Global Persistence Control & Notice Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Persistent Personal Memory</h2>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    persistentMemoryEnabled
                      ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {persistentMemoryEnabled ? "Enabled" : "Disabled by User"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Controls whether facts and preferences persist across conversations or stay strictly isolated to the active session.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePersistentMemory}
              disabled={togglingPolicy}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border transition-colors ${
                persistentMemoryEnabled
                  ? "bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border-teal-500/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
            >
              {persistentMemoryEnabled ? (
                <>
                  <ToggleRight className="w-4 h-4 text-teal-400" />
                  <span>Disable Persistent Memory</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                  <span>Enable Persistent Memory</span>
                </>
              )}
            </button>

            <button
              onClick={onConfirmBulkClear}
              disabled={memories.length === 0}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Memories</span>
            </button>
          </div>
        </div>

        {/* Distinct architectural explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800/80">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="font-semibold text-teal-400 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Persistent Personal Memory
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Explicit user-retained facts, preferences, and project goals stored with provenance tracking. Injected into RAG queries only when persistence is enabled.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Temporary Session Context
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Ephemeral conversation turns within the active chat. Automatically discarded or kept isolated without promoting to persistent memory.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Create Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories by keyword..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 focus:outline-none focus:border-teal-500/60 capitalize"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Memory</span>
        </button>
      </div>

      {/* Memories List */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-teal-400" />
          <p className="text-xs sm:text-sm text-slate-400">Loading memory vault...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">No persistent memories stored</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Save key facts or preferences you want the conversational assistant to consistently remember.
            </p>
          </div>
          <button
            onClick={onOpenCreate}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs sm:text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Memory
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memories.map((mem) => {
            const originTitle =
              mem.sources && mem.sources[0]?.document?.title
                ? `Document: ${mem.sources[0].document.title}`
                : mem.sources && mem.sources[0]?.note?.title
                ? `Note: ${mem.sources[0].note.title}`
                : mem.sourceSummary || "User Configured";

            return (
              <div
                key={mem.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20 capitalize">
                      {mem.category}
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        mem.isPersistent
                          ? "bg-slate-800 text-slate-300 border border-slate-700"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {mem.isPersistent ? "Persistent" : "Session Only"}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium mb-3">
                    "{mem.content}"
                  </p>

                  <div className="space-y-1.5 text-[11px] text-slate-400 py-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Provenance: {originTitle}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Retention: {mem.retentionPolicy}</span>
                      <span>{new Date(mem.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onOpenEdit(mem.id)}
                    className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                    title="Edit memory"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onConfirmDelete(mem.id, `Memory: "${mem.content.slice(0, 32)}..."`)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
