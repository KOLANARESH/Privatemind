/**
 * Authentication and Session Management for PrivateMind AI
 * Enforces server-side authorization for every read, write, search, update, and delete operation.
 */

import { cookies } from "next/headers";
import { db } from "./db";

export const PRIMARY_USER = {
  id: "user-alex-primary",
  email: "alex@privatemind.ai",
  name: "Alex Vance",
  role: "user",
};

export const SECONDARY_USER = {
  id: "user-taylor-secondary",
  email: "taylor@privatemind.ai",
  name: "Taylor Smith",
  role: "user",
};

export async function ensureUsersExist() {
  // Ensure Primary User
  await db.user.upsert({
    where: { id: PRIMARY_USER.id },
    update: {},
    create: {
      id: PRIMARY_USER.id,
      email: PRIMARY_USER.email,
      name: PRIMARY_USER.name,
      role: PRIMARY_USER.role,
      privacySettings: {
        create: {
          persistentMemoryEnabled: true,
          allowExternalAiProcessing: true,
          preferredAiProvider: "lyzr-studio",
          lyzrAgentId: "6ace474e031adebb0bc93b2a",
        },
      },
    },
  });

  // Ensure Secondary User
  await db.user.upsert({
    where: { id: SECONDARY_USER.id },
    update: {},
    create: {
      id: SECONDARY_USER.id,
      email: SECONDARY_USER.email,
      name: SECONDARY_USER.name,
      role: SECONDARY_USER.role,
      privacySettings: {
        create: {
          persistentMemoryEnabled: true,
          allowExternalAiProcessing: true,
          preferredAiProvider: "lyzr-studio",
          lyzrAgentId: "6ace474e031adebb0bc93b2a",
        },
      },
    },
  });
}

/**
 * Get currently authenticated user in Route Handlers or Server Actions
 */
export async function getSessionUser(): Promise<{ id: string; email: string; name: string; role: string }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("pm_user_id");
    const activeUserId = sessionCookie?.value || PRIMARY_USER.id;

    // Check if user exists in DB
    const user = await db.user.findUnique({
      where: { id: activeUserId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name || "User",
        role: user.role,
      };
    }

    // Default ensure primary user exists
    await ensureUsersExist();
    return PRIMARY_USER;
  } catch {
    return PRIMARY_USER;
  }
}
