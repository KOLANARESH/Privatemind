"use client";

import React, { useState, useEffect } from "react";
import { X, Brain, Save, ShieldAlert } from "lucide-react";

interface MemoryModalProps {
  isOpen: boolean;
  memoryId?: string | null;
  initialContent?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function MemoryModal({
  isOpen,
  memoryId,
  initialContent = "",
  onClose,
  onSuccess,
}: MemoryModalProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("fact");
  const [isPersistent, setIsPersistent] = useState(true);
  const [retentionPolicy, setRetentionPolicy] = useState("indefinite");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (memoryId) {
      setLoading(true);
      fetch(`/api/memories/${memoryId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.memory) {
            setContent(data.memory.content);
            setCategory(data.memory.category || "fact");
            setIsPersistent(data.memory.isPersistent);
            setRetentionPolicy(data.memory.retentionPolicy || "indefinite");
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setContent(initialContent);
      setCategory("fact");
      setIsPersistent(true);
      setRetentionPolicy("indefinite");
      setError(null);
    }
  }, [isOpen, memoryId, initialContent]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Memory content cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = memoryId ? `/api/memories/${memoryId}` : "/api/memories";
      const method = memoryId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          category,
          isPersistent,
          retentionPolicy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save memory.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              {memoryId ? "Edit Persistent Memory" : "Add Persistent Memory"}
            </h3>
            <p className="text-xs text-slate-400">Explicit user-controlled memory with provenance tracking</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Memory Fact or Preference
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Alex prefers answers formatted in concise bullet points with citation references."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500/60"
              >
                <option value="preference">Preference</option>
                <option value="fact">Fact / Knowledge</option>
                <option value="personal">Personal Detail</option>
                <option value="goal">Goal / Milestone</option>
                <option value="instruction">Instruction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Retention Policy</label>
              <select
                value={retentionPolicy}
                onChange={(e) => setRetentionPolicy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500/60"
              >
                <option value="indefinite">Keep Indefinitely</option>
                <option value="30_days">Retain for 30 Days</option>
                <option value="90_days">Retain for 90 Days</option>
              </select>
            </div>
          </div>

          {/* Persistent vs Session Toggle */}
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-200">Persistent Storage</div>
              <div className="text-[11px] text-slate-400">
                {isPersistent ? "Persists across all future conversations" : "Temporary session context only"}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPersistent}
                onChange={(e) => setIsPersistent(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs sm:text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-teal-950/40"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : memoryId ? "Update Memory" : "Save to Vault"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
