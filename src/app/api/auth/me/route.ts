import { NextResponse } from "next/server";
import { getSessionUser, PRIMARY_USER, SECONDARY_USER } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  const privacySettings = await db.privacySetting.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({
    user,
    switchableUsers: [PRIMARY_USER, SECONDARY_USER],
    privacySettings: privacySettings || {
      persistentMemoryEnabled: true,
      allowExternalAiProcessing: true,
      preferredAiProvider: "lyzr-studio",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const targetUserId = body.userId;

    if (targetUserId !== PRIMARY_USER.id && targetUserId !== SECONDARY_USER.id) {
      return NextResponse.json({ error: "Invalid user identifier" }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      activeUserId: targetUserId,
    });

    response.cookies.set("pm_user_id", targetUserId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
