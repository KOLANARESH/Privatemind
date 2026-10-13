import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { processDocumentIngestion } from "@/lib/ingestion";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    const document = await db.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const result = await processDocumentIngestion(id, user.id);

    const updated = await db.document.findUnique({
      where: { id },
      include: { _count: { select: { chunks: true } } },
    });

    return NextResponse.json({
      success: result.success,
      error: result.error,
      document: updated,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
