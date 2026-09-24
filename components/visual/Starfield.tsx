"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  base: number;
  phase: number;
  speed: number;
  warm: boolean;
}

/**
 * Lightweight canvas starfield.
 * - density scales with viewport and `density` prop; fewer stars on small screens
 * - devicePixelRatio capped for performance
 * - pauses when off-screen or when the tab is hidden
 * - renders a single static frame under prefers-reduced-motion
 */
export function Starfield({ density = 1, className = "" }: { density?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;
    let visible = true;
    let last = 0;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const isSmall = width < 768;
      const perPixel = (isSmall ? 0.00008 : 0.00014) * density;
      const count = Math.min(isSmall ? 110 : 320, Math.round(width * height * perPixel));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() < 0.92 ? Math.random() * 0.8 + 0.2 : Math.random() * 1.1 + 0.8,
        base: Math.random() * 0.55 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.6 + 0.2,
        warm: Math.random() < 0.25,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        const twinkle = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(s.phase + (t / 1000) * s.speed);
        ctx.globalAlpha = s.base * twinkle;
        ctx.fillStyle = s.warm ? "#ffd9a8" : "#fff6ea";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      if (!running) return;
      // ~30fps is plenty for a twinkle.
      if (t - last > 33) {
        draw(t);
        last = t;
      }
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduceMotion || running || !visible || document.hidden) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    build();
    draw(0);
    start();

    const resizeObserver = new ResizeObserver(() => {
      build();
      draw(performance.now());
    });
    resizeObserver.observe(canvas);

    const intersection = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) start();
      else stop();
    });
    intersection.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
