import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();

    // 1. Live counts scoped strictly to current user
    const [documentsCount, notesCount, memoriesCount, conversationsCount] = await Promise.all([
      db.document.count({ where: { userId: user.id } }),
      db.note.count({ where: { userId: user.id } }),
      db.memory.count({ where: { userId: user.id, isPersistent: true } }),
      db.conversation.count({ where: { userId: user.id } }),
    ]);

    // 2. Storage usage
    const documents = await db.document.findMany({
      where: { userId: user.id },
      select: { fileSize: true, status: true },
    });
    const totalStorageBytes = documents.reduce((acc, doc) => acc + (doc.fileSize || 0), 0);

    // 3. Processing status counts
    const processingStatus = {
      completed: documents.filter((d) => d.status === "COMPLETED").length,
      processing: documents.filter((d) => ["EXTRACTING", "CHUNKING", "INDEXING", "UPLOADED"].includes(d.status)).length,
      failed: documents.filter((d) => d.status === "FAILED").length,
    };

    // 4. Recent documents
    const recentDocuments = await db.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        status: true,
        pageCount: true,
        createdAt: true,
      },
    });

    // 5. Recent notes
    const recentNotes = await db.note.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: {
        id: true,
        title: true,
        category: true,
        updatedAt: true,
      },
    });

    // 6. Recent conversations
    const recentConversations = await db.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { content: true, createdAt: true },
        },
      },
    });

    // 7. Recent search audit events
    const recentSearches = await db.auditEvent.findMany({
      where: { userId: user.id, action: "QUERY_SEARCH" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        detailsJson: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user,
      stats: {
        documentsCount,
        notesCount,
        memoriesCount,
        conversationsCount,
        totalStorageBytes,
        processingStatus,
      },
      recentDocuments,
      recentNotes,
      recentConversations,
      recentSearches,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
