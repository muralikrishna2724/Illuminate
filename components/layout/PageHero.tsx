import type { ReactNode } from "react";
import { Starfield } from "@/components/visual/Starfield";

/** Header band for internal pages — a quieter version of the homepage hero. */
export function PageHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden pb-16 pt-36 sm:pb-24 sm:pt-44">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <Starfield density={0.5} />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-void" />
      </div>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {eyebrow && <p className="text-sm text-gold/90 sm:text-base">{eyebrow}</p>}
        <h1 className="mt-3 font-display text-6xl leading-[0.92] text-flare sm:text-8xl">{title}</h1>
        {children && <div className="mt-6 max-w-2xl text-lg leading-relaxed text-sand/85">{children}</div>}
      </div>
    </section>
  );
}
