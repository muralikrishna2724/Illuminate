import Image from "next/image";
import OptimizedBlackHole from "@/components/ui/optimized-black-hole";

type Intensity = "subtle" | "faint";

const OPACITY: Record<Intensity, string> = {
  subtle: "opacity-70",
  faint: "opacity-40",
};

/**
 * Quiet black-hole accent for internal pages: a still frame rendered by the
 * WebGL renderer (public/images/black-hole.jpg). Only the homepage hero runs
 * the live renderer, so internal pages stay light.
 *
 * `mix-blend-screen` makes the black background disappear into the page and a
 * radial mask fades the square edges. Decorative only.
 */
export function BlackHole({ intensity = "subtle", className = "" }: { intensity?: Intensity; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative aspect-square select-none mix-blend-screen ${OPACITY[intensity]} ${className}`}
      style={{
        WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
        maskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
      }}
    >
      <Image src="/images/black-hole.jpg" alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
    </div>
  );
}

/** Full-bleed live black hole for the homepage hero, with a still frame while it loads (or if WebGL is unavailable). */
export function HeroBlackHole() {
  return (
    <OptimizedBlackHole
      framing="hero"
      fallback={
        <Image
          src="/images/black-hole-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[71%_45%]"
        />
      }
    />
  );
}
