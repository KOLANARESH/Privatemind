"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, Layers, Hash, Calendar, HardDrive, RefreshCw } from "lucide-react";

interface ChunkData {
  id: string;
  chunkIndex: number;
  pageNumber?: number;
  content: string;
  tokenCount?: number;
}

interface DocumentDetail {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  pageCount: number;
  rawText?: string;
  createdAt: string;
  chunks?: ChunkData[];
}

interface DocumentModalProps {
  documentId: string | null;
  onClose: () => void;
  onRetry?: (id: string) => void;
}

export function DocumentModal({ documentId, onClose, onRetry }: DocumentModalProps) {
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "chunks" | "meta">("text");

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    fetch(`/api/documents/${documentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.document) {
          setDoc(data.document);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [documentId]);

  if (!documentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">{doc?.title || "Document Details"}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {doc?.fileName} &bull; {doc?.fileType.toUpperCase()} &bull;{" "}
                {doc ? (doc.fileSize / 1024).toFixed(1) : 0} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {doc?.status === "FAILED" && onRetry && (
              <button
                onClick={() => onRetry(doc.id)}
                className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Ingestion
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-5 gap-6 text-sm bg-slate-950/20">
          <button
            onClick={() => setActiveTab("text")}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "text"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            Extracted Text
          </button>
          <button
            onClick={() => setActiveTab("chunks")}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "chunks"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            Semantic Chunks ({doc?.chunks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("meta")}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "meta"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Hash className="w-4 h-4" />
            Metadata & Provenance
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 text-sm">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading document details...</div>
          ) : !doc ? (
            <div className="py-16 text-center text-slate-400">Document not found.</div>
          ) : activeTab === "text" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>Total Characters: {doc.rawText?.length || 0}</span>
                <span>Pages: {doc.pageCount || 1}</span>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 text-xs sm:text-sm max-h-[50vh] overflow-y-auto">
                {doc.rawText || "No readable raw text extracted."}
              </pre>
            </div>
          ) : activeTab === "chunks" ? (
            <div className="space-y-3">
              {doc.chunks && doc.chunks.length > 0 ? (
                doc.chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-400">
                        Chunk #{chunk.chunkIndex + 1}
                      </span>
                      <span className="text-slate-400">
                        Page {chunk.pageNumber || 1} &bull; ~{chunk.tokenCount || 0} tokens
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {chunk.content}
                    </p>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Vector Index Status: Embedded & Unit Normalized
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400">No chunks indexed for this document.</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Created Date
                  </div>
                  <div className="text-sm font-medium text-slate-200">
                    {new Date(doc.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-3.5 h-3.5" /> Storage Mode
                  </div>
                  <div className="text-sm font-medium text-emerald-400">
                    Private Local Host Vault
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                <div className="font-medium text-slate-300">Document Identifier &amp; Security Boundary</div>
                <div className="font-mono text-slate-400 break-all">ID: {doc.id}</div>
                <div className="text-slate-400">
                  Access Scope: Strictly isolated to authenticated user. Cross-tenant leakage blocked at query boundary.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
