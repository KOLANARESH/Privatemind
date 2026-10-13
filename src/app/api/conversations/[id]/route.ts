import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    if (conversation.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    return NextResponse.json({ conversation });
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

    const conv = await db.conversation.findUnique({
      where: { id },
    });

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    if (conv.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    await db.conversation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Conversation deleted." });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
