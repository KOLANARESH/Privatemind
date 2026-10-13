import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();

    let settings = await db.privacySetting.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      settings = await db.privacySetting.create({
        data: {
          userId: user.id,
          persistentMemoryEnabled: true,
          allowExternalAiProcessing: true,
          preferredAiProvider: "lyzr-studio",
          lyzrAgentId: process.env.LYZR_AGENT_ID || "6ace474e031adebb0bc93b2a",
        },
      });
    }

    // Never return the raw API key to client!
    const lyzrApiKeyConfigured = Boolean(
      process.env.LYZR_API_KEY && !process.env.LYZR_API_KEY.includes("your-api-key")
    );

    return NextResponse.json({
      settings,
      providerInfo: {
        lyzrAgentId: process.env.LYZR_AGENT_ID || "6ace474e031adebb0bc93b2a",
        lyzrApiKeyConfigured,
        lyzrUserId: process.env.LYZR_USER_ID ? "Configured (Private)" : "Not Configured",
        endpoint: "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
        storageLocation: "Local SQLite + Private Local Vault",
        encryptionAtRest: "Host OS Protected / Zero External Cloud Storage",
      },
      aiProcessingDisclosure: {
        whenExternalEnabled:
          "When enabled, sanitized query context is forwarded via encrypted HTTPS to Lyzr Studio agent for answer generation. No user identity or raw full-disk documents are transmitted.",
        whenExternalDisabled:
          "When disabled, 100% of retrieval, semantic scoring, and grounded answer synthesis executes locally on your machine with zero outbound network calls.",
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getSessionUser();
    const body = await req.json();

    const {
      persistentMemoryEnabled,
      allowExternalAiProcessing,
      defaultRetentionDays,
      preferredAiProvider,
    } = body;

    const updated = await db.privacySetting.upsert({
      where: { userId: user.id },
      update: {
        ...(typeof persistentMemoryEnabled === "boolean" && { persistentMemoryEnabled }),
        ...(typeof allowExternalAiProcessing === "boolean" && { allowExternalAiProcessing }),
        ...(typeof defaultRetentionDays === "number" && { defaultRetentionDays }),
        ...(preferredAiProvider && { preferredAiProvider }),
      },
      create: {
        userId: user.id,
        persistentMemoryEnabled: persistentMemoryEnabled ?? true,
        allowExternalAiProcessing: allowExternalAiProcessing ?? true,
        defaultRetentionDays: defaultRetentionDays ?? 0,
        preferredAiProvider: preferredAiProvider ?? "lyzr-studio",
      },
    });

    await db.auditEvent.create({
      data: {
        userId: user.id,
        action: "SETTINGS_UPDATE",
        resourceType: "settings",
        detailsJson: JSON.stringify({
          persistentMemoryEnabled: updated.persistentMemoryEnabled,
          allowExternalAiProcessing: updated.allowExternalAiProcessing,
        }),
      },
    });

    return NextResponse.json({ settings: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
