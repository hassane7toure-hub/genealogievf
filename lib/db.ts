import { PrismaClient } from "@prisma/client";
import { isDatabaseConfigured } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function withPrismaPoolParams(url: string) {
  const extras: string[] = [];
  if (!/[?&]connection_limit=/.test(url)) extras.push("connection_limit=3");
  if (!/[?&]pool_timeout=/.test(url)) extras.push("pool_timeout=20");
  if (url.includes("pooled.") && !/[?&]pgbouncer=/.test(url)) extras.push("pgbouncer=true");
  if (extras.length === 0) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${extras.join("&")}`;
}

export function getPrisma(): PrismaClient | null {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasourceUrl: withPrismaPoolParams(process.env.DATABASE_URL as string),
    });
  }

  return globalForPrisma.prisma;
}

export function requirePrisma(): PrismaClient {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_URL n'est pas configurée.");
  }
  return prisma;
}
