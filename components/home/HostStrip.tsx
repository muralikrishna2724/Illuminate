import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { COLLABORATORS, HOST, ORGANISER, type Partner } from "@/lib/site-config";

/** Host, organiser and collaborators as a partner bar under the homepage hero. */
export function HostStrip() {
  return (
    <section aria-label="Host, organiser and partners" className="border-b border-[var(--line)] bg-night py-12 sm:py-14">
      <Container>
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:gap-12">
          <div className="flex items-start gap-5">
            <LogoBadge src={HOST.logo.src} width={HOST.logo.width} height={HOST.logo.height} alt={`${HOST.name} logo`} />
            <div>
              <p className="text-xs font-medium tracking-[0.16em] text-gold uppercase">Hosted by</p>
              <p className="mt-2 font-display text-2xl text-flare">{HOST.name}</p>
              <p className="mt-1 text-sm text-mist">{HOST.accreditation}</p>
              <p className="mt-1 text-sm text-mist">{HOST.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-5">
            <LogoBadge src={ORGANISER.logo.src} width={ORGANISER.logo.width} height={ORGANISER.logo.height} alt={`${ORGANISER.name} logo`} />
            <div>
              <p className="text-xs font-medium tracking-[0.16em] text-gold uppercase">Organised by</p>
              <p className="mt-2 font-display text-2xl text-flare">{ORGANISER.name}</p>
            </div>
          </div>
        </div>

        <p className="mt-12 text-xs font-medium tracking-[0.16em] text-gold uppercase">In collaboration with</p>
        <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {COLLABORATORS.map((partner) => (
            <PartnerTile key={partner.name} partner={partner} />
          ))}
        </ul>
      </Container>
    </section>
  );
}

function LogoBadge({ src, width, height, alt }: { src: string; width: number; height: number; alt: string }) {
  return (
    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-white p-2 shadow-sm">
      <Image src={src} alt={alt} width={width} height={height} className="h-full w-full object-contain" />
    </span>
  );
}

function PartnerTile({ partner }: { partner: Partner }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-void shadow-sm">
      <div className={`flex h-36 items-center justify-center p-3 ${partner.darkLogo ? "bg-black" : "bg-white"}`}>
        {partner.logo ? (
          <Image
            src={partner.logo.src}
            alt={`${partner.name} logo`}
            width={partner.logo.width}
            height={partner.logo.height}
            className="h-full w-auto max-w-full object-contain"
          />
        ) : (
          <span className="text-center font-display text-2xl leading-tight text-flare">{partner.name.split(" (")[0]}</span>
        )}
      </div>
      <p className="border-t border-[var(--line)] px-4 py-3 text-center text-xs leading-snug text-mist">{partner.name}</p>
    </li>
  );
}
