import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();

    const conversations = await db.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { messages: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { content: true, createdAt: true, role: true },
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    const body = await req.json();
    const { title = "New Conversation", scopeType = "all", scopeDocumentIds = [], scopeCategory } = body;

    const conv = await db.conversation.create({
      data: {
        userId: user.id,
        title: title.trim(),
        scopeType,
        scopeConfigJson: JSON.stringify({ scopeDocumentIds, scopeCategory }),
      },
    });

    return NextResponse.json({ conversation: conv });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
