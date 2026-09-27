import { Container } from "@/components/ui/Container";
import { COLLABORATORS, HOST } from "@/lib/site-config";

/** Host institution and collaborators, shown under the homepage hero. */
export function HostStrip() {
  return (
    <section aria-label="Hosts and collaborators" className="border-b border-[var(--line)] bg-night py-10 sm:py-12">
      <Container className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-14">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-gold uppercase">Hosted by</p>
          <p className="mt-3 font-display text-2xl text-flare">{HOST.name}</p>
          <p className="mt-1 text-sm text-mist">{HOST.accreditation}</p>
          <p className="mt-1 text-sm text-mist">{HOST.address}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-gold uppercase">In collaboration with</p>
          <ul className="mt-3 flex flex-wrap gap-2.5">
            {COLLABORATORS.map((name) => (
              <li key={name} className="rounded-full border border-[var(--line-strong)] bg-void px-4 py-2 text-sm text-flare">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
