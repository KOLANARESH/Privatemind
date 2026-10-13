/**
 * Deletion & Data Lifecycle Service for PrivateMind AI
 * Coordinates atomic removal of raw files, extracted text, chunks,
 * vector embeddings, linked memory provenance, and audit logging.
 */

import fs from "fs";
import { db } from "./db";

export interface DeletionResult {
  success: boolean;
  deletedChunksCount?: number;
  error?: string;
}

/**
 * Coordinated atomic document deletion
 */
export async function deleteDocument(
  documentId: string,
  userId: string
): Promise<DeletionResult> {
  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { chunks: true },
  });

  if (!doc) {
    return { success: false, error: "Document not found." };
  }

  if (doc.userId !== userId) {
    return { success: false, error: "Unauthorized: You do not own this document." };
  }

  const chunkCount = doc.chunks.length;
  const filePath = doc.filePath;

  // Execute database cleanup within transaction
  await db.$transaction(async (tx) => {
    // 1. Remove memory provenance sources linked to this document
    await tx.memorySource.deleteMany({
      where: {
        OR: [
          { documentId },
          { chunkId: { in: doc.chunks.map((c) => c.id) } },
        ],
      },
    });

    // 2. Remove document processing jobs
    await tx.processingJob.deleteMany({
      where: { documentId },
    });

    // 3. Remove document chunks (and embeddings)
    await tx.documentChunk.deleteMany({
      where: { documentId },
    });

    // 4. Remove document record
    await tx.document.delete({
      where: { id: documentId },
    });

    // 5. Audit event
    await tx.auditEvent.create({
      data: {
        userId,
        action: "DOCUMENT_DELETE",
        resourceType: "document",
        resourceId: documentId,
        detailsJson: JSON.stringify({
          fileName: doc.fileName,
          chunksDeleted: chunkCount,
        }),
      },
    });
  });

  // 6. Remove physical file from private disk storage if present
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (fsErr) {
    console.warn("Failed to delete physical file from disk:", fsErr);
  }

  return { success: true, deletedChunksCount: chunkCount };
}

/**
 * Delete a personal note
 */
export async function deleteNote(noteId: string, userId: string): Promise<DeletionResult> {
  const note = await db.note.findUnique({
    where: { id: noteId },
  });

  if (!note) {
    return { success: false, error: "Note not found." };
  }

  if (note.userId !== userId) {
    return { success: false, error: "Unauthorized: You do not own this note." };
  }

  await db.$transaction(async (tx) => {
    await tx.memorySource.deleteMany({
      where: { noteId },
    });

    await tx.note.delete({
      where: { id: noteId },
    });

    await tx.auditEvent.create({
      data: {
        userId,
        action: "NOTE_DELETE",
        resourceType: "note",
        resourceId: noteId,
        detailsJson: JSON.stringify({ title: note.title }),
      },
    });
  });

  return { success: true };
}

/**
 * Delete a persistent memory
 */
export async function deleteMemory(memoryId: string, userId: string): Promise<DeletionResult> {
  const memory = await db.memory.findUnique({
    where: { id: memoryId },
  });

  if (!memory) {
    return { success: false, error: "Memory not found." };
  }

  if (memory.userId !== userId) {
    return { success: false, error: "Unauthorized: You do not own this memory." };
  }

  await db.$transaction(async (tx) => {
    await tx.memorySource.deleteMany({
      where: { memoryId },
    });

    await tx.memory.delete({
      where: { id: memoryId },
    });

    await tx.auditEvent.create({
      data: {
        userId,
        action: "MEMORY_DELETE",
        resourceType: "memory",
        resourceId: memoryId,
        detailsJson: JSON.stringify({ category: memory.category }),
      },
    });
  });

  return { success: true };
}

/**
 * Clear all persistent memories for user after confirmation
 */
export async function clearAllMemories(userId: string): Promise<DeletionResult> {
  const count = await db.memory.count({ where: { userId } });

  await db.$transaction(async (tx) => {
    const userMems = await tx.memory.findMany({
      where: { userId },
      select: { id: true },
    });

    await tx.memorySource.deleteMany({
      where: { memoryId: { in: userMems.map((m) => m.id) } },
    });

    await tx.memory.deleteMany({
      where: { userId },
    });

    await tx.auditEvent.create({
      data: {
        userId,
        action: "MEMORY_CLEAR",
        resourceType: "memory",
        detailsJson: JSON.stringify({ clearedCount: count }),
      },
    });
  });

  return { success: true };
}
