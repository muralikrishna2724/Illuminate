import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizManager } from "@/components/admin/QuizManager";
import { RegistrationsManager } from "@/components/admin/RegistrationsManager";
import { EVENTS, feeLabel } from "@/lib/events/catalog";
import { getDashboardStats } from "@/services/admin-registration-service";
import { getQuizConfig, QUIZ_EVENT_SLUG } from "@/services/quiz-service";
import { EVENT_SLUGS, isEventSlug } from "@/types/domain";

export const dynamicParams = false;

export function generateStaticParams() {
  return EVENT_SLUGS.map((event) => ({ event }));
}

export async function generateMetadata({ params }: PageProps<"/admin/[event]">): Promise<Metadata> {
  const { event } = await params;
  return { title: isEventSlug(event) ? EVENTS[event].name : "Event" };
}

export default async function AdminEventPage({ params }: PageProps<"/admin/[event]">) {
  const { event: slug } = await params;
  if (!isEventSlug(slug)) notFound();
  const event = EVENTS[slug];

  const [stats, quiz] = await Promise.all([getDashboardStats(), slug === QUIZ_EVENT_SLUG ? getQuizConfig() : Promise.resolve(null)]);
  const counts = stats.byEvent.find((e) => e.slug === slug);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm text-mist">
            Day {event.day} · {event.dateLabel} · {feeLabel(event)}
          </p>
          <h1 className="mt-1 text-2xl font-medium text-flare">{event.name}</h1>
        </div>
        {counts && (
          <dl className="flex gap-6 text-sm tabular-nums">
            <div>
              <dt className="text-xs text-mist">Total</dt>
              <dd className="text-xl text-flare">{counts.total}</dd>
            </div>
            <div>
              <dt className="text-xs text-mist">Pending</dt>
              <dd className="text-xl text-amber-200">{counts.pending}</dd>
            </div>
            <div>
              <dt className="text-xs text-mist">Verified</dt>
              <dd className="text-xl text-emerald-200">{counts.verified}</dd>
            </div>
            <div>
              <dt className="text-xs text-mist">Rejected</dt>
              <dd className="text-xl text-red-200">{counts.rejected}</dd>
            </div>
          </dl>
        )}
      </div>

      {quiz && <QuizManager initial={quiz} />}

      <RegistrationsManager fixedEvent={slug} title={`${event.name} registrations`} />
    </div>
  );
}
