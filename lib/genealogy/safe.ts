import { isDatabaseConfigured } from "@/lib/env";

export async function loadGenealogy<T>(
  loader: () => Promise<T>,
  fallback: T,
): Promise<{ value: T; unavailable: boolean }> {
  if (!isDatabaseConfigured()) {
    return { value: fallback, unavailable: true };
  }

  try {
    return { value: await loader(), unavailable: false };
  } catch {
    return { value: fallback, unavailable: true };
  }
}
