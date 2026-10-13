import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { processDocumentIngestion, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from "@/lib/ingestion";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      userId: user.id, // STRICT USER ISOLATION
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search.trim()) {
      where.OR = [
        { title: { contains: search } },
        { fileName: { contains: search } },
      ];
    }

    const documents = await db.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    return NextResponse.json({ documents });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customTitle = (formData.get("title") as string | null) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided for upload." }, { status: 400 });
    }

    // 1. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds limit of 15MB (Current: ${(file.size / (1024 * 1024)).toFixed(1)}MB).` },
        { status: 400 }
      );
    }

    // 2. Validate extension
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type '${ext}'. Please upload PDF, DOCX, TXT, or Markdown.` },
        { status: 400 }
      );
    }

    // 3. Prepare private user storage directory
    const userStorageDir = path.resolve(process.cwd(), "uploads", "vault", user.id);
    if (!fs.existsSync(userStorageDir)) {
      fs.mkdirSync(userStorageDir, { recursive: true });
    }

    const sanitizedBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueFileName = `${Date.now()}_${sanitizedBase}${ext}`;
    const destinationPath = path.join(userStorageDir, uniqueFileName);

    // 4. Save file to private storage
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(destinationPath, Buffer.from(arrayBuffer));

    // 5. Create database record
    const title = customTitle.trim() || path.basename(file.name, ext).replace(/[_-]/g, " ");
    const doc = await db.document.create({
      data: {
        userId: user.id,
        title,
        fileName: file.name,
        fileType: ext.replace(".", ""),
        fileSize: file.size,
        filePath: destinationPath,
        mimeType: file.type || "application/octet-stream",
        status: "UPLOADED",
      },
    });

    // 6. Execute background ingestion pipeline
    // Process synchronously or in microtask to ensure reliable state transition
    const ingestionResult = await processDocumentIngestion(doc.id, user.id);

    const updatedDoc = await db.document.findUnique({
      where: { id: doc.id },
      include: {
        _count: { select: { chunks: true } },
      },
    });

    return NextResponse.json({
      document: updatedDoc,
      ingestionSuccess: ingestionResult.success,
      ingestionError: ingestionResult.error,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
