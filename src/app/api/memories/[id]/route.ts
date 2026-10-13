import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteMemory } from "@/lib/deletion";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    const memory = await db.memory.findUnique({
      where: { id },
      include: {
        sources: {
          include: {
            document: { select: { title: true } },
            note: { select: { title: true } },
          },
        },
      },
    });

    if (!memory) {
      return NextResponse.json({ error: "Memory not found." }, { status: 404 });
    }

    if (memory.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    return NextResponse.json({ memory });
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

    const existing = await db.memory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Memory not found." }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const {
      content = existing.content,
      category = existing.category,
      isPersistent = existing.isPersistent,
      retentionPolicy = existing.retentionPolicy,
    } = body;

    const updated = await db.memory.update({
      where: { id },
      data: {
        content: content.trim(),
        category,
        isPersistent,
        retentionPolicy,
      },
    });

    return NextResponse.json({ memory: updated });
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

    const result = await deleteMemory(id, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete memory." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Memory removed." });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
