import { cache } from "react";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { PrismaClient, User } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { bootstrapAdminClerkUserId, isClerkConfigured } from "@/lib/env";
import { guestActor, type Actor } from "@/lib/authorization";

async function readClerkUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch (error) {
    console.error("Clerk auth() indisponible", error);
    return null;
  }
}

async function readClerkProfile() {
  try {
    return await currentUser();
  } catch (error) {
    console.error("Clerk currentUser() indisponible", error);
    return null;
  }
}

export const getActor = cache(async (): Promise<Actor> => {
  if (!isClerkConfigured()) {
    return guestActor();
  }

  const userId = await readClerkUserId();
  if (!userId) {
    return guestActor();
  }

  const user = await syncAppUser(userId);
  return {
    isAuthenticated: true,
    clerkUserId: userId,
    user,
  };
});

export async function requireActor(): Promise<Actor & { clerkUserId: string }> {
  const actor = await getActor();
  if (!actor.isAuthenticated || !actor.clerkUserId) {
    redirect("/sign-in");
  }

  return {
    ...actor,
    clerkUserId: actor.clerkUserId,
  };
}

export const syncAppUser = cache(async (clerkUserId: string): Promise<User | null> => {
  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }

  try {
    return await persistAppUser(prisma, clerkUserId);
  } catch (error) {
    console.error("Synchronisation utilisateur impossible", error);
    return null;
  }
});

async function persistAppUser(prisma: PrismaClient, clerkUserId: string): Promise<User> {
  const isBootstrapAdmin = bootstrapAdminClerkUserId() === clerkUserId;
  const existing = await prisma.user.findUnique({ where: { clerkUserId } });

  if (existing) {
    const promoteToAdmin = isBootstrapAdmin && existing.role === "GUEST";
    const stale =
      !existing.lastSignedInAt || Date.now() - existing.lastSignedInAt.getTime() > 15 * 60 * 1000;
    if (!promoteToAdmin && !stale) {
      return existing;
    }

    const clerkUser = stale ? await readClerkProfile() : null;
    return prisma.user.update({
      where: { clerkUserId },
      data: {
        lastSignedInAt: new Date(),
        ...(promoteToAdmin ? { role: "ADMIN" as const } : {}),
        ...(clerkUser
          ? {
              email:
                clerkUser.primaryEmailAddress?.emailAddress ??
                clerkUser.emailAddresses[0]?.emailAddress ??
                existing.email,
              firstName: clerkUser.firstName ?? existing.firstName,
              lastName: clerkUser.lastName ?? existing.lastName,
            }
          : {}),
      },
    });
  }

  const clerkUser = await readClerkProfile();
  return prisma.user.create({
    data: {
      clerkUserId,
      email: clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress ?? null,
      firstName: clerkUser?.firstName ?? null,
      lastName: clerkUser?.lastName ?? null,
      lastSignedInAt: new Date(),
      role: isBootstrapAdmin ? "ADMIN" : "GUEST",
    },
  });
}
