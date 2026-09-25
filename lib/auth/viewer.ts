import "server-only";
import { getParticipantProfile } from "@/services/participant-service";
import type { Viewer } from "@/types/domain";
import { getCurrentAdmin, getCurrentParticipantEmail } from "./session";

/**
 * Who is looking at the public site. Only touches the database when a session
 * cookie is present, so anonymous visitors cost nothing extra.
 */
export async function getViewer(): Promise<Viewer> {
  const admin = await getCurrentAdmin();
  if (admin) return { role: "admin", name: admin.name, email: admin.email };

  const email = await getCurrentParticipantEmail();
  if (!email) return null;
  const profile = await getParticipantProfile(email);
  return { role: "participant", name: profile?.name ?? email, email };
}
