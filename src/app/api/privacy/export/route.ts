import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();

    const [documents, notes, memories, conversations, auditEvents] = await Promise.all([
      db.document.findMany({
        where: { userId: user.id },
        include: {
          chunks: {
            select: {
              chunkIndex: true,
              pageNumber: true,
              content: true,
            },
          },
        },
      }),
      db.note.findMany({
        where: { userId: user.id },
      }),
      db.memory.findMany({
        where: { userId: user.id },
        include: { sources: true },
      }),
      db.conversation.findMany({
        where: { userId: user.id },
        include: { messages: true },
      }),
      db.auditEvent.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    const exportPayload = {
      exportMetadata: {
        application: "PrivateMind AI",
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        user: { id: user.id, email: user.email, name: user.name },
      },
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title,
        fileName: d.fileName,
        fileType: d.fileType,
        fileSize: d.fileSize,
        pageCount: d.pageCount,
        status: d.status,
        rawText: d.rawText,
        chunks: d.chunks,
        createdAt: d.createdAt,
      })),
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        category: n.category,
        tags: JSON.parse(n.tagsJson || "[]"),
        retentionPolicy: n.retentionPolicy,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
      memories: memories.map((m) => ({
        id: m.id,
        content: m.content,
        category: m.category,
        isPersistent: m.isPersistent,
        retentionPolicy: m.retentionPolicy,
        sourceSummary: m.sourceSummary,
        createdAt: m.createdAt,
      })),
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
        messages: c.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          sources: msg.sourcesJson ? JSON.parse(msg.sourcesJson) : [],
          evidenceQuality: msg.evidenceQuality,
          createdAt: msg.createdAt,
        })),
      })),
      auditLog: auditEvents,
    };

    await db.auditEvent.create({
      data: {
        userId: user.id,
        action: "DATA_EXPORT",
        resourceType: "settings",
        detailsJson: JSON.stringify({
          documentsCount: documents.length,
          notesCount: notes.length,
          memoriesCount: memories.length,
        }),
      },
    });

    const jsonString = JSON.stringify(exportPayload, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="privatemind_vault_export_${Date.now()}.json"`,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
