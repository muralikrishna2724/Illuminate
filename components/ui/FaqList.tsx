import type { FaqItem } from "@/lib/faq";

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {items.map((faq) => (
        <details key={faq.id} id={faq.id} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-md py-5 text-left text-lg text-flare marker:hidden [&::-webkit-details-marker]:hidden">
            <span>{faq.question}</span>
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--line-strong)] text-mist transition-transform duration-300 group-open:rotate-45"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <p className="max-w-3xl pb-6 leading-relaxed text-mist">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
