"use client";

import React from "react";
import {
  Shield,
  LayoutDashboard,
  FileText,
  StickyNote,
  MessageSquareText,
  Brain,
  Sliders,
  Sparkles,
} from "lucide-react";

export type NavTab =
  | "landing"
  | "dashboard"
  | "documents"
  | "notes"
  | "chat"
  | "memory"
  | "settings";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    {
      id: "landing" as NavTab,
      label: "Overview & Vision",
      icon: Sparkles,
      desc: "Brand & Privacy Vision",
    },
    {
      id: "dashboard" as NavTab,
      label: "Dashboard",
      icon: LayoutDashboard,
      desc: "Real Vault Metrics",
    },
    {
      id: "documents" as NavTab,
      label: "Document Library",
      icon: FileText,
      desc: "Upload & Semantic Index",
    },
    {
      id: "notes" as NavTab,
      label: "Personal Notes",
      icon: StickyNote,
      desc: "Private Offline Notes",
    },
    {
      id: "chat" as NavTab,
      label: "Ask PrivateMind",
      icon: MessageSquareText,
      desc: "Source-Grounded RAG",
    },
    {
      id: "memory" as NavTab,
      label: "Memory Center",
      icon: Brain,
      desc: "Persistent Memory Controls",
    },
    {
      id: "settings" as NavTab,
      label: "Privacy Settings",
      icon: Sliders,
      desc: "AI Disclosure & Export",
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900/95 lg:bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-800 flex items-center px-5 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 fill-slate-950 text-slate-950" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-base tracking-tight flex items-center gap-1.5">
              PrivateMind <span className="text-emerald-400 font-extrabold text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">AI</span>
            </div>
            <div className="text-[11px] text-slate-400 tracking-wide">Personal Knowledge Vault</div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                <div className="truncate">
                  <div className="leading-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Security Footer Notice */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Local-Scoped Vault
            </div>
            <p className="text-slate-400 leading-normal">
              Zero unauthorized cloud sync. Hard multi-tenant database isolation.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
