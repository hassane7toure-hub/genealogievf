import { cache } from "react";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { bootstrapAdminClerkUserId, isClerkConfigured } from "@/lib/env";
import { guestActor, type Actor } from "@/lib/authorization";

export const getActor = cache(async (): Promise<Actor> => {
  if (!isClerkConfigured()) {
    return guestActor();
  }

  const { userId } = await auth();
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

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress ?? null;
  const firstName = clerkUser?.firstName ?? null;
  const lastName = clerkUser?.lastName ?? null;
  const isBootstrapAdmin = bootstrapAdminClerkUserId() === clerkUserId;

  const existing = await prisma.user.findUnique({ where: { clerkUserId } });

  if (existing) {
    return prisma.user.update({
      where: { clerkUserId },
      data: {
        email,
        firstName,
        lastName,
        lastSignedInAt: new Date(),
        ...(isBootstrapAdmin && existing.role === "GUEST" ? { role: "ADMIN" as const } : {}),
      },
    });
  }

  return prisma.user.create({
    data: {
      clerkUserId,
      email,
      firstName,
      lastName,
      lastSignedInAt: new Date(),
      role: isBootstrapAdmin ? "ADMIN" : "GUEST",
    },
  });
});
