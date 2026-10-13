import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { executeRagQuery } from "@/lib/rag";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    const body = await req.json();

    const {
      query,
      conversationId: incomingConvId,
      scopeType = "all",
      scopeDocumentIds = [],
      scopeCategory,
    } = body;

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Query cannot be empty." }, { status: 400 });
    }

    // 1. Resolve or create conversation
    let convId = incomingConvId;
    if (!convId) {
      const newConv = await db.conversation.create({
        data: {
          userId: user.id,
          title: query.trim().slice(0, 48) + (query.length > 48 ? "..." : ""),
          scopeType,
          scopeConfigJson: JSON.stringify({ scopeDocumentIds, scopeCategory }),
        },
      });
      convId = newConv.id;
    } else {
      // Verify conversation ownership
      const existingConv = await db.conversation.findUnique({
        where: { id: convId },
      });
      if (!existingConv || existingConv.userId !== user.id) {
        return NextResponse.json({ error: "Unauthorized conversation access." }, { status: 403 });
      }
    }

    // 2. Save user message
    await db.conversationMessage.create({
      data: {
        conversationId: convId,
        role: "user",
        content: query.trim(),
      },
    });

    // 3. Execute RAG retrieval and synthesis
    const ragResult = await executeRagQuery({
      userId: user.id,
      query: query.trim(),
      scopeType,
      scopeDocumentIds,
      scopeCategory,
      conversationId: convId,
    });

    // 4. Save assistant response with citations
    const assistantMessage = await db.conversationMessage.create({
      data: {
        conversationId: convId,
        role: "assistant",
        content: ragResult.answer,
        sourcesJson: JSON.stringify(ragResult.sources),
        evidenceQuality: ragResult.evidenceQuality,
        insufficientEvidence: ragResult.insufficientEvidence,
        retrievalMode: ragResult.retrievalMode,
        externalProviderUsed: ragResult.providerUsed,
      },
    });

    // 5. Audit event (privacy-safe, records query length and source count)
    await db.auditEvent.create({
      data: {
        userId: user.id,
        action: "QUERY_SEARCH",
        resourceType: "conversation",
        resourceId: convId,
        detailsJson: JSON.stringify({
          queryLength: query.trim().length,
          evidenceQuality: ragResult.evidenceQuality,
          sourcesCount: ragResult.sources.length,
          provider: ragResult.providerUsed,
        }),
      },
    });

    return NextResponse.json({
      conversationId: convId,
      messageId: assistantMessage.id,
      answer: ragResult.answer,
      sources: ragResult.sources,
      evidenceQuality: ragResult.evidenceQuality,
      insufficientEvidence: ragResult.insufficientEvidence,
      retrievalMode: ragResult.retrievalMode,
      providerUsed: ragResult.providerUsed,
      activeMemoriesCount: ragResult.activeMemoriesCount,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Chat error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
