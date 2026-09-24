import { HeritageClerkProvider } from "@/components/heritage/heritage-clerk-provider";
import type { Metadata } from "next";
import { Cormorant_Garamond, Figtree, Geist_Mono } from "next/font/google";
import { HeritageWatermark } from "@/components/brand/heritage-watermark";
import { AppProviders } from "@/components/providers";
import { BRAND_PORTRAIT } from "@/lib/brand";
import "@clerk/ui/themes/shadcn.css";
import "./globals.css";
import { cn } from "@/lib/utils";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TOURÉ FAMILY HERITAGE",
    template: "%s · TOURÉ FAMILY HERITAGE",
  },
  description:
    "Plateforme de préservation généalogique, historique et culturelle de la Grande Famille TOURÉ.",
  icons: {
    icon: BRAND_PORTRAIT,
    apple: BRAND_PORTRAIT,
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={cn("h-full", "antialiased", figtree.variable, cormorant.variable, geistMono.variable, "font-sans")}
    >
      <body className="relative min-h-full flex flex-col">
        <HeritageClerkProvider>
          <HeritageWatermark />
          <div className="relative z-10 flex min-h-full flex-1 flex-col">
            <AppProviders>{children}</AppProviders>
          </div>
        </HeritageClerkProvider>
      </body>
    </html>
  );
}