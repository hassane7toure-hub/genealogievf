import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { clerkJsBrowserPath, clerkUiBrowserPath } from "@/lib/clerk-assets";

const localClerkScripts = {
  __internal_clerkJSUrl: clerkJsBrowserPath,
  __internal_clerkUIUrl: clerkUiBrowserPath,
};

export function HeritageClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ theme: shadcn }} {...localClerkScripts}>
      {children}
    </ClerkProvider>
  );
}
