"use client";

import React from "react";
import {
  Shield,
  Brain,
  Search,
  FileCheck2,
  Lock,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { NavTab } from "./Sidebar";

interface LandingViewProps {
  onGetStarted: (tab: NavTab) => void;
}

export function LandingView({ onGetStarted }: LandingViewProps) {
  const features = [
    {
      icon: Brain,
      title: "Verifiable Persistent Memory",
      badge: "User Controlled",
      desc: "Unlike standard LLMs that covertly log facts, PrivateMind separates temporary session context from persistent memories. View, edit, or clear your memories at any moment.",
    },
    {
      icon: Search,
      title: "Semantic Vector Retrieval",
      badge: "Local-First Embeddings",
      desc: "Upload PDFs, DOCX, Markdown, or write notes. Documents are parsed and indexed into normalized vector chunks with cosine similarity and BM25 fallback.",
    },
    {
      icon: FileCheck2,
      title: "Source-Grounded Citations",
      badge: "Zero Hallucination Tolerance",
      desc: "Answers are synthesized strictly from authorized vault records. Every claim links back to the exact document, page number, and chunk passage.",
    },
    {
      icon: Lock,
      title: "Hard Multi-Tenant Isolation",
      badge: "Strict Server-Side Auth",
      desc: "Data boundaries are enforced at the database query level. User A's files, notes, chunks, and memories can never be queried or accessed by User B.",
    },
    {
      icon: Cpu,
      title: "Lyzr Studio Integration",
      badge: "Configurable AI Provider",
      desc: "Connects securely to your Lyzr Studio Agent with minimum-privilege context forwarding, or toggle offline local synthesis when network privacy is required.",
    },
    {
      icon: Database,
      title: "Complete Data Lifecycle",
      badge: "Right to be Forgotten",
      desc: "Atomic coordinated deletion purges raw disk files, extracted text, chunks, embeddings, and provenance links in a single database transaction.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 border border-slate-800 p-8 sm:p-14 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy-First Personal Knowledge Vault</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-100 tracking-tight max-w-3xl mx-auto leading-[1.15]">
          Your Knowledge. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            Your Control.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Store your documents, research, and personal notes in a secure, user-owned knowledge vault. Ask questions semantically, inspect exact source passages, and maintain full control over your persistent memory.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onGetStarted("chat")}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Ask PrivateMind</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onGetStarted("dashboard")}
            className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium text-sm transition-colors"
          >
            Explore Dashboard
          </button>
        </div>

        {/* Verification Strip */}
        <div className="mt-12 pt-8 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/40">
            <div className="text-xs font-medium text-slate-400">Memory Policy</div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5">Opt-In &amp; Editable</div>
          </div>
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/40">
            <div className="text-xs font-medium text-slate-400">Search Engine</div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5">Cosine + BM25</div>
          </div>
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/40">
            <div className="text-xs font-medium text-slate-400">RAG Grounding</div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5">Page &amp; Chunk Citations</div>
          </div>
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/40">
            <div className="text-xs font-medium text-slate-400">AI Integration</div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5">Lyzr Studio Ready</div>
          </div>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div>
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Engineered for Verifiable Privacy
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
            Privacy is not a visual badge or an afterthought—it is embedded into every query, ingestion pipeline, and memory lifecycle operation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-black/20 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-slate-800 border border-slate-700/60 text-emerald-400 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Honest Privacy Disclaimer */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-2">
        <div className="font-semibold text-slate-300 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Honest Architectural Disclosure
        </div>
        <p className="leading-relaxed">
          PrivateMind AI does not claim fictional absolute security or magical client-side black boxes. Our architecture stores documents in local host-bound vaults, executes semantic embedding projections locally, verifies user authorization on every single server request, and isolates multi-tenant records in the database. When external AI is enabled, only minimized authorized evidence excerpts are transmitted to Lyzr Studio via TLS. You can disable external AI processing at any time in Privacy Settings.
        </p>
      </div>
    </div>
  );
}
