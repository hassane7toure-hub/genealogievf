import Image from "next/image";
import { BRAND_PORTRAIT } from "@/lib/brand";

export function HeritageWatermark() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-full max-w-5xl md:w-[62%]">
        <Image
          src={BRAND_PORTRAIT}
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 62vw"
          className="object-cover object-[center_12%] opacity-[0.16]"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background/30 via-background/75 to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>
    </div>
  );
}
