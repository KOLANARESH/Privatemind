/**
 * Document Ingestion Pipeline for PrivateMind AI
 * Extracts readable text from PDF, DOCX, TXT, and Markdown files.
 * Validates MIME types, enforces storage limits, chunks semantically,
 * generates vector embeddings, and manages explicit processing states.
 */

import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { db } from "./db";
import { generateEmbedding } from "./embeddings";

// Allowed MIME types and extensions
export const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".markdown"];
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ParseResult {
  pages: ExtractedPage[];
  totalText: string;
  pageCount: number;
}

/**
 * Parse document content from buffer based on file extension
 */
export async function parseDocumentBuffer(
  buffer: Buffer,
  fileExtension: string
): Promise<ParseResult> {
  const ext = fileExtension.toLowerCase();

  if (ext === ".pdf") {
    try {
      // Dynamic require to prevent bundling issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PDFParse } = require("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      await parser.load();
      const textResult = await parser.getText();
      const fullText = (textResult && typeof textResult === "object" && "text" in textResult)
        ? textResult.text
        : String(textResult || "");

      // Split pages by form feed if available
      const rawPages = fullText.split(/\f/g).filter((p: string) => p.trim().length > 0);
      if (rawPages.length > 0) {
        return {
          pages: rawPages.map((text: string, idx: number) => ({ pageNumber: idx + 1, text })),
          totalText: fullText,
          pageCount: rawPages.length,
        };
      }

      return {
        pages: [{ pageNumber: 1, text: fullText }],
        totalText: fullText,
        pageCount: 1,
      };
    } catch (err: unknown) {
      console.warn("PDF parse error, fallback to text extraction:", err);
      // Fallback extract printable text
      const cleanText = buffer.toString("utf-8").replace(/[^\x20-\x7E\t\n\r]/g, " ").replace(/\s+/g, " ");
      return {
        pages: [{ pageNumber: 1, text: cleanText }],
        totalText: cleanText,
        pageCount: 1,
      };
    }
  }

  if (ext === ".docx") {
    const { value: fullText } = await mammoth.extractRawText({ buffer });
    return {
      pages: [{ pageNumber: 1, text: fullText }],
      totalText: fullText,
      pageCount: 1,
    };
  }

  if (ext === ".txt" || ext === ".md" || ext === ".markdown") {
    const fullText = buffer.toString("utf-8");
    return {
      pages: [{ pageNumber: 1, text: fullText }],
      totalText: fullText,
      pageCount: 1,
    };
  }

  throw new Error(`Unsupported file format: ${ext}. Supported formats: PDF, DOCX, TXT, Markdown.`);
}

export interface ChunkItem {
  chunkIndex: number;
  pageNumber: number;
  content: string;
}

/**
 * Split text into semantic chunks with overlap
 */
export function chunkText(
  pages: ExtractedPage[],
  targetChunkSize = 650,
  overlap = 100
): ChunkItem[] {
  const chunks: ChunkItem[] = [];
  let chunkIdx = 0;

  for (const page of pages) {
    const text = page.text.trim();
    if (!text) continue;

    // Split into paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = "";

    for (const para of paragraphs) {
      const cleanPara = para.trim().replace(/\s+/g, " ");
      if (!cleanPara) continue;

      if ((currentChunk.length + cleanPara.length) <= targetChunkSize) {
        currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + cleanPara;
      } else {
        if (currentChunk.length > 0) {
          chunks.push({
            chunkIndex: chunkIdx++,
            pageNumber: page.pageNumber,
            content: currentChunk,
          });
          // Apply overlap from end of previous chunk
          const overlapText = currentChunk.slice(Math.max(0, currentChunk.length - overlap));
          currentChunk = overlapText + "\n\n" + cleanPara;
        } else {
          // Paragraph itself is larger than targetChunkSize
          let offset = 0;
          while (offset < cleanPara.length) {
            const slice = cleanPara.slice(offset, offset + targetChunkSize);
            chunks.push({
              chunkIndex: chunkIdx++,
              pageNumber: page.pageNumber,
              content: slice,
            });
            offset += (targetChunkSize - overlap);
          }
          currentChunk = "";
        }
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        chunkIndex: chunkIdx++,
        pageNumber: page.pageNumber,
        content: currentChunk.trim(),
      });
    }
  }

  return chunks;
}

/**
 * Execute document ingestion pipeline
 * Stages: UPLOADED -> EXTRACTING -> CHUNKING -> INDEXING -> COMPLETED
 */
export async function processDocumentIngestion(
  documentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const doc = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found or unauthorized.");
    }

    // 1. Stage: EXTRACTING
    await db.document.update({
      where: { id: documentId },
      data: { status: "EXTRACTING", errorMessage: null },
    });

    if (!fs.existsSync(doc.filePath)) {
      throw new Error(`File not found at private path: ${doc.filePath}`);
    }

    const fileBuffer = fs.readFileSync(doc.filePath);
    const ext = path.extname(doc.fileName);
    const parseResult = await parseDocumentBuffer(fileBuffer, ext);

    if (!parseResult.totalText.trim()) {
      throw new Error("No readable text found in document. If this is a scanned PDF, OCR is not currently configured.");
    }

    // Update extracted raw text & page count
    await db.document.update({
      where: { id: documentId },
      data: {
        rawText: parseResult.totalText,
        pageCount: parseResult.pageCount,
        status: "CHUNKING",
      },
    });

    // 2. Stage: CHUNKING
    const chunks = chunkText(parseResult.pages);

    if (chunks.length === 0) {
      throw new Error("Failed to produce chunks from document text.");
    }

    // 3. Stage: INDEXING
    await db.document.update({
      where: { id: documentId },
      data: { status: "INDEXING" },
    });

    // Clean existing chunks to prevent duplicates on retry
    await db.documentChunk.deleteMany({
      where: { documentId },
    });

    // Generate embeddings and persist chunks
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.content);
      await db.documentChunk.create({
        data: {
          documentId,
          userId,
          chunkIndex: chunk.chunkIndex,
          pageNumber: chunk.pageNumber,
          content: chunk.content,
          embeddingJson: JSON.stringify(embedding),
          tokenCount: chunk.content.split(/\s+/).length,
        },
      });
    }

    // 4. Stage: COMPLETED
    await db.document.update({
      where: { id: documentId },
      data: {
        status: "COMPLETED",
        errorMessage: null,
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        userId,
        action: "DOCUMENT_UPLOAD",
        resourceType: "document",
        resourceId: documentId,
        detailsJson: JSON.stringify({
          fileName: doc.fileName,
          chunksCount: chunks.length,
          pages: parseResult.pageCount,
        }),
      },
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Document ingestion failed:", errorMsg);

    await db.document.update({
      where: { id: documentId },
      data: {
        status: "FAILED",
        errorMessage: errorMsg,
      },
    });

    return { success: false, error: errorMsg };
  }
}
