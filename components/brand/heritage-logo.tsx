import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND_PORTRAIT, BRAND_PORTRAIT_ALT } from "@/lib/brand";

const sizes = {
  sm: { px: 36, text: "text-base", subtitle: "text-[10px]" },
  md: { px: 44, text: "text-lg", subtitle: "text-[11px]" },
  lg: { px: 64, text: "text-2xl", subtitle: "text-xs" },
} as const;

export function HeritageLogo({
  href = "/",
  size = "md",
  subtitle = "Family Heritage",
  className,
  priority = false,
}: {
  href?: string;
  size?: keyof typeof sizes;
  subtitle?: string;
  className?: string;
  priority?: boolean;
}) {
  const spec = sizes[size];

  return (
    <Link href={href} className={cn("flex min-w-0 items-center gap-3", className)}>
      <Image
        src={BRAND_PORTRAIT}
        alt={BRAND_PORTRAIT_ALT}
        width={spec.px}
        height={spec.px}
        priority={priority}
        className="shrink-0 rounded-full object-cover ring-1 ring-foreground/15"
        style={{ width: spec.px, height: spec.px, objectPosition: "center 18%" }}
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className={cn("font-heading tracking-wide text-foreground", spec.text)}>TOURÉ</span>
        <span className={cn("uppercase tracking-[0.22em] text-muted-foreground", spec.subtitle)}>
          {subtitle}
        </span>
      </span>
    </Link>
  );
}
