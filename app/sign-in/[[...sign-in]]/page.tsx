import { SignIn } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/env";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { SetupBanner } from "@/components/heritage/setup-banner";

export default function SignInPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {isClerkConfigured() ? (
          <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
        ) : (
          <div className="w-full max-w-lg">
            <SetupBanner />
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
