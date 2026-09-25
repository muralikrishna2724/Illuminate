"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRenderer, type BlackHoleFraming, type BlackHoleQuality } from "./optimized-black-hole-utils/renderer";

/**
 * Standalone host for the optimized WebGL black-hole renderer.
 *
 * Decorative only: hidden from assistive tech and never intercepts pointer
 * events, so it can sit behind buttons and forms. `fallback` is shown until
 * the first frame is ready, and permanently if WebGL is unavailable.
 */
export function Example({
  framing = "center",
  quality = "auto",
  fallback,
  className = "",
}: {
  framing?: BlackHoleFraming;
  quality?: BlackHoleQuality;
  fallback?: ReactNode;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createRenderer({ canvas, framing, quality });
    void renderer.ready.then((ok) => {
      if (!cancelled && ok) setIsReady(true);
    });
    return () => {
      cancelled = true;
      renderer.dispose();
    };
  }, [framing, quality]);

  return (
    <div aria-hidden="true" className={`pointer-events-none relative h-full w-full overflow-hidden bg-black ${className}`}>
      {fallback && !isReady && <div className="absolute inset-0">{fallback}</div>}
      <canvas
        ref={canvasRef}
        className={`block h-full w-full touch-none transition-opacity duration-700 ${isReady ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

export default Example;
