/**
 * Source-Grounded Retrieval-Augmented Generation (RAG) Pipeline
 * Enforces strict user authorization, relevance thresholds, citation attribution,
 * prompt-injection defenses, and honest insufficient-evidence responses.
 */

import { db } from "./db";
import { generateEmbedding, cosineSimilarity, bm25KeywordScore } from "./embeddings";
import { callLyzrAgent } from "./lyzr";

export interface CitationSource {
  id: string;
  type: "document" | "note" | "memory";
  title: string;
  pageNumber?: number;
  excerpt: string;
  relevanceScore: number;
  recordId: string;
}

export interface RagResult {
  answer: string;
  sources: CitationSource[];
  evidenceQuality: "HIGH" | "MODERATE" | "INSUFFICIENT";
  insufficientEvidence: boolean;
  retrievalMode: "VECTOR" | "KEYWORD_FALLBACK";
  providerUsed: "lyzr-studio" | "local-deterministic";
  activeMemoriesCount: number;
}

export interface RagQueryOptions {
  userId: string;
  query: string;
  scopeType?: "all" | "selected_docs" | "category";
  scopeDocumentIds?: string[];
  scopeCategory?: string;
  conversationId?: string;
}

/**
 * Sanitize untrusted user document text to neutralize prompt injections
 */
function sanitizeUntrustedText(text: string): string {
  // Strip hidden instruction tags or system override attempts
  return text
    .replace(/ignore (all )?(previous|system) (instructions|prompts|rules)/gi, "[redacted override attempt]")
    .replace(/you are now (in developer mode|DAN|unrestricted)/gi, "[redacted role override]")
    .replace(/reveal (all )?(system|internal|secret) (keys|passwords|prompts)/gi, "[redacted secret leak attempt]");
}

export async function executeRagQuery(options: RagQueryOptions): Promise<RagResult> {
  const { userId, query, scopeType = "all", scopeDocumentIds, scopeCategory } = options;

  // 1. Fetch user privacy settings
  const privacySettings = await db.privacySetting.findUnique({
    where: { userId },
  });

  const persistentMemoryEnabled = privacySettings ? privacySettings.persistentMemoryEnabled : true;
  const allowExternalAi = privacySettings ? privacySettings.allowExternalAiProcessing : true;

  // 2. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  const preferredEngine = process.env.EMBEDDING_PROVIDER || "local-vector";

  // 3. Query authorized Document Chunks
  const chunkWhere: Record<string, unknown> = {
    userId, // STRICT USER ISOLATION
    document: {
      status: "COMPLETED",
    },
  };

  if (scopeType === "selected_docs" && scopeDocumentIds && scopeDocumentIds.length > 0) {
    chunkWhere.documentId = { in: scopeDocumentIds };
  }

  const documentChunks = await db.documentChunk.findMany({
    where: chunkWhere,
    include: {
      document: {
        select: {
          id: true,
          title: true,
          fileName: true,
        },
      },
    },
    take: 150,
  });

  // 4. Query authorized Notes
  const noteWhere: Record<string, unknown> = {
    userId, // STRICT USER ISOLATION
    isIndexed: true,
  };
  if (scopeType === "category" && scopeCategory) {
    noteWhere.category = scopeCategory;
  }
  const notes = await db.note.findMany({
    where: noteWhere,
    take: 50,
  });

  // 5. Query Persistent Memories (if enabled by user privacy settings)
  let userMemories: { id: string; content: string; category: string }[] = [];
  if (persistentMemoryEnabled) {
    userMemories = await db.memory.findMany({
      where: {
        userId, // STRICT USER ISOLATION
        isPersistent: true,
      },
      select: {
        id: true,
        content: true,
        category: true,
      },
      take: 20,
    });
  }

  const threshold = Number(process.env.SIMILARITY_THRESHOLD) || 0.30;

  // 6. Score candidate items
  interface ScoredCandidate {
    id: string;
    type: "document" | "note" | "memory";
    title: string;
    pageNumber?: number;
    content: string;
    score: number;
    retrievalType: "VECTOR" | "KEYWORD_FALLBACK";
  }

  const scoredCandidates: ScoredCandidate[] = [];

  // Score document chunks
  for (const chunk of documentChunks) {
    let vScore = 0;
    if (chunk.embeddingJson) {
      try {
        const emb = JSON.parse(chunk.embeddingJson) as number[];
        vScore = cosineSimilarity(queryEmbedding, emb);
      } catch {}
    }
    const kScore = bm25KeywordScore(query, chunk.content);
    const score = Math.max(vScore, kScore);
    const mode: "VECTOR" | "KEYWORD_FALLBACK" = vScore >= kScore ? "VECTOR" : "KEYWORD_FALLBACK";

    if (score >= threshold) {
      scoredCandidates.push({
        id: chunk.id,
        type: "document",
        title: chunk.document.title || chunk.document.fileName,
        pageNumber: chunk.pageNumber || 1,
        content: chunk.content,
        score,
        retrievalType: mode,
      });
    }
  }

  // Score notes
  for (const note of notes) {
    let vScore = 0;
    if (note.embeddingJson) {
      try {
        const emb = JSON.parse(note.embeddingJson) as number[];
        vScore = cosineSimilarity(queryEmbedding, emb);
      } catch {}
    }
    const kScore = bm25KeywordScore(query, note.content);
    const score = Math.max(vScore, kScore);
    const mode: "VECTOR" | "KEYWORD_FALLBACK" = vScore >= kScore ? "VECTOR" : "KEYWORD_FALLBACK";

    if (score >= threshold) {
      scoredCandidates.push({
        id: note.id,
        type: "note",
        title: `Note: ${note.title}`,
        content: note.content,
        score,
        retrievalType: mode,
      });
    }
  }

  // Score memories
  for (const mem of userMemories) {
    const memScore = bm25KeywordScore(query, mem.content);
    if (memScore >= 0.38) {
      scoredCandidates.push({
        id: mem.id,
        type: "memory",
        title: `Persistent Memory (${mem.category})`,
        content: mem.content,
        score: memScore,
        retrievalType: "KEYWORD_FALLBACK",
      });
    }
  }

  // Sort candidates by score descending
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Take top 5 candidates
  const topCandidates = scoredCandidates.slice(0, 5);

  // 7. Evaluate Evidence Quality & Check for Insufficient Evidence
  let evidenceQuality: "HIGH" | "MODERATE" | "INSUFFICIENT" = "INSUFFICIENT";
  let insufficientEvidence = false;

  if (topCandidates.length === 0 || topCandidates[0].score < threshold) {
    evidenceQuality = "INSUFFICIENT";
    insufficientEvidence = true;

    return {
      answer: "I could not find sufficient information in your authorized knowledge vault to answer this question. Please verify that relevant documents or notes have been uploaded and indexed.",
      sources: [],
      evidenceQuality: "INSUFFICIENT",
      insufficientEvidence: true,
      retrievalMode: preferredEngine === "local-vector" ? "VECTOR" : "KEYWORD_FALLBACK",
      providerUsed: "local-deterministic",
      activeMemoriesCount: userMemories.length,
    };
  }

  if (topCandidates[0].score >= 0.45) {
    evidenceQuality = "HIGH";
  } else {
    evidenceQuality = "MODERATE";
  }

  // Build Citations
  const sources: CitationSource[] = topCandidates.map((c) => ({
    id: c.id,
    type: c.type,
    title: c.title,
    pageNumber: c.pageNumber,
    excerpt: c.content.slice(0, 220) + (c.content.length > 220 ? "..." : ""),
    relevanceScore: Math.round(c.score * 100) / 100,
    recordId: c.id,
  }));

  // Construct sanitized authorized context
  const contextSections = topCandidates.map((c, i) => {
    const sanitized = sanitizeUntrustedText(c.content);
    const loc = c.pageNumber ? `Page ${c.pageNumber}` : `Record ID: ${c.id}`;
    return `[SOURCE ${i + 1}: "${c.title}" | ${loc}]\n${sanitized}`;
  });

  const fullContextExcerpt = contextSections.join("\n\n---\n\n");

  // Call Lyzr Agent (or fallback local engine)
  const agentResponse = await callLyzrAgent({
    message: query,
    contextExcerpt: fullContextExcerpt,
    allowExternalProcessing: allowExternalAi,
  });

  return {
    answer: agentResponse.response,
    sources,
    evidenceQuality,
    insufficientEvidence: false,
    retrievalMode: topCandidates[0].retrievalType,
    providerUsed: agentResponse.provider,
    activeMemoriesCount: userMemories.length,
  };
}
