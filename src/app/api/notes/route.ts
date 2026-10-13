import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";

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
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const notes = await db.note.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ notes });
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
      title,
      content,
      category = "General",
      tags = [],
      isIndexed = true,
      retentionPolicy = "indefinite",
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Note title is required." }, { status: 400 });
    }

    let embeddingJson: string | null = null;
    if (isIndexed && content) {
      const emb = await generateEmbedding(`${title}\n${content}`);
      embeddingJson = JSON.stringify(emb);
    }

    const note = await db.note.create({
      data: {
        userId: user.id,
        title: title.trim(),
        content: content || "",
        category: category.trim() || "General",
        tagsJson: JSON.stringify(tags),
        isIndexed,
        retentionPolicy,
        embeddingJson,
      },
    });

    await db.auditEvent.create({
      data: {
        userId: user.id,
        action: "NOTE_CREATE",
        resourceType: "note",
        resourceId: note.id,
        detailsJson: JSON.stringify({ title: note.title, category: note.category }),
      },
    });

    return NextResponse.json({ note });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
