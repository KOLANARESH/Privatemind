"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Shield,
  Download,
  Trash2,
  Lock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Key,
  HardDrive,
  RefreshCw,
  Eye,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface PrivacySettingsData {
  settings: {
    persistentMemoryEnabled: boolean;
    allowExternalAiProcessing: boolean;
    defaultRetentionDays: number;
    preferredAiProvider: string;
    lyzrAgentId?: string;
  };
  providerInfo: {
    lyzrAgentId: string;
    lyzrApiKeyConfigured: boolean;
    lyzrUserId: string;
    endpoint: string;
    storageLocation: string;
    encryptionAtRest: string;
  };
  aiProcessingDisclosure: {
    whenExternalEnabled: string;
    whenExternalDisabled: string;
  };
}

interface AuditItem {
  id: string;
  action: string;
  resourceType: string;
  detailsJson?: string | null;
  createdAt: string;
}

export function SettingsView() {
  const [data, setData] = useState<PrivacySettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [exporting, setExporting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchSettings = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/privacy").then((r) => r.json()),
      fetch("/api/audit?limit=25").then((r) => r.json()),
    ])
      .then(([privData, auditData]) => {
        setData(privData);
        setAuditLogs(auditData.auditEvents || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (patch: Partial<PrivacySettingsData["settings"]>) => {
    if (!data) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      if (updated.settings) {
        setData((prev) => (prev ? { ...prev, settings: updated.settings } : prev));
        setSaveMessage("Settings successfully persisted.");
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    setExporting(true);
    window.location.href = "/api/privacy/export";
    setTimeout(() => setExporting(false), 2000);
  };

  if (loading || !data) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-7 h-7 animate-spin mx-auto text-emerald-400" />
        <p className="text-xs sm:text-sm text-slate-400">Loading privacy settings...</p>
      </div>
    );
  }

  const { settings, providerInfo, aiProcessingDisclosure } = data;

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {saveMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* 1. External AI Processing & Lyzr Disclosure */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">External AI Processing Disclosure</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Control whether outbound requests are sent to Lyzr Studio or handled 100% locally.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={settings.allowExternalAiProcessing}
              onChange={(e) => handleUpdate({ allowExternalAiProcessing: e.target.checked })}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
          <div className="font-semibold text-slate-200">Practical Effect of this setting:</div>
          <p>
            {settings.allowExternalAiProcessing
              ? aiProcessingDisclosure.whenExternalEnabled
              : aiProcessingDisclosure.whenExternalDisabled}
          </p>
        </div>

        {/* Connected Provider Status */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-300">Connected AI Infrastructure:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Provider:</span>
              <span className="font-medium text-slate-200">Lyzr Studio Agent Engine</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Agent Identifier:</span>
              <span className="font-mono text-emerald-400">{providerInfo.lyzrAgentId}</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">API Key Status:</span>
              <span className="font-medium text-emerald-400">
                {providerInfo.lyzrApiKeyConfigured ? "Server-side Secret Configured" : "Missing / Unset"}
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Inference Endpoint:</span>
              <span className="font-mono text-slate-300 text-[10px] truncate block">
                {providerInfo.endpoint}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Persistent Memory & Retention Preferences */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Persistent Memory &amp; Retention</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage long-term knowledge retention and automated cleanup limits.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={settings.persistentMemoryEnabled}
              onChange={(e) => handleUpdate({ persistentMemoryEnabled: e.target.checked })}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <div>
            <div className="font-medium text-slate-200">Default Data Retention Policy</div>
            <div className="text-slate-400 text-[11px]">Automatically purge records after the configured threshold.</div>
          </div>
          <select
            value={settings.defaultRetentionDays}
            onChange={(e) => handleUpdate({ defaultRetentionDays: Number(e.target.value) })}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
          >
            <option value={0}>Indefinite (No automatic expiration)</option>
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
            <option value={365}>1 Year</option>
          </select>
        </div>
      </div>

      {/* 3. Data Export & Right to be Forgotten */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Data Portability &amp; Vault Export</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Export all user documents, extracted text, personal notes, memories, and audit logs.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-medium text-slate-200">Download Full JSON Archive</div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Structured machine-readable snapshot formatted for GDPR compliance and personal backups.
            </p>
          </div>

          <button
            onClick={handleExportData}
            disabled={exporting}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 shrink-0 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? "Generating Export..." : "Export Vault (JSON)"}</span>
          </button>
        </div>
      </div>

      {/* 4. Verifiable Security Audit Log */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Security Audit Trail</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tamper-evident operational events. Raw private bodies and API secrets are never logged.
              </p>
            </div>
          </div>
        </div>

        <div className="border border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto text-xs">
          {auditLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-400">No audit events recorded yet.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">Metadata</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 font-mono font-medium text-emerald-400">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 capitalize">
                      {log.resourceType}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px] truncate max-w-xs">
                      {log.detailsJson || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
