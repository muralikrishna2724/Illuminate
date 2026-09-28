import "server-only";
import type { EventSlug, PaymentStatus } from "@/types/domain";

/**
 * WhatsApp group invite for each event. Server-only so the links are never in
 * the public page bundle: they are sent only to people who have registered
 * (on the registration confirmation and on their dashboard).
 */
const WHATSAPP_GROUPS: Record<EventSlug, string> = {
  hackathon: "https://chat.whatsapp.com/CSMOTQLozq094UTghjHVC0",
  debate: "https://chat.whatsapp.com/BAq9wEEfPrD52c6ioCY28C",
  "ipl-auction": "https://chat.whatsapp.com/BAAuZfMrija6FzDlM9aIMI",
  illuminate: "https://chat.whatsapp.com/IvFVUR5efhI3Y1JXc3v5EN",
};

/** The event's group link, withheld once a payment has been rejected. */
export function whatsappGroupFor(slug: EventSlug, status: PaymentStatus): string | null {
  return status === "REJECTED" ? null : WHATSAPP_GROUPS[slug];
}
