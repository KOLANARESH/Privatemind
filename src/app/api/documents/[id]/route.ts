import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteDocument } from "@/lib/deletion";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    const document = await db.document.findUnique({
      where: { id },
      include: {
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            pageNumber: true,
            content: true,
            tokenCount: true,
          },
          orderBy: { chunkIndex: "asc" },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access to document" }, { status: 403 });
    }

    return NextResponse.json({ document });
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

    const result = await deleteDocument(id, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Deletion failed" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Document, chunks, files, and index records successfully removed.",
      deletedChunksCount: result.deletedChunksCount,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
