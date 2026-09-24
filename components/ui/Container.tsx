import type { ReactNode } from "react";

const WIDTHS = {
  default: "max-w-6xl",
  narrow: "max-w-4xl",
  tight: "max-w-3xl",
  compact: "max-w-2xl",
} as const;

export function Container({
  children,
  className = "",
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: keyof typeof WIDTHS;
}) {
  return <div className={`mx-auto w-full ${WIDTHS[size]} px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm font-medium text-gold/90 ${className}`}>{children}</p>;
}

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-dashed border-gold/40 bg-gold/5 px-1.5 py-0.5 font-mono text-[0.8em] text-gold/90">
      {children}
    </span>
  );
}
