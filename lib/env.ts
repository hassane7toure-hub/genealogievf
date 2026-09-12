export function isClerkConfigured(): boolean {
  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secret = process.env.CLERK_SECRET_KEY;
  return Boolean(publishable?.startsWith("pk_") && secret?.startsWith("sk_"));
}

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.startsWith("postgres"));
}

export function bootstrapAdminClerkUserId(): string | null {
  return process.env.BOOTSTRAP_ADMIN_CLERK_USER_ID?.trim() || null;
}
