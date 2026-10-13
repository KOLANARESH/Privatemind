"use client";

import React, { useState } from "react";
import { Menu, User, ShieldCheck, ChevronDown, Check, Lock, Cpu } from "lucide-react";
import { NavTab } from "./Sidebar";

interface HeaderProps {
  activeTab: NavTab;
  onOpenMobile: () => void;
  currentUser: { id: string; email: string; name: string } | null;
  onUserSwitch: (userId: string) => void;
  externalAiAllowed: boolean;
}

export function Header({
  activeTab,
  onOpenMobile,
  currentUser,
  onUserSwitch,
  externalAiAllowed,
}: HeaderProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    landing: {
      title: "PrivateMind AI",
      subtitle: "Privacy-First Personal Knowledge Vault",
    },
    dashboard: {
      title: "Vault Dashboard",
      subtitle: "Live storage metrics, indexed documents & personal records",
    },
    documents: {
      title: "Document Library",
      subtitle: "Private file storage, extraction pipeline & semantic chunks",
    },
    notes: {
      title: "Personal Notes",
      subtitle: "Local note taking with semantic indexing & tags",
    },
    chat: {
      title: "Ask PrivateMind",
      subtitle: "Conversational knowledge assistant with source citations",
    },
    memory: {
      title: "Memory Center",
      subtitle: "Inspect, edit, toggle, and clear persistent personal memories",
    },
    settings: {
      title: "Privacy & Architecture Settings",
      subtitle: "Memory retention, Lyzr Studio agent integration & data lifecycle",
    },
  };

  const users = [
    { id: "user-alex-primary", name: "Alex Vance", email: "alex@privatemind.ai", role: "Primary Vault" },
    { id: "user-taylor-secondary", name: "Taylor Smith", email: "taylor@privatemind.ai", role: "Isolated User B" },
  ];

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg lg:hidden"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-semibold text-slate-100 flex items-center gap-2">
            {tabTitles[activeTab]?.title}
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            {tabTitles[activeTab]?.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* External AI Processing Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700/60 text-slate-300">
          <Cpu className={`w-3.5 h-3.5 ${externalAiAllowed ? "text-emerald-400" : "text-amber-400"}`} />
          <span>
            {externalAiAllowed ? "Lyzr Studio Active" : "Local Grounded Mode"}
          </span>
        </div>

        {/* User Switcher (Multi-Tenant Verification) */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs sm:text-sm text-slate-200 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
              {currentUser?.name?.charAt(0) || "U"}
            </div>
            <span className="font-medium hidden sm:inline">{currentUser?.name || "User"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Switch Active User</span>
                <Lock className="w-3 h-3 text-emerald-400" />
              </div>

              <div className="py-1 space-y-1">
                {users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        onUserSwitch(u.id);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        isCurrent
                          ? "bg-emerald-500/10 text-emerald-300 font-medium border border-emerald-500/20"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-slate-200">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.role} &bull; {u.email}</div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="p-2 border-t border-slate-800 text-[10px] text-slate-400">
                Switch users to test verifiable cross-tenant database isolation.
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
