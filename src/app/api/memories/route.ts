import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clearAllMemories } from "@/lib/deletion";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {
      userId: user.id, // STRICT USER ISOLATION
    };

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (search.trim()) {
      where.content = { contains: search };
    }

    const memories = await db.memory.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        sources: {
          include: {
            document: { select: { title: true } },
            note: { select: { title: true } },
          },
        },
      },
    });

    const privacySettings = await db.privacySetting.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      memories,
      persistentMemoryEnabled: privacySettings ? privacySettings.persistentMemoryEnabled : true,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    const body = await req.json();

    const {
      content,
      category = "fact",
      isPersistent = true,
      retentionPolicy = "indefinite",
      sourceSummary = "Manual user entry",
      documentId,
      noteId,
      conversationId,
    } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Memory content is required." }, { status: 400 });
    }

    // Check if persistent memory is disabled by user policy
    const privacySettings = await db.privacySetting.findUnique({
      where: { userId: user.id },
    });

    if (privacySettings && !privacySettings.persistentMemoryEnabled && isPersistent) {
      return NextResponse.json(
        {
          error: "Persistent memory is currently disabled in your Privacy Settings. Enable persistent memory to save this record.",
          disabledByPolicy: true,
        },
        { status: 403 }
      );
    }

    const memory = await db.memory.create({
      data: {
        userId: user.id,
        content: content.trim(),
        category,
        isPersistent,
        retentionPolicy,
        sourceSummary,
        confidence: 1.0,
      },
    });

    // If source provenance provided, link it
    if (documentId || noteId || conversationId) {
      await db.memorySource.create({
        data: {
          memoryId: memory.id,
          documentId,
          noteId,
          conversationId,
          excerpt: content.trim().slice(0, 200),
        },
      });
    }

    await db.auditEvent.create({
      data: {
        userId: user.id,
        action: "MEMORY_CREATE",
        resourceType: "memory",
        resourceId: memory.id,
        detailsJson: JSON.stringify({ category, isPersistent }),
      },
    });

    return NextResponse.json({ memory });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();
    const body = await req.json();

    if (!body.confirmAll) {
      return NextResponse.json(
        { error: "Bulk deletion requires explicit confirmation ('confirmAll: true')." },
        { status: 400 }
      );
    }

    const result = await clearAllMemories(user.id);
    return NextResponse.json({ success: result.success, message: "All persistent memories cleared." });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
