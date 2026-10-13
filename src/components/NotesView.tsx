"use client";

import React, { useState, useEffect } from "react";
import {
  StickyNote,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Tag,
  Clock,
  Sparkles,
  Folder,
  Loader2,
} from "lucide-react";

interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tagsJson: string;
  isIndexed: boolean;
  retentionPolicy: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesViewProps {
  onOpenCreate: () => void;
  onOpenEdit: (id: string) => void;
  onConfirmDelete: (id: string, title: string) => void;
}

export function NotesView({
  onOpenCreate,
  onOpenEdit,
  onConfirmDelete,
}: NotesViewProps) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const fetchNotes = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (selectedCategory !== "ALL") params.set("category", selectedCategory);

    fetch(`/api/notes?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setNotes(data.notes || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch notes error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotes();
  }, [search, selectedCategory]);

  const categories = ["ALL", "General", "Research", "Study", "Work", "Personal", "Projects"];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes by title or content..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 focus:outline-none focus:border-indigo-500/60"
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
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Note</span>
        </button>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-400" />
          <p className="text-xs sm:text-sm text-slate-400">Loading personal notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <StickyNote className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">No notes found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create offline notes with markdown, category tags, and optional semantic vector indexing.
            </p>
          </div>
          <button
            onClick={onOpenCreate}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => {
            let tags: string[] = [];
            try {
              tags = JSON.parse(note.tagsJson || "[]");
            } catch {}

            return (
              <div
                key={note.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                      <Folder className="w-3 h-3" />
                      {note.category}
                    </span>

                    {note.isIndexed && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Indexed
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 mb-2 line-clamp-1">
                    {note.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed mb-4 whitespace-pre-wrap">
                    {note.content}
                  </p>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenEdit(note.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      title="Edit note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onConfirmDelete(note.id, note.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
