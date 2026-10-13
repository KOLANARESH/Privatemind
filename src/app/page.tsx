"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, NavTab } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { LandingView } from "@/components/LandingView";
import { DashboardView } from "@/components/DashboardView";
import { DocumentsView } from "@/components/DocumentsView";
import { NotesView } from "@/components/NotesView";
import { ChatView } from "@/components/ChatView";
import { MemoryView } from "@/components/MemoryView";
import { SettingsView } from "@/components/SettingsView";
import { UploadModal } from "@/components/UploadModal";
import { DocumentModal } from "@/components/DocumentModal";
import { NoteModal } from "@/components/NoteModal";
import { MemoryModal } from "@/components/MemoryModal";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [externalAiAllowed, setExternalAiAllowed] = useState(true);

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [inspectDocId, setInspectDocId] = useState<string | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);

  // Confirm delete modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const fetchSession = () => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
        if (data.privacySettings) {
          setExternalAiAllowed(data.privacySettings.allowExternalAiProcessing);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchSession();
  }, [refreshKey]);

  const handleUserSwitch = async (targetUserId: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
        // Reload page to reflect user-isolated database scope
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to switch user:", err);
    }
  };

  // Document Deletion
  const promptDeleteDocument = (docId: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Document",
      message: `Are you sure you want to permanently delete "${title}"? This will atomically remove the raw file, extracted text, chunks, vector embeddings, and memory provenance links.`,
      confirmLabel: "Delete Document",
      onConfirm: async () => {
        try {
          await fetch(`/api/documents/${docId}`, { method: "DELETE" });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setRefreshKey((k) => k + 1);
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  // Note Deletion
  const promptDeleteNote = (noteId: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Personal Note",
      message: `Are you sure you want to delete note "${title}"? This action cannot be undone.`,
      confirmLabel: "Delete Note",
      onConfirm: async () => {
        try {
          await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setRefreshKey((k) => k + 1);
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  // Memory Deletion
  const promptDeleteMemory = (memoryId: string, label: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Memory",
      message: `Are you sure you want to remove this memory record? (${label})`,
      confirmLabel: "Remove Memory",
      onConfirm: async () => {
        try {
          await fetch(`/api/memories/${memoryId}`, { method: "DELETE" });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setRefreshKey((k) => k + 1);
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  // Bulk Clear Memories
  const promptBulkClearMemories = () => {
    setConfirmModal({
      isOpen: true,
      title: "Clear All Persistent Memories",
      message:
        "Are you sure you want to erase ALL persistent memories in your vault? This will reset the assistant's long-term retention of your preferences and facts.",
      confirmLabel: "Erase All Memories",
      onConfirm: async () => {
        try {
          await fetch("/api/memories", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirmAll: true }),
          });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setRefreshKey((k) => k + 1);
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Layout */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          activeTab={activeTab}
          onOpenMobile={() => setMobileMenuOpen(true)}
          currentUser={currentUser}
          onUserSwitch={handleUserSwitch}
          externalAiAllowed={externalAiAllowed}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === "landing" && (
            <LandingView onGetStarted={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === "dashboard" && (
            <DashboardView
              key={`dash-${refreshKey}`}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenUpload={() => setUploadModalOpen(true)}
              onOpenCreateNote={() => {
                setEditingNoteId(null);
                setNoteModalOpen(true);
              }}
            />
          )}

          {activeTab === "documents" && (
            <DocumentsView
              key={`docs-${refreshKey}`}
              onOpenUpload={() => setUploadModalOpen(true)}
              onOpenDocumentModal={(id) => setInspectDocId(id)}
              onConfirmDelete={promptDeleteDocument}
            />
          )}

          {activeTab === "notes" && (
            <NotesView
              key={`notes-${refreshKey}`}
              onOpenCreate={() => {
                setEditingNoteId(null);
                setNoteModalOpen(true);
              }}
              onOpenEdit={(id) => {
                setEditingNoteId(id);
                setNoteModalOpen(true);
              }}
              onConfirmDelete={promptDeleteNote}
            />
          )}

          {activeTab === "chat" && (
            <ChatView
              key={`chat-${refreshKey}`}
              onOpenDocumentModal={(id) => setInspectDocId(id)}
            />
          )}

          {activeTab === "memory" && (
            <MemoryView
              key={`mem-${refreshKey}`}
              onOpenCreate={() => {
                setEditingMemoryId(null);
                setMemoryModalOpen(true);
              }}
              onOpenEdit={(id) => {
                setEditingMemoryId(id);
                setMemoryModalOpen(true);
              }}
              onConfirmDelete={promptDeleteMemory}
              onConfirmBulkClear={promptBulkClearMemories}
            />
          )}

          {activeTab === "settings" && <SettingsView key={`set-${refreshKey}`} />}
        </main>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <DocumentModal
        documentId={inspectDocId}
        onClose={() => setInspectDocId(null)}
        onRetry={async (id) => {
          await fetch(`/api/documents/${id}/retry`, { method: "POST" });
          setRefreshKey((k) => k + 1);
        }}
      />

      <NoteModal
        isOpen={noteModalOpen}
        noteId={editingNoteId}
        onClose={() => setNoteModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <MemoryModal
        isOpen={memoryModalOpen}
        memoryId={editingMemoryId}
        onClose={() => setMemoryModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
