import Image from "next/image";
import { visualConfig } from "@/lib/site-config";

type Intensity = "hero" | "subtle" | "faint";

const WRAPPER: Record<Intensity, string> = {
  hero: "opacity-100",
  subtle: "opacity-55",
  faint: "opacity-30",
};

/**
 * The central black-hole visual: event horizon, photon ring, lensed halo and
 * a tilted accretion disk with Doppler-brightened left side.
 *
 * Purely decorative — aria-hidden and pointer-events: none, so it can never
 * block buttons or form fields. Motion is limited to slow CSS animations that
 * are disabled under `prefers-reduced-motion`.
 */
export function BlackHole({ intensity = "hero", className = "" }: { intensity?: Intensity; className?: string }) {
  if (visualConfig.blackHoleImage) {
    return (
      <div aria-hidden="true" className={`pointer-events-none relative aspect-square select-none ${WRAPPER[intensity]} ${className}`}>
        <Image src={visualConfig.blackHoleImage} alt="" fill priority={intensity === "hero"} sizes="(max-width: 768px) 100vw, 60vw" className="object-contain" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={`pointer-events-none relative aspect-square select-none ${WRAPPER[intensity]} ${className}`}>
      {/* Ambient bloom */}
      <div
        className="absolute -inset-[35%] rounded-full animate-breathe"
        style={{
          background:
            "radial-gradient(circle closest-side at 50% 50%, rgb(236 154 82 / 0.20) 0%, rgb(236 154 82 / 0.08) 28%, rgb(120 60 20 / 0.04) 45%, transparent 64%)",
        }}
      />

      {/* Lensed halo — the far side of the disk bent around the shadow (hugs the photon ring) */}
      <div
        className="absolute inset-[25%] rounded-full"
        style={{
          background:
            "radial-gradient(circle closest-side, transparent 60%, rgb(255 236 205 / 0.9) 63.5%, rgb(246 178 100 / 0.65) 68%, rgb(200 100 40 / 0.28) 78%, transparent 92%)",
          filter: "blur(3px)",
        }}
      />
      {/* Upper lensed arc — brighter over the top of the shadow */}
      <div
        className="absolute inset-[25%] rounded-full"
        style={{
          background:
            "radial-gradient(circle closest-side, transparent 60%, rgb(255 246 230 / 0.95) 63%, rgb(250 196 128 / 0.8) 69%, rgb(220 120 50 / 0.35) 80%, transparent 94%)",
          WebkitMask: "linear-gradient(to bottom, #000 0%, #000 30%, transparent 52%)",
          mask: "linear-gradient(to bottom, #000 0%, #000 30%, transparent 52%)",
          filter: "blur(2px)",
        }}
      />
      {/* Slow shimmer travelling around the ring */}
      <div
        className="absolute inset-[25%] rounded-full animate-spin-slow"
        style={{
          background:
            "conic-gradient(from 200deg, rgb(255 244 224 / 0), rgb(255 244 224 / 0.4) 12%, rgb(255 244 224 / 0) 30%, rgb(255 210 150 / 0.3) 55%, rgb(255 244 224 / 0) 75%)",
          WebkitMask: "radial-gradient(circle closest-side, transparent 60%, #000 63%, #000 72%, transparent 82%)",
          mask: "radial-gradient(circle closest-side, transparent 60%, #000 63%, #000 72%, transparent 82%)",
          filter: "blur(3px)",
        }}
      />

      {/* Accretion disk — back section (mostly hidden behind the shadow) */}
      <div
        className="absolute left-1/2 top-1/2 h-[15%] w-[128%] -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, transparent 26%, rgb(255 238 208 / 0.95) 30%, rgb(246 178 100 / 0.85) 38%, rgb(210 110 45 / 0.45) 52%, rgb(120 50 15 / 0.15) 68%, transparent 80%)",
          filter: "blur(2.5px)",
        }}
      />

      {/* Relativistic beaming — the approaching (left) side of the disk is brighter */}
      <div
        className="absolute left-1/2 top-1/2 h-[12%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] mix-blend-screen"
        style={{
          background: "linear-gradient(90deg, rgb(255 244 224 / 0.55) 0%, rgb(255 220 170 / 0.25) 30%, transparent 55%, transparent 100%)",
          WebkitMask: "radial-gradient(ellipse 50% 50% at 50% 50%, transparent 30%, #000 40%, #000 60%, transparent 78%)",
          mask: "radial-gradient(ellipse 50% 50% at 50% 50%, transparent 30%, #000 40%, #000 60%, transparent 78%)",
          filter: "blur(3px)",
        }}
      />
      {/* Event horizon shadow */}
      <div
        className="absolute inset-[34.5%] rounded-full bg-black"
        style={{ boxShadow: "0 0 50px 18px rgb(0 0 0 / 0.95), inset 0 0 30px rgb(0 0 0)" }}
      />

      {/* Photon ring */}
      <div
        className="absolute inset-[33.6%] rounded-full"
        style={{
          boxShadow:
            "0 0 0 1.5px rgb(255 240 215 / 0.9), 0 0 14px 3px rgb(245 198 136 / 0.6), 0 0 42px 8px rgb(236 154 82 / 0.25), inset 0 0 10px 1px rgb(245 198 136 / 0.4)",
        }}
      />

      {/* Accretion disk — front section crossing in front of the shadow */}
      <div
        className="absolute left-1/2 top-[51.5%] h-[9%] w-[124%] -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
        style={{
          WebkitMask: "linear-gradient(to bottom, transparent 30%, #000 60%)",
          mask: "linear-gradient(to bottom, transparent 30%, #000 60%)",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgb(255 240 214 / 0.9) 0%, rgb(255 232 196 / 0.95) 20%, rgb(246 178 100 / 0.8) 36%, rgb(210 110 45 / 0.4) 54%, rgb(120 50 15 / 0.12) 70%, transparent 82%)",
          filter: "blur(1.5px)",
        }}
      />

    </div>
  );
}
