import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteNote } from "@/lib/deletion";
import { generateEmbedding } from "@/lib/embeddings";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    const note = await db.note.findUnique({
      where: { id },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    if (note.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access to note." }, { status: 403 });
    }

    return NextResponse.json({ note });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;
    const body = await req.json();

    const existing = await db.note.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access to note." }, { status: 403 });
    }

    const {
      title = existing.title,
      content = existing.content,
      category = existing.category,
      tags = JSON.parse(existing.tagsJson || "[]"),
      isIndexed = existing.isIndexed,
      retentionPolicy = existing.retentionPolicy,
    } = body;

    let embeddingJson = existing.embeddingJson;
    if (isIndexed && (title !== existing.title || content !== existing.content)) {
      const emb = await generateEmbedding(`${title}\n${content}`);
      embeddingJson = JSON.stringify(emb);
    } else if (!isIndexed) {
      embeddingJson = null;
    }

    const updated = await db.note.update({
      where: { id },
      data: {
        title: title.trim(),
        content: content || "",
        category: category.trim(),
        tagsJson: JSON.stringify(tags),
        isIndexed,
        retentionPolicy,
        embeddingJson,
      },
    });

    return NextResponse.json({ note: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    const result = await deleteNote(id, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete note." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Note deleted successfully." });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
