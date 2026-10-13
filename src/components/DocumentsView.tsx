"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  File,
  Loader2,
} from "lucide-react";

interface DocumentItem {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  errorMessage?: string | null;
  pageCount: number;
  createdAt: string;
  _count?: { chunks: number };
}

interface DocumentsViewProps {
  onOpenUpload: () => void;
  onOpenDocumentModal: (id: string) => void;
  onConfirmDelete: (id: string, title: string) => void;
}

export function DocumentsView({
  onOpenUpload,
  onOpenDocumentModal,
  onConfirmDelete,
}: DocumentsViewProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchDocuments = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter !== "ALL") params.set("status", statusFilter);

    fetch(`/api/documents?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data.documents || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch documents error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, statusFilter]);

  const handleRetry = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryingId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}/retry`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchDocuments();
      } else {
        alert(data.error || "Retry failed.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents by title or file name..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 focus:outline-none focus:border-emerald-500/60"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed (Indexed)</option>
              <option value="INDEXING">Indexing / Processing</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Document Grid / Table */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-emerald-400" />
          <p className="text-xs sm:text-sm text-slate-400">Loading document vault...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <File className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">No documents found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== "ALL"
                ? "No documents match the specified filters. Try clearing your search query."
                : "Upload PDF, DOCX, TXT, or Markdown documents to begin building your private knowledge base."}
            </p>
          </div>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const isFailed = doc.status === "FAILED";
            const isCompleted = doc.status === "COMPLETED";

            return (
              <div
                key={doc.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 text-emerald-400 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {doc.fileType.toUpperCase()}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                        isCompleted
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : isFailed
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : isFailed ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3 animate-spin" />
                      )}
                      <span>{doc.status}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 line-clamp-1 mb-1">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mb-3">
                    {doc.fileName}
                  </p>

                  {doc.errorMessage && (
                    <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-tight flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{doc.errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 py-2 border-t border-slate-800/80 mb-4">
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span>{doc._count?.chunks || 0} chunks</span>
                    </div>
                    <div>
                      <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => onOpenDocumentModal(doc.id)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700/60 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Text</span>
                  </button>

                  {isFailed && (
                    <button
                      onClick={(e) => handleRetry(doc.id, e)}
                      disabled={retryingId === doc.id}
                      className="py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Retry processing pipeline"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          retryingId === doc.id ? "animate-spin" : ""
                        }`}
                      />
                      <span>Retry</span>
                    </button>
                  )}

                  <button
                    onClick={() => onConfirmDelete(doc.id, doc.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                    title="Delete document and remove all chunks"
                  >
                    <Trash2 className="w-4 h-4" />
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
